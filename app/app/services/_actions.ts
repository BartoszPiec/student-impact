"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { openChatForOfferInquiry } from "../chat/_actions";
import { resolveCommissionRate } from "@/lib/commission";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { sendNotification } from "@/lib/notifications/server";
import { UUID_RE } from "@/lib/security/validation";
import { logCriticalError } from "@/lib/observability/error-log";
import {
    buildAcceptedQuoteSnapshot,
    buildCompanyCounterSnapshot,
    buildPrivateProposalLegacyText,
    buildPrivateProposalRequestSnapshot,
    buildRejectedQuoteSnapshot,
    buildStudentProposalSnapshot,
    isQuoteSnapshot,
    type ServiceOrderQuoteSnapshot,
} from "@/lib/services/service-order-snapshots";
import { assertStudentCanPrivatelyProposeToCompany } from "@/lib/services/private-proposals";
import {
    ensureConversationForServiceOrder,
    findConversationForServiceOrder,
} from "@/lib/services/service-order-conversations";
import { LOGO_PACKAGE_ID } from "@/lib/services/logo-student-selection";
import type { SupabaseClient } from "@supabase/supabase-js";

type ServiceOrderNegotiationRow = {
    id: string;
    student_id: string;
    company_id: string;
    package_id: string | null;
    status?: string | null;
    quote_snapshot?: ServiceOrderQuoteSnapshot | null;
    package: { title?: string | null } | null;
};

const SERVICE_STATUS_VALUES = ["active", "inactive"] as const;
const SERVICE_ORDER_STUDENT_QUOTE_STATUSES = ["inquiry", "pending"] as const;
const SERVICE_ORDER_COMPANY_ACCEPT_STATUSES = ["proposal_sent"] as const;
const SERVICE_ORDER_COUNTER_STATUSES = ["proposal_sent"] as const;
const SERVICE_ORDER_STUDENT_COUNTER_ACCEPT_STATUSES = ["countered"] as const;
const SERVICE_ORDER_REJECTABLE_STATUSES = [
    "inquiry",
    "pending",
    "pending_selection",
    "pending_student_confirmation",
    "pending_confirmation",
    "proposal_sent",
    "countered",
] as const;
const SERVICE_ORDER_SELECTION_STATUSES = ["pending_selection", "pending"] as const;
const SERVICE_ORDER_CONFIRMATION_STATUSES = [
    "pending_student_confirmation",
    "pending_confirmation",
    "pending",
    "inquiry",
] as const;
const MAX_SERVICE_AMOUNT_PLN = 100_000;
const SERVICE_CATEGORY_SET = new Set<string>(SERVICE_CATEGORIES);

const uuidInputSchema = z.string().trim().regex(UUID_RE, "Nieprawidłowy identyfikator.");
const optionalTextSchema = (max: number, message: string) =>
    z.preprocess(
        (value) => (value == null ? "" : value),
        z.string().trim().max(max, message),
    );
const requiredTextSchema = (min: number, max: number, requiredMessage: string, maxMessage: string) =>
    z.preprocess(
        (value) => (value == null ? "" : value),
        z.string().trim().min(min, requiredMessage).max(max, maxMessage),
    );
const moneySchema = z.preprocess(
    (value) => (typeof value === "string" ? value.replace(",", ".") : value),
    z.coerce
        .number()
        .finite("Podaj prawidłową kwotę.")
        .min(1, "Kwota musi być większa od zera.")
        .max(MAX_SERVICE_AMOUNT_PLN, "Kwota przekracza limit dla pakietu usług."),
).transform((value) => Number(value.toFixed(2)));
const optionalMoneySchema = z.preprocess(
    (value) => {
        if (value == null || value === "") return null;
        return typeof value === "string" ? value.replace(",", ".") : value;
    },
    z.coerce
        .number()
        .finite("Podaj prawidłową kwotę maksymalną.")
        .min(1, "Cena maksymalna musi być większa od zera.")
        .max(MAX_SERVICE_AMOUNT_PLN, "Cena maksymalna przekracza limit dla pakietu usług.")
        .nullable(),
).transform((value) => (value == null ? null : Number(value.toFixed(2))));
const storageOrHttpsRefSchema = z
    .string()
    .trim()
    .min(1)
    .max(600, "Link do pliku jest zbyt długi.")
    .refine(
        (value) => value.startsWith("storage://") || value.startsWith("https://"),
        "Pliki portfolio muszą używać bezpiecznego adresu storage:// albo HTTPS.",
    );
const optionalHttpsUrlSchema = z
    .string()
    .trim()
    .min(1)
    .max(600, "Link do realizacji jest zbyt długi.")
    .url("Link do realizacji musi być poprawnym adresem URL.")
    .refine((value) => value.startsWith("https://"), "Link do realizacji musi używać HTTPS.");
const serviceQuestionSchema = z
    .object({
        id: z.string().trim().regex(/^[a-zA-Z0-9_-]{1,40}$/, "Pytanie ma nieprawidłowy identyfikator."),
        label: requiredTextSchema(3, 160, "Treść pytania jest za krótka.", "Treść pytania jest zbyt długa."),
    })
    .passthrough()
    .transform((question) => ({
        id: question.id,
        label: question.label,
        type: "text" as const,
        options: [] as string[],
    }));
const servicePackageMutationSchema = z
    .object({
        title: requiredTextSchema(5, 120, "Tytuł usługi jest za krótki.", "Tytuł usługi jest zbyt długi."),
        description: requiredTextSchema(30, 4_000, "Opis usługi jest za krótki.", "Opis usługi jest zbyt długi."),
        price: moneySchema,
        price_max: optionalMoneySchema,
        delivery_time_days: z.coerce
            .number()
            .int("Czas realizacji musi być liczbą całkowitą.")
            .min(1, "Czas realizacji musi wynosić co najmniej 1 dzień.")
            .max(90, "Czas realizacji nie może przekraczać 90 dni."),
        requirements: optionalTextSchema(2_000, "Wymagania od klienta są zbyt długie.").transform((value) => value || null),
        status: z.enum(SERVICE_STATUS_VALUES).default("active"),
        portfolio_items: z.array(optionalHttpsUrlSchema).max(10, "Możesz dodać maksymalnie 10 linków do realizacji.").default([]),
        gallery_urls: z.array(storageOrHttpsRefSchema).max(12, "Możesz dodać maksymalnie 12 plików portfolio.").default([]),
        categories: z
            .array(z.string().trim().min(1).max(80))
            .max(6, "Możesz wybrać maksymalnie 6 kategorii.")
            .transform((categories) => Array.from(new Set(categories)))
            .refine((categories) => categories.length > 0, "Wybierz przynajmniej jedną kategorię.")
            .refine(
                (categories) => categories.every((category) => SERVICE_CATEGORY_SET.has(category)),
                "Wybrano nieobsługiwaną kategorię usługi.",
            ),
        form_schema: z.array(serviceQuestionSchema).max(12, "Możesz dodać maksymalnie 12 pytań do briefu.").default([]),
    })
    .transform((payload) => ({
        ...payload,
        price_max: payload.price_max != null && payload.price_max > payload.price ? payload.price_max : null,
    }));
const privateProposalSchema = z.object({
    packageId: uuidInputSchema,
    targetCompanyId: uuidInputSchema,
    proposalGoal: requiredTextSchema(20, 1_500, "Uzupełnij cel współpracy.", "Cel współpracy jest zbyt długi."),
    expectedResult: requiredTextSchema(20, 1_500, "Uzupełnij oczekiwany rezultat.", "Oczekiwany rezultat jest zbyt długi."),
    scopeSummary: requiredTextSchema(30, 2_500, "Uzupełnij zakres propozycji.", "Zakres propozycji jest zbyt długi."),
    estimatedTimelineDays: z.preprocess(
        (value) => (value == null || value === "" ? null : value),
        z.coerce
            .number()
            .int("Czas realizacji musi być liczbą całkowitą.")
            .min(1, "Czas realizacji musi wynosić co najmniej 1 dzień.")
            .max(90, "Czas realizacji nie może przekraczać 90 dni.")
            .nullable(),
    ),
    proposedAmount: moneySchema,
    message: optionalTextSchema(1_000, "Wiadomość do firmy jest zbyt długa.").transform((value) => value || null),
});
const quoteInputSchema = z.object({
    orderId: uuidInputSchema,
    price: moneySchema,
    message: optionalTextSchema(1_000, "Wiadomość do klienta jest zbyt długa.").transform((value) => value || null),
});
const counterInputSchema = z.object({
    orderId: uuidInputSchema,
    amount: moneySchema,
});
const selectionInputSchema = z.object({
    orderId: uuidInputSchema,
    studentId: uuidInputSchema,
});

function parseOrThrow<T>(parsed: z.ZodSafeParseResult<T>): T {
    if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || "Nieprawidłowe dane formularza.");
    }

    return parsed.data;
}

async function logServiceActionError(input: {
    source: string;
    error: unknown;
    userId?: string | null;
    serviceId?: string | null;
    packageId?: string | null;
    offerId?: string | null;
    orderId?: string | null;
    conversationId?: string | null;
}) {
    await logCriticalError({
        source: input.source,
        error: input.error,
        userId: input.userId ?? null,
        context: {
            serviceId: input.serviceId ?? null,
            packageId: input.packageId ?? null,
            offerId: input.offerId ?? null,
            orderId: input.orderId ?? null,
            conversationId: input.conversationId ?? null,
        },
    });
}

async function assertUserRole(
    supabase: SupabaseClient,
    userId: string,
    role: "student" | "company" | "admin",
    message: string,
) {
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        await logServiceActionError({
            source: "services.role_lookup",
            error,
            userId,
        });
        throw new Error("Nie udalo sie sprawdzic uprawnien konta.");
    }

    if (profile?.role !== role) {
        throw new Error(message);
    }
}

async function getConversationForOrder(
    supabase: SupabaseClient,
    params: { orderId: string; companyId: string; studentId: string; packageId?: string | null },
) {
    return findConversationForServiceOrder(supabase, {
        serviceOrderId: params.orderId,
        companyId: params.companyId,
        studentId: params.studentId,
        packageId: params.packageId,
    });
}

async function insertServiceOrderMessage(
    supabase: SupabaseClient,
    input: {
        source: string;
        conversationId: string;
        senderId: string;
        content: string;
        event?: string | null;
        payload?: Record<string, unknown> | null;
        userId?: string | null;
        orderId?: string | null;
    },
) {
    const { error } = await supabase.from("messages").insert({
        conversation_id: input.conversationId,
        sender_id: input.senderId,
        content: input.content,
        event: input.event ?? null,
        payload: input.payload ?? null,
    });

    if (error) {
        await logServiceActionError({
            source: input.source,
            error,
            userId: input.userId ?? input.senderId,
            orderId: input.orderId ?? null,
            conversationId: input.conversationId,
        });
        return false;
    }

    return true;
}

export async function createOfferFromSystemPackage(packageId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth");
    const parsedPackageId = parseOrThrow(uuidInputSchema.safeParse(packageId));
    await assertUserRole(supabase, user.id, "company", "Tylko firmy moga korzystac z gotowych rozwiazan.");

    // Sprawdzamy czy user jest firmą
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (profile?.role !== "company") {
        throw new Error("Tylko firmy mogą korzystać z gotowych rozwiązań (tworzyć zlecenia).");
    }

    // 1. Pobierz pakiet
    const { data: pkg, error: pkgErr } = await supabase
        .from("service_packages")
        .select("*")
        .eq("id", parsedPackageId)
        .single();

    if (pkgErr) {
        await logServiceActionError({
            source: "services.system_offer.package_lookup",
            error: pkgErr,
            userId: user.id,
            packageId: parsedPackageId,
        });
        throw new Error("Nie udalo sie pobrac pakietu.");
    }

    if (!pkg) throw new Error("Nie znaleziono pakietu.");

    // 2. Utwórz ofertę (Zlecenie)
    // Domyślny termin: dzisiaj + czas realizacji * 2 (na zapas) lub sztywno 14 dni
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 14);

    const { data: offer, error: offerErr } = await supabase
        .from("offers")
        .insert({
            company_id: user.id,
            tytul: pkg.title,
            opis: pkg.description + `\n\n---\nZlecenie utworzone na podstawie gotowego rozwiązania: ${pkg.title}.`,
            // salary_range* - jeśli tabela ma 'stawka' to wstawiam w stawka (fixed price)
            stawka: pkg.price,
            service_package_id: pkg.id,
            // deadline? - zależy jak jest w User DB. W `createOffer` widać tylko tytul,opis,kategoria,typ,czas,wymagania,stawka,status
            // Nie widze deadline.
            // Spróbujmy dopasować do tego co widziałem w _actions.ts w new-offer
            status: "published",
            typ: "projekt",
            is_platform_service: true,
            commission_rate: resolveCommissionRate({
                explicitRate: pkg.commission_rate ?? null,
                sourceType: "service_order",
                isPlatformService: true,
            }),
        })
        .select("id")
        .single();

    if (offerErr) {
        await logServiceActionError({
            source: "services.system_offer.offer_insert",
            error: offerErr,
            userId: user.id,
            packageId: parsedPackageId,
        });
        throw new Error("Nie udalo sie utworzyc oferty z pakietu.");
    }

    revalidatePath("/app/company/offers");
    redirect(`/app/offers/${offer.id}`);
}

export async function createInquiryAction(packageId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth");
    const parsedPackageId = parseOrThrow(uuidInputSchema.safeParse(packageId));
    await assertUserRole(supabase, user.id, "company", "Tylko firmy moga wysylac zapytania.");

    const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
    if (profile?.role !== "company") throw new Error("Tylko firmy mogą wysyłać zapytania.");

    const { data: pkg, error: pkgError } = await supabase.from("service_packages").select("*").eq("id", parsedPackageId).single();
    if (pkgError) {
        await logServiceActionError({
            source: "services.inquiry.package_lookup",
            error: pkgError,
            userId: user.id,
            packageId: parsedPackageId,
        });
        throw new Error("Nie udalo sie pobrac pakietu.");
    }
    if (!pkg) throw new Error("Pakiet nie istnieje.");

    // Create Service Order Record (So it appears in Student Dashboard)
    const { error: orderError } = await supabase.from("service_orders").insert({
        company_id: user.id,
        student_id: pkg.student_id,
        package_id: pkg.id,
        status: "inquiry", // or 'pending'
        amount: pkg.price,
        requirements: `Zapytanie o wycenę pakietu: ${pkg.title}`,
    });

    if (orderError) {
        await logServiceActionError({
            source: "services.inquiry.service_order_insert",
            error: orderError,
            userId: user.id,
            packageId: parsedPackageId,
        });
        throw new Error("Nie udalo sie utworzyc zlecenia dla zapytania.");
    }

    // Create PRIVATE offer context for the chat
    // We add service_package_id so we can link it back if needed
    const { data: offer, error } = await supabase.from("offers").insert({
        company_id: user.id,
        tytul: `Zapytanie: ${pkg.title}`,
        opis: `Zapytanie o wycenę usługi: ${pkg.title}.\n\nOpis usługi:\n${pkg.description}`,
        stawka: pkg.price,
        status: "published",
        is_private: true,
        service_package_id: pkg.id, // Link to package
        typ: "micro", // Standardize type
        commission_rate: resolveCommissionRate({
            explicitRate: pkg.commission_rate ?? null,
            sourceType: "service_order",
            offerType: "micro",
        })
    }).select("id").single();

    if (error) {
        await logServiceActionError({
            source: "services.inquiry.offer_insert",
            error,
            userId: user.id,
            packageId: parsedPackageId,
        });
        throw new Error("Nie udalo sie utworzyc zapytania.");
    }

    // Redirect to chat
    // createConversation will handle creating conversation with offer_id.
    // If we want conversation to have package_id directly, we might need to update openChatForOfferInquiry or let trigger handle it?
    // For now, linking Offer->Package is usually enough if DB triggers sync it, 
    // BUT dashboard looks for `conversations.package_id`.
    // Let's rely on the fact that `service_orders` now exists, so Dashboard shows the item.
    // Dashboard Chat Link might fail if conversation.package_id is missing.
    // We'll see.
    // Insert Notification for Student
    const { error: notificationError } = await supabase.from("notifications").insert({
        user_id: pkg.student_id,
        typ: "application_new",
        payload: {
            snippet: `Otrzymałeś nowe zapytanie o usługę: ${pkg.title}`,
            // No conversation ID available yet easily without double fetch, linking to general dashboard implicitly/fallback
        }
    });

    if (notificationError) {
        await logServiceActionError({
            source: "services.inquiry.notification_insert",
            error: notificationError,
            userId: user.id,
            packageId: parsedPackageId,
            offerId: offer.id,
        });
    }

    await openChatForOfferInquiry(offer.id);
}

export async function deleteServiceAction(serviceId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Musisz być zalogowany.");
    }

    // Sprawdź czy użytkownik jest właścicielem serwisu
    await assertUserRole(supabase, user.id, "student", "Tylko student może usuwać własne usługi.");

    const parsedServiceId = parseOrThrow(uuidInputSchema.safeParse(serviceId));

    const { data: service, error: serviceLookupError } = await supabase
        .from("service_packages")
        .select("student_id")
        .eq("id", parsedServiceId)
        .maybeSingle();

    if (serviceLookupError) {
        await logServiceActionError({
            source: "services.delete.service_lookup",
            error: serviceLookupError,
            userId: user.id,
            serviceId: parsedServiceId,
        });
        throw new Error("Nie udalo sie sprawdzic uslugi.");
    }

    if (!service) {
        throw new Error("Nie znaleziono usługi.");
    }

    if (service.student_id !== user.id) {
        throw new Error("Nie masz uprawnień do usunięcia tej usługi.");
    }

    const { error } = await supabase
        .from("service_packages")
        .delete()
        .eq("id", parsedServiceId)
        .eq("student_id", user.id);

    if (error) {
        await logServiceActionError({
            source: "services.delete.service_delete",
            error,
            userId: user.id,
            serviceId: parsedServiceId,
        });
        throw new Error("Nie udalo sie usunac uslugi.");
    }

    revalidatePath("/app/services/my");
    return { success: true };
}

export async function createServiceAction(data: Record<string, unknown>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Musisz być zalogowany.");

    await assertUserRole(supabase, user.id, "student", "Tylko student może tworzyć pakiety usług.");

    const payload = parseOrThrow(servicePackageMutationSchema.safeParse(data));

    const { error } = await supabase
        .from("service_packages")
        .insert({
            ...payload,
            commission_rate: resolveCommissionRate({
                sourceType: "service_order",
                isPlatformService: false,
            }),
            student_id: user.id
        });

    if (error) {
        await logServiceActionError({
            source: "services.create.service_insert",
            error,
            userId: user.id,
        });
        throw new Error("Nie udalo sie utworzyc uslugi.");
    }

    revalidatePath("/app/services/my");
    return { success: true };
}

export async function updateServiceAction(serviceId: string, data: Record<string, unknown>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Musisz być zalogowany.");

    await assertUserRole(supabase, user.id, "student", "Tylko student może edytować własne pakiety usług.");

    const parsedServiceId = parseOrThrow(uuidInputSchema.safeParse(serviceId));
    const payload = parseOrThrow(servicePackageMutationSchema.safeParse(data));

    // Verify ownership
    const { data: service, error: serviceLookupError } = await supabase
        .from("service_packages")
        .select("student_id")
        .eq("id", parsedServiceId)
        .maybeSingle();

    if (serviceLookupError) {
        await logServiceActionError({
            source: "services.update.service_lookup",
            error: serviceLookupError,
            userId: user.id,
            serviceId: parsedServiceId,
        });
        throw new Error("Nie udalo sie sprawdzic uslugi.");
    }

    if (!service || service.student_id !== user.id) {
        throw new Error("Nie masz uprawnień.");
    }

    const { error } = await supabase
        .from("service_packages")
        .update({
            ...payload,
            commission_rate: resolveCommissionRate({
                sourceType: "service_order",
                isPlatformService: false,
            }),
        })
        .eq("id", parsedServiceId)
        .eq("student_id", user.id);

    if (error) {
        await logServiceActionError({
            source: "services.update.service_update",
            error,
            userId: user.id,
            serviceId: parsedServiceId,
        });
        throw new Error("Nie udalo sie zapisac zmian uslugi.");
    }

    revalidatePath("/app/services/my");
    return { success: true };
}

export async function toggleServiceStatusAction(serviceId: string, newStatus: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Musisz być zalogowany.");

    await assertUserRole(supabase, user.id, "student", "Tylko student może zmieniać status własnej usługi.");

    const parsedServiceId = parseOrThrow(uuidInputSchema.safeParse(serviceId));
    const parsedStatus = parseOrThrow(z.enum(SERVICE_STATUS_VALUES).safeParse(newStatus));

    // Verify ownership
    const { data: service, error: serviceLookupError } = await supabase
        .from("service_packages")
        .select("student_id")
        .eq("id", parsedServiceId)
        .maybeSingle();

    if (serviceLookupError) {
        await logServiceActionError({
            source: "services.toggle_status.service_lookup",
            error: serviceLookupError,
            userId: user.id,
            serviceId: parsedServiceId,
        });
        throw new Error("Nie udalo sie sprawdzic uslugi.");
    }

    if (!service || service.student_id !== user.id) {
        throw new Error("Nie masz uprawnień.");
    }

    const { error } = await supabase
        .from("service_packages")
        .update({ status: parsedStatus })
        .eq("id", parsedServiceId)
        .eq("student_id", user.id);

    if (error) {
        await logServiceActionError({
            source: "services.toggle_status.service_update",
            error,
            userId: user.id,
            serviceId: parsedServiceId,
        });
        throw new Error("Nie udalo sie zmienic statusu uslugi.");
    }

    revalidatePath("/app/services/my");
}

export async function createPrivateProposalAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Musisz byc zalogowany.");
    }

    await assertUserRole(supabase, user.id, "student", "Tylko student może wysyłać prywatne propozycje.");

    const packageId = String(formData.get("packageId") || "");
    const targetCompanyId = String(formData.get("companyId") || "");
    const proposalGoal = String(formData.get("proposal_goal") || "").trim();
    const expectedResult = String(formData.get("expected_result") || "").trim();
    const scopeSummary = String(formData.get("scope_summary") || "").trim();
    const timelineRaw = String(formData.get("estimated_timeline_days") || "").trim();
    const proposedAmountRaw = String(formData.get("proposed_amount") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!packageId || !targetCompanyId) {
        throw new Error("Wybierz usługę i firme docelowa.");
    }

    if (!proposalGoal || !expectedResult || !scopeSummary) {
        throw new Error("Uzupelnij cel współpracy, oczekiwany rezultat i zakres propozycji.");
    }

    const proposedAmount = Number(proposedAmountRaw);
    if (!proposedAmount || Number.isNaN(proposedAmount) || proposedAmount <= 0) {
        throw new Error("Podaj prawidlowa proponowana kwote.");
    }

    const estimatedTimelineDays = timelineRaw ? Number(timelineRaw) : null;
    if (timelineRaw && (!estimatedTimelineDays || Number.isNaN(estimatedTimelineDays) || estimatedTimelineDays <= 0)) {
        throw new Error("Podaj prawidlowa liczbe dni realizacji.");
    }

    const proposal = parseOrThrow(privateProposalSchema.safeParse({
        packageId,
        targetCompanyId,
        proposalGoal,
        expectedResult,
        scopeSummary,
        estimatedTimelineDays,
        proposedAmount,
        message,
    }));

    const { data: pkg, error: pkgError } = await supabase
        .from("service_packages")
        .select("id, student_id, title, description")
        .eq("id", proposal.packageId)
        .eq("student_id", user.id)
        .single();

    if (pkgError) {
        await logServiceActionError({
            source: "services.private_proposal.package_lookup",
            error: pkgError,
            userId: user.id,
            packageId: proposal.packageId,
        });
        throw new Error("Nie udalo sie pobrac wybranej uslugi.");
    }

    if (!pkg) {
        throw new Error("Nie znaleziono wybranej usługi.");
    }

    await assertStudentCanPrivatelyProposeToCompany(supabase, user.id, proposal.targetCompanyId);

    const { data: company, error: companyError } = await supabase
        .from("company_profiles")
        .select("nazwa")
        .eq("user_id", proposal.targetCompanyId)
        .maybeSingle();

    if (companyError) {
        await logServiceActionError({
            source: "services.private_proposal.company_lookup",
            error: companyError,
            userId: user.id,
            packageId: proposal.packageId,
        });
        throw new Error("Nie udalo sie pobrac profilu firmy.");
    }

    const requestSnapshot = buildPrivateProposalRequestSnapshot({
        packageId: pkg.id,
        packageTitle: pkg.title || "Usługa",
        targetCompanyId: proposal.targetCompanyId,
        targetCompanyName: company?.nazwa || null,
        proposalGoal: proposal.proposalGoal,
        expectedResult: proposal.expectedResult,
        scopeSummary: proposal.scopeSummary,
        estimatedTimelineDays: proposal.estimatedTimelineDays,
        proposedAmount: proposal.proposedAmount,
        message: proposal.message,
    });

    const requirementsText = buildPrivateProposalLegacyText({
        targetCompanyName: company?.nazwa || null,
        proposalGoal: proposal.proposalGoal,
        expectedResult: proposal.expectedResult,
        scopeSummary: proposal.scopeSummary,
        estimatedTimelineDays: proposal.estimatedTimelineDays,
        proposedAmount: proposal.proposedAmount,
        message: proposal.message,
    });

    const quoteSnapshot = buildStudentProposalSnapshot(null, {
        amount: proposal.proposedAmount,
        message: proposal.message,
    });

    const { data: order, error: insertError } = await supabase
        .from("service_orders")
        .insert({
            company_id: proposal.targetCompanyId,
            student_id: user.id,
            package_id: proposal.packageId,
            title: pkg.title,
            amount: proposal.proposedAmount,
            requirements: requirementsText,
            request_snapshot: requestSnapshot,
            quote_snapshot: quoteSnapshot,
            status: "proposal_sent",
            entry_point: "student_private_proposal",
            initiated_by: "student",
        })
        .select("id")
        .single();

    if (insertError || !order) {
        await logServiceActionError({
            source: "services.private_proposal.order_insert",
            error: insertError ?? new Error("Missing inserted service order"),
            userId: user.id,
            packageId: proposal.packageId,
        });
        throw new Error("Nie udalo sie zapisac prywatnej propozycji.");
    }

    const conversation = await ensureConversationForServiceOrder(supabase, {
        serviceOrderId: order.id,
        companyId: proposal.targetCompanyId,
        studentId: user.id,
        packageId: proposal.packageId,
    });

    const { error: proposalMessagesError } = await supabase.from("messages").insert([
        {
            conversation_id: conversation.id,
            sender_id: user.id,
            content: "Student wyslal prywatną propozycje współpracy.",
        },
        {
            conversation_id: conversation.id,
            sender_id: user.id,
            content: requirementsText,
            event: "inquiry_details",
        },
    ]);

    if (proposalMessagesError) {
        await logServiceActionError({
            source: "services.private_proposal.messages_insert",
            error: proposalMessagesError,
            userId: user.id,
            packageId: proposal.packageId,
            orderId: order.id,
            conversationId: conversation.id,
        });
        throw new Error("Propozycja zostala zapisana, ale nie udalo sie wyslac wiadomosci.");
    }

    await sendNotification(proposal.targetCompanyId, "application_new", {
        conversation_id: conversation.id,
        service_order_id: order.id,
        snippet: `Otrzymales prywatną propozycje współpracy: ${pkg.title}`,
        offer_title: pkg.title,
    });

    revalidatePath("/app/services/dashboard");
    revalidatePath("/app/company/orders");
    revalidatePath("/app/chat");
    redirect(`/app/services/dashboard/${order.id}`);
}

export async function proposeServicePriceAction(orderId: string, price: number, message?: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error("Musisz być zalogowany.");

        await assertUserRole(supabase, user.id, "student", "Tylko student może złożyć ofertę realizacji.");
        const input = parseOrThrow(quoteInputSchema.safeParse({ orderId, price, message }));

        // Verify ownership (Student side)
        const { data: orderData } = await supabase
            .from("service_orders")
            .select("id, student_id, company_id, package_id, status, quote_snapshot, package:service_packages(title)")
            .eq("id", input.orderId)
            .single();
        const order = orderData as ServiceOrderNegotiationRow | null;

        if (!order || order.student_id !== user.id) {
            throw new Error("To nie jest twoje zlecenie.");
        }

        if (!SERVICE_ORDER_STUDENT_QUOTE_STATUSES.includes(order.status as (typeof SERVICE_ORDER_STUDENT_QUOTE_STATUSES)[number])) {
            throw new Error("Ofertę można złożyć tylko dla zapytania oczekującego na wycenę.");
        }

        const quoteSnapshot = buildStudentProposalSnapshot(
            isQuoteSnapshot(order?.quote_snapshot) ? order.quote_snapshot : null,
            { amount: input.price, message: input.message }
        );

        const { data: updatedOrder, error } = await supabase
            .from("service_orders")
            .update({
                amount: input.price,
                status: "proposal_sent",
                quote_snapshot: quoteSnapshot,
            })
            .eq("id", input.orderId)
            .in("status", [...SERVICE_ORDER_STUDENT_QUOTE_STATUSES])
            .select("id")
            .single();

        if (error || !updatedOrder) {
            throw new Error("Nie udało się zapisać oferty. Odśwież stronę i spróbuj ponownie.");
        }

        // Find Conversation to link notification and message
        const conv = await getConversationForOrder(supabase, {
            orderId: input.orderId,
            companyId: order.company_id,
            studentId: user.id,
            packageId: order.package_id,
        });


        if (conv) {
            // 1. Send "Negotiation Proposed" system message (Interactive Bubble)
            const { error: eventError } = await supabase.from("messages").insert({
                conversation_id: conv.id,
                sender_id: user.id,
                content: `Złożono ofertę realizacji: ${input.price} PLN.`,
                event: "negotiation_proposed",
                payload: {
                    proposed_stawka: input.price,
                    initiator: "student",
                    service_order_id: input.orderId
                }
            });
            if (eventError) {
                await logServiceActionError({
                    source: "services.propose_price.event_message_insert",
                    error: eventError,
                    userId: user.id,
                    orderId: input.orderId,
                    conversationId: conv.id,
                });
            }

            // 2. Send optional text message
            if (input.message) {
                const { error: msgError } = await supabase.from("messages").insert({
                    conversation_id: conv.id,
                    sender_id: user.id,
                    content: input.message
                });
                if (msgError) {
                    await logServiceActionError({
                        source: "services.propose_price.text_message_insert",
                        error: msgError,
                        userId: user.id,
                        orderId: input.orderId,
                        conversationId: conv.id,
                    });
                }
            }

            // 3. Send Notification via RPC (bypasses RLS issues usually)
            await sendNotification(order.company_id, "negotiation_proposed", {
                    conversation_id: conv.id,
                    snippet: input.message ? `Nowa oferta (${input.price} PLN): ${input.message.slice(0, 40)}...` : `Otrzymałeś ofertę: ${input.price} PLN`,
                    proposed_stawka: input.price,
                    offer_title: order.package?.title || 'Usługa'
            });
        } else {
            console.warn("No conversation found, skipping messages/notification");
        }

        revalidatePath("/app/services/dashboard");
        revalidatePath("/app/company/orders");
        return { success: true };
    } catch (err: unknown) {
        throw new Error(err instanceof Error ? err.message : "Wystąpił błąd po stronie serwera.");
    }
}

export async function acceptServiceProposalAction(orderId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Musisz być zalogowany.");
    await assertUserRole(supabase, user.id, "company", "Tylko firma może zaakceptować ofertę studenta.");
    const parsedOrderId = parseOrThrow(uuidInputSchema.safeParse(orderId));

    // Verify Company
    const { data: order } = await supabase
        .from("service_orders")
        .select("id, company_id, student_id, package_id, status, amount, quote_snapshot")
        .eq("id", parsedOrderId)
        .single();
    if (!order || order.company_id !== user.id) throw new Error("Nie masz uprawnień.");

    if (!SERVICE_ORDER_COMPANY_ACCEPT_STATUSES.includes(order.status as (typeof SERVICE_ORDER_COMPANY_ACCEPT_STATUSES)[number])) {
        throw new Error("Tę ofertę można zaakceptować tylko na etapie decyzji firmy.");
    }
    if (!order.student_id || !order.amount || Number(order.amount) <= 0) {
        throw new Error("Zamówienie nie ma kompletnej oferty studenta.");
    }

    const acceptedSnapshot = buildAcceptedQuoteSnapshot(
        isQuoteSnapshot(order.quote_snapshot) ? order.quote_snapshot : null,
        { amount: order.amount, acceptedBy: "company" }
    );

    // Update Order
    const { data: updatedOrder, error } = await supabase.from("service_orders")
        .update({ status: "accepted", agreed_amount: order.amount, quote_snapshot: acceptedSnapshot })
        .eq("id", parsedOrderId)
        .in("status", [...SERVICE_ORDER_COMPANY_ACCEPT_STATUSES])
        .select("id")
        .single();
    if (error || !updatedOrder) throw new Error("Nie udało się zaakceptować oferty. Odśwież stronę i spróbuj ponownie.");

    // ✅ [Realization Guard]
    const { error: contractError } = await supabase.rpc("ensure_contract_for_service_order", {
        p_service_order_id: parsedOrderId,
    });
    if (contractError) {
        await logServiceActionError({
            source: "services.accept_proposal.contract_rpc",
            error: contractError,
            userId: user.id,
            orderId: parsedOrderId,
        });
        throw new Error("Oferta została zaakceptowana, ale nie udało się przygotować kontraktu.");
    }

    // Find Convo for Msg
    const conv = await getConversationForOrder(supabase, {
        orderId: parsedOrderId,
        companyId: order.company_id,
        studentId: order.student_id,
        packageId: order.package_id,
    });

    if (conv) {
        // System Msg
        const { error: acceptedMessageError } = await supabase.from("messages").insert({
            conversation_id: conv.id,
            sender_id: user.id,
            content: `Zaakceptowano ofertę: ${order.amount} PLN.`,
            event: "application_accepted"
        });
        if (acceptedMessageError) {
            await logServiceActionError({
                source: "services.accept_proposal.message_insert",
                error: acceptedMessageError,
                userId: user.id,
                orderId: parsedOrderId,
                conversationId: conv.id,
            });
        }
        // Notif
        await sendNotification(order.student_id, "application_accepted", {
            p_payload: { conversation_id: conv.id, snippet: `Twoja oferta została zaakceptowana!`, offer_title: "Usługa" }
        });
    }
    revalidatePath("/app/services/dashboard");
    revalidatePath("/app/company/orders");
    return { success: true };
}

export async function rejectServiceProposalAction(orderId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Musisz być zalogowany.");
    const parsedOrderId = parseOrThrow(uuidInputSchema.safeParse(orderId));

    const { data: order } = await supabase
        .from("service_orders")
        .select("id, company_id, student_id, package_id, status, quote_snapshot")
        .eq("id", parsedOrderId)
        .single();
    if (!order || (order.company_id !== user.id && order.student_id !== user.id)) throw new Error("Nie masz uprawnień.");

    if (!SERVICE_ORDER_REJECTABLE_STATUSES.includes(order.status as (typeof SERVICE_ORDER_REJECTABLE_STATUSES)[number])) {
        throw new Error("Tego zlecenia nie można już odrzucić w tym kroku.");
    }

    const rejectedSnapshot = buildRejectedQuoteSnapshot(
        isQuoteSnapshot(order?.quote_snapshot) ? order.quote_snapshot : null
    );

    const { data: updatedOrder, error } = await supabase
        .from("service_orders")
        .update({ status: "rejected", quote_snapshot: rejectedSnapshot })
        .eq("id", parsedOrderId)
        .in("status", [...SERVICE_ORDER_REJECTABLE_STATUSES])
        .select("id")
        .single();
    if (error || !updatedOrder) throw new Error("Nie udało się odrzucić zlecenia. Odśwież stronę i spróbuj ponownie.");

    const conv = await getConversationForOrder(supabase, {
        orderId: parsedOrderId,
        companyId: order.company_id,
        studentId: order.student_id,
        packageId: order.package_id,
    });

    if (conv) {
        const { error: rejectedMessageError } = await supabase.from("messages").insert({
            conversation_id: conv.id,
            sender_id: user.id,
            content: "Oferta została odrzucona.",
            event: "application_rejected"
        });
        if (rejectedMessageError) {
            await logServiceActionError({
                source: "services.reject_proposal.message_insert",
                error: rejectedMessageError,
                userId: user.id,
                orderId: parsedOrderId,
                conversationId: conv.id,
            });
        }
    }
    revalidatePath("/app/services/dashboard");
    revalidatePath("/app/company/orders");
    return { success: true };
}

export async function counterServiceProposalAction(orderId: string, amount: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Musisz być zalogowany.");
    await assertUserRole(supabase, user.id, "company", "Tylko firma może złożyć kontrofertę.");
    const input = parseOrThrow(counterInputSchema.safeParse({ orderId, amount }));

    // Company Counters
    const { data: order } = await supabase
        .from("service_orders")
        .select("id, company_id, student_id, package_id, status, quote_snapshot")
        .eq("id", input.orderId)
        .single();
    if (!order || order.company_id !== user.id) throw new Error("Nie masz uprawnień.");

    if (!SERVICE_ORDER_COUNTER_STATUSES.includes(order.status as (typeof SERVICE_ORDER_COUNTER_STATUSES)[number])) {
        throw new Error("Kontrofertę można złożyć tylko do aktywnej oferty studenta.");
    }

    const counterSnapshot = buildCompanyCounterSnapshot(
        isQuoteSnapshot(order.quote_snapshot) ? order.quote_snapshot : null,
        { amount: input.amount }
    );

    const { data: updatedOrder, error } = await supabase.from("service_orders")
        .update({ status: "countered", counter_amount: input.amount, quote_snapshot: counterSnapshot })
        .eq("id", input.orderId)
        .in("status", [...SERVICE_ORDER_COUNTER_STATUSES])
        .select("id")
        .single();

    if (error || !updatedOrder) throw new Error("Nie udało się zapisać kontroferty. Odśwież stronę i spróbuj ponownie.");

    const conv = await getConversationForOrder(supabase, {
        orderId: input.orderId,
        companyId: order.company_id,
        studentId: order.student_id,
        packageId: order.package_id,
    });

    if (conv) {
        const { error: counterMessageError } = await supabase.from("messages").insert({
            conversation_id: conv.id,
            sender_id: user.id,
            content: `Zaproponowano inną stawkę: ${input.amount} PLN.`,
            event: "counter_offer",
            payload: { counter_stawka: input.amount, initiator: "company" }
        });
        if (counterMessageError) {
            await logServiceActionError({
                source: "services.counter_proposal.message_insert",
                error: counterMessageError,
                userId: user.id,
                orderId: input.orderId,
                conversationId: conv.id,
            });
        }
        await sendNotification(order.student_id, "negotiation_proposed", {
            p_user_id: order.student_id,
            p_typ: "negotiation_proposed",
            p_payload: { conversation_id: conv.id, snippet: `Firma zaproponowała nową stawkę: ${input.amount} PLN`, proposed_stawka: input.amount }
        });
    }
    revalidatePath("/app/services/dashboard");
    revalidatePath("/app/company/orders");
    return { success: true };
}

export async function acceptServiceCounterAction(orderId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Musisz być zalogowany.");
    await assertUserRole(supabase, user.id, "student", "Tylko student może zaakceptować kontrofertę.");
    const parsedOrderId = parseOrThrow(uuidInputSchema.safeParse(orderId));

    // Student Accepts Counter
    const { data: order } = await supabase
        .from("service_orders")
        .select("id, company_id, student_id, package_id, status, counter_amount, quote_snapshot")
        .eq("id", parsedOrderId)
        .single();
    if (!order || order.student_id !== user.id) throw new Error("Nie masz uprawnień.");

    if (!SERVICE_ORDER_STUDENT_COUNTER_ACCEPT_STATUSES.includes(order.status as (typeof SERVICE_ORDER_STUDENT_COUNTER_ACCEPT_STATUSES)[number])) {
        throw new Error("Kontrofertę można zaakceptować tylko, gdy firma ją aktywnie zaproponowała.");
    }
    if (!order.counter_amount || Number(order.counter_amount) <= 0) {
        throw new Error("Kontroferta nie ma poprawnej kwoty.");
    }

    const acceptedSnapshot = buildAcceptedQuoteSnapshot(
        isQuoteSnapshot(order.quote_snapshot) ? order.quote_snapshot : null,
        { amount: order.counter_amount, acceptedBy: "student" }
    );

    const { data: updatedOrder, error } = await supabase.from("service_orders")
        .update({
            status: "accepted",
            agreed_amount: order.counter_amount,
            amount: order.counter_amount,
            quote_snapshot: acceptedSnapshot
        })
        .eq("id", parsedOrderId)
        .in("status", [...SERVICE_ORDER_STUDENT_COUNTER_ACCEPT_STATUSES])
        .select("id")
        .single();

    if (error || !updatedOrder) throw new Error("Nie udało się zaakceptować kontroferty. Odśwież stronę i spróbuj ponownie.");

    // ✅ [Realization Guard] — same as acceptServiceProposalAction
    const { error: contractError } = await supabase.rpc("ensure_contract_for_service_order", {
        p_service_order_id: parsedOrderId,
    });
    if (contractError) {
        await logServiceActionError({
            source: "services.accept_counter.contract_rpc",
            error: contractError,
            userId: user.id,
            orderId: parsedOrderId,
        });
        throw new Error("Kontroferta została zaakceptowana, ale nie udało się przygotować kontraktu.");
    }

    const conv = await getConversationForOrder(supabase, {
        orderId: parsedOrderId,
        companyId: order.company_id,
        studentId: order.student_id,
        packageId: order.package_id,
    });

    if (conv) {
        const { error: acceptedCounterMessageError } = await supabase.from("messages").insert({
            conversation_id: conv.id,
            sender_id: user.id,
            content: `Zaakceptowano kontrofertę: ${order.counter_amount} PLN.`,
            event: "counter_accepted"
        });
        if (acceptedCounterMessageError) {
            await logServiceActionError({
                source: "services.accept_counter.message_insert",
                error: acceptedCounterMessageError,
                userId: user.id,
                orderId: parsedOrderId,
                conversationId: conv.id,
            });
        }
        await sendNotification(order.company_id, "application_accepted", {
            p_user_id: order.company_id,
            p_typ: "application_accepted",
            p_payload: { conversation_id: conv.id, snippet: `Student zaakceptował Twoją stawkę!`, offer_title: "Usługa" }
        });
    }
    revalidatePath("/app/services/dashboard");
    revalidatePath("/app/company/orders");
    return { success: true };
}

export async function rejectServiceCounterAction(orderId: string) {
    // Same as rejectServiceProposalAction basically, but logic flow might differ slightly? 
    // Usually rejection ends the order processing.
    return rejectServiceProposalAction(orderId);
}

export async function selectCompanyOrderStudentAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Musisz być zalogowany.");
    }
    await assertUserRole(supabase, user.id, "company", "Tylko firma może wybrać studenta do zlecenia.");

    const orderId = String(formData.get("orderId") || "");
    const studentId = String(formData.get("studentId") || "");

    if (!orderId || !studentId) {
        throw new Error("Brak danych wyboru studenta.");
    }

    const input = parseOrThrow(selectionInputSchema.safeParse({ orderId, studentId }));

    const { data: order } = await supabase
        .from("service_orders")
        .select("id, company_id, student_id, status, package_id, title")
        .eq("id", input.orderId)
        .single();

    if (!order || order.company_id !== user.id) {
        throw new Error("Nie masz uprawnien do tego zamowienia.");
    }

    if (order.student_id) {
        throw new Error("Do tego zamowienia student jest już przypisany.");
    }

    if (!SERVICE_ORDER_SELECTION_STATUSES.includes(order.status as (typeof SERVICE_ORDER_SELECTION_STATUSES)[number])) {
        throw new Error("To zamowienie nie jest już na etapie wyboru studenta.");
    }

    const maxActiveOrders = order.package_id === LOGO_PACKAGE_ID ? 1 : 2;
    const { data: lockResult, error: lockError } = await supabase.rpc("assign_service_order_student_locked", {
        p_order_id: input.orderId,
        p_company_id: user.id,
        p_student_id: input.studentId,
        p_max_active_orders: maxActiveOrders,
        p_preferred_status: "pending_student_confirmation",
        p_fallback_status: "pending",
    });

    const assignedRow = Array.isArray(lockResult) ? lockResult[0] : null;
    if (lockError || !assignedRow?.order_id) {
        await logServiceActionError({
            source: "services.select_student.assign_locked",
            error: lockError ?? new Error("Missing assigned order row"),
            userId: user.id,
            orderId: input.orderId,
        });
        throw new Error("Nie udalo sie przypisac studenta.");
    }

    const existingConversation = await findConversationForServiceOrder(supabase, {
        serviceOrderId: input.orderId,
        companyId: user.id,
        studentId: input.studentId,
        packageId: order.package_id,
    });

    let conversationId = existingConversation?.id ?? null;
    if (!conversationId) {
        const createdConversation = await ensureConversationForServiceOrder(supabase, {
            serviceOrderId: input.orderId,
            companyId: user.id,
            studentId: input.studentId,
            packageId: order.package_id,
        });

        conversationId = createdConversation.id;
    }

    const { error: studentNotificationError } = await supabase.from("notifications").insert({
        user_id: input.studentId,
        typ: "application_new",
        payload: {
            snippet: `Firma wybrala Cie do realizacji usługi: ${order.title || "Usługa"}`,
            service_order_id: input.orderId,
            conversation_id: conversationId,
        },
    });

    if (studentNotificationError) {
        await logServiceActionError({
            source: "services.select_student.notification_insert",
            error: studentNotificationError,
            userId: user.id,
            orderId: input.orderId,
            conversationId,
        });
    }

    revalidatePath("/app/company/orders");
    revalidatePath(`/app/company/orders/${input.orderId}`);
    revalidatePath("/app/services/dashboard");
    redirect(`/app/company/orders/${input.orderId}`);
}

export async function confirmStudentSelectionAction(orderId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Musisz być zalogowany.");
    await assertUserRole(supabase, user.id, "student", "Tylko wybrany student może potwierdzić realizację.");
    const parsedOrderId = parseOrThrow(uuidInputSchema.safeParse(orderId));

    const { data: order } = await supabase
        .from("service_orders")
        .select("id, student_id, company_id, package_id, status, amount, title")
        .eq("id", parsedOrderId)
        .single();

    if (!order || order.student_id !== user.id) {
        throw new Error("Nie masz uprawnien do tego zamowienia.");
    }

    if (!SERVICE_ORDER_CONFIRMATION_STATUSES.includes(order.status as (typeof SERVICE_ORDER_CONFIRMATION_STATUSES)[number])) {
        throw new Error("To zamowienie nie czeka na potwierdzenie.");
    }

    let { data: updatedOrder, error: updateError } = await supabase
        .from("service_orders")
        .update({ status: "active" })
        .eq("id", parsedOrderId)
        .eq("student_id", user.id)
        .in("status", [...SERVICE_ORDER_CONFIRMATION_STATUSES])
        .select("id")
        .single();

    if (updateError?.message?.includes("service_orders_status_check")) {
        const fallback = await supabase
            .from("service_orders")
            .update({ status: "accepted" })
            .eq("id", parsedOrderId)
            .eq("student_id", user.id)
            .in("status", [...SERVICE_ORDER_CONFIRMATION_STATUSES])
            .select("id")
            .single();
        updatedOrder = fallback.data;
        updateError = fallback.error;
    }

    if (updateError || !updatedOrder) {
        throw new Error("Nie udało się potwierdzić realizacji. Odśwież stronę i spróbuj ponownie.");
    }

    const { error: contractError } = await supabase.rpc("ensure_contract_for_service_order", {
        p_service_order_id: parsedOrderId,
    });
    if (contractError) {
        await logServiceActionError({
            source: "services.confirm_selection.contract_rpc",
            error: contractError,
            userId: user.id,
            orderId: parsedOrderId,
        });
        throw new Error("Realizacja została potwierdzona, ale nie udało się przygotować kontraktu.");
    }

    const conversation = await findConversationForServiceOrder(supabase, {
        serviceOrderId: parsedOrderId,
        companyId: order.company_id,
        studentId: user.id,
        packageId: order.package_id,
    });

    if (conversation?.id) {
        await insertServiceOrderMessage(supabase, {
            source: "services.confirm_selection.message_insert",
            conversationId: conversation.id,
            senderId: user.id,
            content: "Potwierdzono rozpoczecie realizacji.",
            event: "application_accepted",
            userId: user.id,
            orderId: parsedOrderId,
        });

        await sendNotification(order.company_id, "application_accepted", {
            conversation_id: conversation.id,
            service_order_id: parsedOrderId,
            snippet: `Student potwierdzil realizacje: ${order.title || "Usługa"}`,
            offer_title: order.title || "Usługa",
        });
    }

    revalidatePath("/app/services/dashboard");
    revalidatePath(`/app/services/dashboard/${parsedOrderId}`);
    revalidatePath("/app/company/orders");
    return { success: true };
}

export const rejectOrderAction = rejectServiceProposalAction;
