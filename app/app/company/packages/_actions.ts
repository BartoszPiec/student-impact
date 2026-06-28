"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { resolveCommissionRate } from "@/lib/commission";
import { buildRequestSnapshot, extractRequestFormAnswers } from "@/lib/services/service-order-snapshots";
import {
    buildPackageBriefDescription,
    isSystemServicePackage,
    normalizePackageFormSchema,
    PACKAGE_BRIEF_SEPARATOR,
    resolvePackageVariantsWithFallback,
    resolveSelectedPackageVariant,
    splitPackageBriefDescription,
    type PackageFormField,
} from "@/lib/services/package-customization";
import { fetchAvailableLogoStudents, LOGO_PACKAGE_ID } from "@/lib/services/logo-student-selection";
import { ensureConversationForServiceOrder } from "@/lib/services/service-order-conversations";
import { UUID_RE } from "@/lib/security/validation";
import { logCompanyPackageError } from "@/lib/observability/company-packages";

const MAX_BRIEF_FIELD_LENGTH = 2_000;
const PACKAGE_OFFER_CREATE_ERROR_MESSAGE = "Nie udalo sie utworzyc oferty z pakietu.";
const PACKAGE_RESET_ERROR_MESSAGE = "Nie udalo sie odswiezyc katalogu uslug.";
const PACKAGE_ORDER_CREATE_ERROR_MESSAGE = "Nie udalo sie utworzyc zamowienia uslugi.";
const PACKAGE_INQUIRY_CREATE_ERROR_MESSAGE = "Nie udalo sie utworzyc zapytania do studenta.";
const PACKAGE_CONTEXT_CREATE_ERROR_MESSAGE = "Nie udalo sie przygotowac kontekstu rozmowy.";
const PACKAGE_UPDATE_ERROR_MESSAGE = "Nie udalo sie zapisac zmian oferty.";

const uuidSchema = z.string().trim().regex(UUID_RE, "Nieprawidłowy identyfikator.");
const optionalBriefText = (max: number, message: string) =>
    z.preprocess(
        (value) => (typeof value === "string" ? value : ""),
        z.string().trim().max(max, message),
    );
const materialsLinkSchema = optionalBriefText(600, "Link do materiałów jest zbyt długi.").refine(
    (value) => !value || value.startsWith("https://"),
    "Link do materiałów musi używać HTTPS.",
);
const packageBriefInputSchema = z.object({
    variantName: optionalBriefText(80, "Wariant pakietu jest nieprawidłowy."),
    notes: optionalBriefText(2_000, "Dodatkowe uwagi są zbyt długie."),
    deadline: optionalBriefText(120, "Preferowany termin jest zbyt długi."),
    materialsLink: materialsLinkSchema,
    studentSelectionMode: optionalBriefText(40, "Tryb wyboru studenta jest nieprawidłowy."),
    videoGoal: optionalBriefText(1_000, "Cel wideo jest zbyt długi."),
    targetGroup: optionalBriefText(1_000, "Grupa docelowa jest zbyt długa."),
    inspiration: optionalBriefText(1_000, "Inspiracje są zbyt długie."),
    audioStyle: optionalBriefText(500, "Opis audio jest zbyt długi."),
    format: optionalBriefText(300, "Format jest zbyt długi."),
    branding: optionalBriefText(800, "Opis brandingu jest zbyt długi."),
    brandName: optionalBriefText(200, "Nazwa marki jest zbyt długa."),
    industry: optionalBriefText(300, "Branża jest zbyt długa."),
    style: optionalBriefText(800, "Opis stylu jest zbyt długi."),
    colors: optionalBriefText(500, "Opis kolorystyki jest zbyt długi."),
    campaignGoal: optionalBriefText(1_000, "Cel kampanii jest zbyt długi."),
    platforms: optionalBriefText(500, "Lista platform jest zbyt długa."),
    processDesc: optionalBriefText(1_000, "Opis procesu jest zbyt długi."),
    expectedEffect: optionalBriefText(1_000, "Opis oczekiwanego efektu jest zbyt długi."),
});

function parseOrThrow<T>(parsed: z.ZodSafeParseResult<T>): T {
    if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || "Nieprawidłowe dane formularza.");
    }

    return parsed.data;
}

function parsePackageBriefInput(formData: FormData) {
    return parseOrThrow(
        packageBriefInputSchema.safeParse(Object.fromEntries([
            "variantName",
            "notes",
            "deadline",
            "materialsLink",
            "studentSelectionMode",
            "videoGoal",
            "targetGroup",
            "inspiration",
            "audioStyle",
            "format",
            "branding",
            "brandName",
            "industry",
            "style",
            "colors",
            "campaignGoal",
            "platforms",
            "processDesc",
            "expectedEffect",
        ].map((key) => [key, formData.get(key)]))),
    );
}

function readOperationalErrorMessage(error: unknown): string {
    if (!error || typeof error !== "object" || !("message" in error)) {
        return "";
    }

    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : "";
}

function hasOperationalErrorMessage(error: unknown, token: string) {
    return readOperationalErrorMessage(error).includes(token);
}

function extractValidatedFormAnswers(formData: FormData, schema: PackageFormField[]) {
    const entries: Array<[string, FormDataEntryValue]> = [];

    for (const field of schema) {
        const key = `q_${field.id}`;
        const rawValue = formData.get(key);
        if (rawValue == null) continue;

        let value = "";
        if (typeof rawValue === "string") {
            value = rawValue.trim();
        } else if (typeof File !== "undefined" && rawValue instanceof File) {
            value = rawValue.name.trim();
        }

        if (!value) continue;

        const maxLength = Math.min(field.maxLength ?? MAX_BRIEF_FIELD_LENGTH, MAX_BRIEF_FIELD_LENGTH);
        if (value.length > maxLength) {
            throw new Error(`Pole "${field.label}" jest zbyt długie.`);
        }

        if ((field.type === "select" || field.type === "radio") && field.options?.length) {
            const allowedValues = new Set(field.options.map((option) => option.value));
            if (!allowedValues.has(value)) {
                throw new Error(`Wybrano nieprawidłową odpowiedź w polu "${field.label}".`);
            }
        }

        if (field.inputType === "url" && !value.startsWith("https://")) {
            throw new Error(`Pole "${field.label}" musi zawierać adres HTTPS.`);
        }

        if (field.inputType === "email" && !z.string().email().safeParse(value).success) {
            throw new Error(`Pole "${field.label}" musi zawierać poprawny adres email.`);
        }

        entries.push([key, value]);
    }

    return extractRequestFormAnswers(entries, schema);
}

async function requireProfileRole(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    allowedRoles: Array<"company" | "admin">,
) {
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

    if (error || !profile?.role || !allowedRoles.includes(profile.role as "company" | "admin")) {
        throw new Error("Brak uprawnien do wykonania tej akcji.");
    }
}

export async function createOfferFromPackage(packageId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Musisz być zalogowany.");
    }

    await requireProfileRole(supabase, user.id, ["company"]);
    const parsedPackageId = parseOrThrow(uuidSchema.safeParse(packageId));

    // Fetch package details
    const { data: pkg, error: pkgError } = await supabase
        .from("service_packages")
        .select("id, title, description, price, delivery_time_days, type, student_id, commission_rate, category, features")
        .eq("id", parsedPackageId)
        .single();

    if (pkgError || !pkg) {
        throw new Error("Nie znaleziono pakietu usługi.");
    }

    if (pkg.student_id && pkg.student_id === user.id) {
        throw new Error("Nie mozesz zamowic wlasnej usługi.");
    }

    const isPlatformService = pkg.type === 'platform_service';
    const packageTitle = pkg.id === LOGO_PACKAGE_ID ? "Projekt Logo" : pkg.title;
    // Create Offer
    const { data: offer, error: offerError } = await supabase
        .from("offers")
        .insert({
            company_id: user.id,
            tytul: packageTitle,
            opis: pkg.description,
            stawka: pkg.price,
            czas: `${pkg.delivery_time_days} dni`,
            status: "published",
            typ: isPlatformService ? "projekt" : "zlecenie",
            is_platform_service: isPlatformService,
            service_package_id: pkg.id,
            commission_rate: resolveCommissionRate({
                explicitRate: pkg.commission_rate ?? null,
                sourceType: "service_order",
                isPlatformService,
            }),
            technologies: [],
            contract_type: "B2B",
            kategoria: pkg.category, // Pass category from package
            wymagania: pkg.features || [] // Pass features as requirements if available
        })
        .select("id")
        .single();

    if (offerError) {
        await logCompanyPackageError({
            source: "company_packages.create_offer.insert_offer",
            error: offerError,
            userId: user.id,
            packageId: parsedPackageId,
            message: PACKAGE_OFFER_CREATE_ERROR_MESSAGE,
            context: { isPlatformService },
        });
        throw new Error(PACKAGE_OFFER_CREATE_ERROR_MESSAGE);
    }

    revalidatePath("/app/company/offers");
    redirect(`/app/offers/${offer.id}`);
}

export async function resetServices() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Musisz być zalogowany.");
    }

    await requireProfileRole(supabase, user.id, ["admin"]);

    // 1. Delete old platform services (avoid deleting 'Piec' which is a user/student gig)
    const { error: deleteError } = await supabase.from("service_packages")
        .delete()
        .neq("type", "student_gig") // Safest bet if types were partially applied
        .not("title", "ilike", "%Piec%"); // Backup condition

    if (deleteError) {
        await logCompanyPackageError({
            source: "company_packages.reset_services.delete_existing",
            error: deleteError,
            userId: user.id,
            message: PACKAGE_RESET_ERROR_MESSAGE,
        });
        throw new Error(PACKAGE_RESET_ERROR_MESSAGE);
    }

    // 2. Insert fresh Platform Services
    const { error } = await supabase.from("service_packages").insert([
        {
            title: "Montaz Rolek (TikTok, Reels, Shorts)",
            description: "Dynamiczny montaz krotkich form wideo. Dodanie napisow (captions), przejsc, muzyki trendujacej i efektow dzwiekowych.",
            category: "Wideo i UGC",
            price: 150.00,
            delivery_time_days: 2,
            type: 'platform_service'
        },
        {
            title: "Montaz Wideo na YouTube",
            description: "Profesjonalny montaz dluzszego materialu (do 15 min). Korekcja kolorow, audio, intro/outro, B-roll.",
            category: "Wideo i UGC",
            price: 400.00,
            delivery_time_days: 5,
            type: 'platform_service'
        },
        {
            title: "Przygotowanie Logo",
            description: "3 propozycje logo + ksiega znaku. Pliki wektorowe i rastrowe (PNG, SVG, AI).",
            category: "Grafika i materiały sprzedażowe",
            price: 500.00,
            delivery_time_days: 7,
            type: 'platform_service'
        },
        {
            title: "Kampania Marketingowa",
            description: "Kompleksowa kampania w social media (FB + IG). Obejmuje 8 postow, 4 stories i moderacje komentarzy przez miesiac.",
            category: "Marketing i social media",
            price: 1200.00,
            delivery_time_days: 30,
            type: 'platform_service'
        },
        {
            title: "Automatyzacja Skrzynki Pocztowej",
            description: "Wdrozenie autoresponderow i etykietowania w Gmail/Outlook. Oszczedz 5h tygodniowo na segregowaniu maili.",
            category: "Automatyzacje, AI i narzędzia",
            price: 300.00,
            delivery_time_days: 3,
            type: 'platform_service'
        }
    ]);

    if (error) {
        await logCompanyPackageError({
            source: "company_packages.reset_services.insert_defaults",
            error,
            userId: user.id,
            message: PACKAGE_RESET_ERROR_MESSAGE,
        });
        throw new Error(PACKAGE_RESET_ERROR_MESSAGE);
    }

    revalidatePath("/app/company/packages");
}

export async function createCustomizedOffer(packageId: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Musisz być zalogowany.");
    }

    await requireProfileRole(supabase, user.id, ["company"]);
    const parsedPackageId = parseOrThrow(uuidSchema.safeParse(packageId));
    const briefInput = parsePackageBriefInput(formData);

    // Fetch package details
    const { data: pkg, error: pkgError } = await supabase
        .from("service_packages")
        .select("*")
        .eq("id", parsedPackageId)
        .single();

    if (pkgError || !pkg) {
        throw new Error("Nie znaleziono pakietu usługi.");
    }

    if (pkg.student_id && pkg.student_id === user.id) {
        throw new Error("Nie mozesz zamowic wlasnej usługi.");
    }

    const isSystemPackage = isSystemServicePackage(pkg);
    const formSchema = normalizePackageFormSchema(pkg.form_schema);
    const variants = resolvePackageVariantsWithFallback(pkg.id, pkg.variants);
    const selectedVariant = resolveSelectedPackageVariant(
        variants,
        briefInput.variantName,
    );
    const useDynamicBrief = isSystemPackage && formSchema.length > 0;
    const formAnswers = useDynamicBrief
        ? extractValidatedFormAnswers(formData, formSchema)
        : [];
    const effectivePrice = Number(selectedVariant?.price ?? pkg.price);
    if (!Number.isFinite(effectivePrice) || effectivePrice <= 0) {
        throw new Error("Pakiet nie ma poprawnej ceny.");
    }
    const effectiveCommissionRate = selectedVariant?.commission_rate ?? pkg.commission_rate ?? null;
    const baseTitle = pkg.id === LOGO_PACKAGE_ID ? "Projekt Logo" : pkg.title;
    const effectiveTitle = selectedVariant ? `${baseTitle} - ${selectedVariant.label}` : baseTitle;

    // Construct Detailed Description based on Form Data
    let customDescription = `${pkg.description}` + "\n\n" + PACKAGE_BRIEF_SEPARATOR + "\n";

    // General
    const notes = briefInput.notes;
    const deadline = briefInput.deadline;

    // Video
    const videoGoal = briefInput.videoGoal;
    const targetGroup = briefInput.targetGroup;
    const materialsLink = briefInput.materialsLink;
    const inspiration = briefInput.inspiration;
    const audioStyle = briefInput.audioStyle;
    const format = briefInput.format;
    const branding = briefInput.branding;

    // Logo
    const brandName = briefInput.brandName;
    const industry = briefInput.industry;
    const style = briefInput.style;
    const colors = briefInput.colors;

    // Marketing
    const campaignGoal = briefInput.campaignGoal;
    const platforms = briefInput.platforms;

    // Automation
    const processDesc = briefInput.processDesc;
    const expectedEffect = briefInput.expectedEffect;


    // Appending logic (checking if field exists)
    const legacyDetailRows: Array<{ label: string; value: string }> = [
        { label: "Nazwa marki", value: brandName },
        { label: "Branza", value: industry },
        { label: "Cel wideo", value: videoGoal },
        { label: "Cel kampanii", value: campaignGoal },
        { label: "Grupa docelowa", value: targetGroup },
        { label: "Platformy", value: platforms },
        { label: "Format", value: format },
        { label: "Styl", value: style },
        { label: "Branding", value: branding },
        { label: "Kolorystyka", value: colors },
        { label: "Audio/Muzyka", value: audioStyle },
        { label: "Inspiracje", value: inspiration },
        { label: "Obecny proces", value: processDesc },
        { label: "Oczekiwany efekt", value: expectedEffect },
    ];

    legacyDetailRows.forEach((row) => {
        const trimmed = row.value?.trim();
        if (trimmed) {
            customDescription += `\n- ${row.label}: ${trimmed}`;
        }
    });

    if (materialsLink?.trim()) customDescription += `\n\nLINK DO MATERIALOW:\n${materialsLink.trim()}`;
    if (deadline?.trim()) customDescription += `\n\nPreferowany termin: ${deadline.trim()}`;
    if (notes?.trim()) customDescription += `\n\nDodatkowe uwagi:\n${notes.trim()}`;


    // Platform services (systemowe) maja student_id = NULL - uzywamy starego flow (tylko offers)
    if (useDynamicBrief) {
        customDescription = buildPackageBriefDescription({
            baseDescription: pkg.description,
            formAnswers,
            notes,
            deadline,
            variant: selectedVariant,
        });
    }

    if (isSystemPackage) {
        const isLogoPackage = pkg.id === LOGO_PACKAGE_ID;

        if (isLogoPackage) {
            const requestedSelectionMode = briefInput.studentSelectionMode || "company_choice";
            const studentSelectionMode = requestedSelectionMode === "auto_assign" ? "auto_assign" : "company_choice";
            const availableStudents = await fetchAvailableLogoStudents(supabase, { maxActiveOrders: 1 });
            const studentById = new Map(availableStudents.map((candidate) => [candidate.userId, candidate]));
            const selectionLabel = studentSelectionMode === "auto_assign" ? "Przydziel automatycznie" : "Wybieram studenta sam";
            const studentPoolSnapshot = availableStudents.map((candidate) => ({
                user_id: candidate.userId,
                display_name: candidate.displayName,
                active_orders: candidate.activeOrders,
                portfolio_preview: candidate.portfolioPreview,
            }));
            const snapshotAdditionalInfo = [notes?.trim(), `Tryb wyboru studenta: ${selectionLabel}`]
                .filter((value): value is string => Boolean(value && value.length > 0))
                .join("\n\n");

            const requestSnapshot = buildRequestSnapshot({
                packageId: parsedPackageId,
                packageTitle: effectiveTitle,
                contactEmail: user.email || "",
                formAnswers,
                additionalInfo: snapshotAdditionalInfo || null,
            });

            let { data: logoOrder, error: logoOrderError } = await supabase
                .from("service_orders")
                .insert({
                    company_id: user.id,
                    student_id: null,
                    package_id: parsedPackageId,
                    status: "pending_selection",
                    amount: effectivePrice,
                    variant_key: selectedVariant?.name ?? null,
                    requirements: customDescription,
                    title: effectiveTitle,
                    request_snapshot: requestSnapshot,
                    student_selection_mode: studentSelectionMode,
                    student_selected_at: null,
                    student_pool_snapshot: studentPoolSnapshot,
                    entry_point: "company_request",
                    initiated_by: "company",
                })
                .select("id, student_id, status")
                .single();

            let logoFallbackStatusAttempted = false;
            if (hasOperationalErrorMessage(logoOrderError, "service_orders_status_check")) {
                logoFallbackStatusAttempted = true;
                const fallback = await supabase
                    .from("service_orders")
                    .insert({
                        company_id: user.id,
                        student_id: null,
                        package_id: parsedPackageId,
                        status: "pending",
                        amount: effectivePrice,
                        variant_key: selectedVariant?.name ?? null,
                        requirements: customDescription,
                        title: effectiveTitle,
                        request_snapshot: requestSnapshot,
                        student_selection_mode: studentSelectionMode,
                        student_selected_at: null,
                        student_pool_snapshot: studentPoolSnapshot,
                        entry_point: "company_request",
                        initiated_by: "company",
                    })
                    .select("id, student_id, status")
                    .single();

                logoOrder = fallback.data;
                logoOrderError = fallback.error;
            }

            if (logoOrderError || !logoOrder) {
                await logCompanyPackageError({
                    source: "company_packages.create_customized_offer.insert_logo_order",
                    error: logoOrderError,
                    userId: user.id,
                    packageId: parsedPackageId,
                    message: PACKAGE_ORDER_CREATE_ERROR_MESSAGE,
                    context: {
                        studentSelectionMode,
                        effectivePrice,
                        fallbackStatusAttempted: logoFallbackStatusAttempted,
                    },
                });
                throw new Error(PACKAGE_ORDER_CREATE_ERROR_MESSAGE);
            }

            let assignedStudentId: string | null = null;
            let assignmentMode: "locked" | null = null;

            if (studentSelectionMode === "auto_assign") {
                for (const candidate of availableStudents) {
                    const { data: lockResult, error: lockError } = await supabase.rpc("assign_service_order_student_locked", {
                        p_order_id: logoOrder.id,
                        p_company_id: user.id,
                        p_student_id: candidate.userId,
                        p_max_active_orders: 1,
                        p_preferred_status: "pending_student_confirmation",
                        p_fallback_status: "pending",
                    });

                    const assignedRow = Array.isArray(lockResult) ? lockResult[0] : null;
                    if (lockError) {
                        if (hasOperationalErrorMessage(lockError, "does not exist")) {
                            break;
                        }
                        await logCompanyPackageError({
                            source: "company_packages.create_customized_offer.auto_assign_lock",
                            error: lockError,
                            userId: user.id,
                            packageId: parsedPackageId,
                            serviceOrderId: logoOrder.id,
                            level: "warning",
                            message: "Nie udalo sie zarezerwowac studenta dla zamowienia logo.",
                            context: { candidateStudentId: candidate.userId },
                        });
                        continue;
                    }

                    if (assignedRow?.order_id) {
                        assignedStudentId = candidate.userId;
                        assignmentMode = "locked";
                        break;
                    }
                }
            }

            const effectiveStudentId = assignedStudentId || logoOrder.student_id;
            let conversationId: string | null = null;
            if (effectiveStudentId) {
                try {
                    const conversation = await ensureConversationForServiceOrder(supabase, {
                        serviceOrderId: logoOrder.id,
                        companyId: user.id,
                        studentId: effectiveStudentId,
                        packageId: parsedPackageId,
                    });

                    conversationId = conversation.id;
                } catch (error) {
                    await logCompanyPackageError({
                        source: "company_packages.create_customized_offer.logo_conversation",
                        error,
                        userId: user.id,
                        packageId: parsedPackageId,
                        serviceOrderId: logoOrder.id,
                        level: "warning",
                        message: "Nie udalo sie utworzyc rozmowy dla zamowienia logo.",
                        context: { effectiveStudentId },
                    });
                }

                await supabase.from("notifications").insert({
                    user_id: effectiveStudentId,
                    typ: "application_new",
                    payload: {
                        snippet: `Otrzymales nowe zamowienie usługi: ${effectiveTitle}`,
                        service_order_id: logoOrder.id,
                        conversation_id: conversationId,
                    },
                });
            }

            if (studentSelectionMode === "auto_assign" && effectiveStudentId) {
                const assignedStudent = studentById.get(effectiveStudentId);
                const successSnippet = assignmentMode === "locked"
                    ? `Przydzielono studenta: ${assignedStudent?.displayName || "Student"}.`
                    : `Przydzielono studenta automatycznie: ${assignedStudent?.displayName || "Student"}.`;
                await supabase.from("notifications").insert({
                    user_id: user.id,
                    typ: "application_new",
                    payload: {
                        snippet: successSnippet,
                        service_order_id: logoOrder.id,
                        student_id: effectiveStudentId,
                    },
                });
            }

            if (studentSelectionMode === "auto_assign" && !effectiveStudentId) {
                await supabase.from("notifications").insert({
                    user_id: user.id,
                    typ: "application_new",
                    payload: {
                        snippet: "Nie udało sie automatycznie przypisac studenta. Mozesz wybrac wykonawce ręcznie z listy.",
                        service_order_id: logoOrder.id,
                    },
                });
            }

            revalidatePath("/app/company/orders");
            revalidatePath("/app/company/packages");
            revalidatePath("/app/services/dashboard");
            redirect(`/app/company/orders/${logoOrder.id}`);
        }

        const requestSnapshot = buildRequestSnapshot({
            packageId: parsedPackageId,
            packageTitle: effectiveTitle,
            contactEmail: user.email || "",
            formAnswers,
            additionalInfo: notes?.trim() || null,
        });

        let { data: serviceOrder, error: serviceOrderError } = await supabase
            .from("service_orders")
            .insert({
                company_id: user.id,
                student_id: null,
                package_id: parsedPackageId,
                status: "pending_selection",
                amount: effectivePrice,
                variant_key: selectedVariant?.name ?? null,
                requirements: customDescription,
                title: effectiveTitle,
                request_snapshot: requestSnapshot,
                student_selection_mode: "first_come",
                student_selected_at: null,
                student_pool_snapshot: [],
                entry_point: "company_request",
                initiated_by: "company",
            })
            .select("id")
            .single();

        let systemFallbackStatusAttempted = false;
        if (hasOperationalErrorMessage(serviceOrderError, "service_orders_status_check")) {
            systemFallbackStatusAttempted = true;
            const fallback = await supabase
                .from("service_orders")
                .insert({
                    company_id: user.id,
                    student_id: null,
                    package_id: parsedPackageId,
                    status: "pending",
                    amount: effectivePrice,
                    variant_key: selectedVariant?.name ?? null,
                    requirements: customDescription,
                    title: effectiveTitle,
                    request_snapshot: requestSnapshot,
                    student_selection_mode: "first_come",
                    student_selected_at: null,
                    student_pool_snapshot: [],
                    entry_point: "company_request",
                    initiated_by: "company",
                })
                .select("id")
                .single();

            serviceOrder = fallback.data;
            serviceOrderError = fallback.error;
        }

        if (serviceOrderError || !serviceOrder) {
            await logCompanyPackageError({
                source: "company_packages.create_customized_offer.insert_system_order",
                error: serviceOrderError,
                userId: user.id,
                packageId: parsedPackageId,
                message: PACKAGE_ORDER_CREATE_ERROR_MESSAGE,
                context: {
                    effectivePrice,
                    fallbackStatusAttempted: systemFallbackStatusAttempted,
                },
            });
            throw new Error(PACKAGE_ORDER_CREATE_ERROR_MESSAGE);
        }

        revalidatePath("/app/company/orders");
        revalidatePath("/app/company/packages");
        revalidatePath("/app/services/dashboard");
        redirect(`/app/company/orders/${serviceOrder.id}`);
    }

    // --- Student gig flow (student_id istnieje) ---

    // 1. Create Service Order (visible to student in /app/services/dashboard)
    const { data: order, error: orderError } = await supabase
        .from("service_orders")
        .insert({
            company_id: user.id,
            student_id: pkg.student_id,
            package_id: parsedPackageId,
            status: "inquiry",
            amount: effectivePrice,
            variant_key: selectedVariant?.name ?? null,
            requirements: customDescription,
            title: effectiveTitle,
        })
        .select("id")
        .single();

    if (orderError) {
        await logCompanyPackageError({
            source: "company_packages.create_customized_offer.insert_student_order",
            error: orderError,
            userId: user.id,
            packageId: parsedPackageId,
            message: PACKAGE_INQUIRY_CREATE_ERROR_MESSAGE,
            context: {
                studentId: pkg.student_id,
                effectivePrice,
            },
        });
        throw new Error(PACKAGE_INQUIRY_CREATE_ERROR_MESSAGE);
    }

    // 2. Create private offer context (needed for conversation linking by package_id)
    const { data: offer, error: offerError } = await supabase
        .from("offers")
        .insert({
            company_id: user.id,
            tytul: `Zamowienie: ${effectiveTitle}`,
            opis: customDescription,
            stawka: effectivePrice,
            status: "published",
            is_private: true,
            service_package_id: pkg.id,
            typ: "zlecenie",
            commission_rate: resolveCommissionRate({
                explicitRate: effectiveCommissionRate,
                sourceType: "service_order",
            }),
        })
        .select("id")
        .single();

    if (offerError) {
        await logCompanyPackageError({
            source: "company_packages.create_customized_offer.insert_private_offer",
            error: offerError,
            userId: user.id,
            packageId: parsedPackageId,
            serviceOrderId: order.id,
            message: PACKAGE_CONTEXT_CREATE_ERROR_MESSAGE,
            context: {
                studentId: pkg.student_id,
                effectivePrice,
            },
        });
        throw new Error(PACKAGE_CONTEXT_CREATE_ERROR_MESSAGE);
    }

    // 3. Create conversation with package_id so service actions can find it
    const { data: conversation, error: conversationError } = await supabase
        .from("conversations")
        .insert({
            offer_id: offer.id,
            package_id: parsedPackageId,
            student_id: pkg.student_id,
            company_id: user.id,
            type: "inquiry",
        })
        .select("id")
        .single();

    if (conversationError) {
        await logCompanyPackageError({
            source: "company_packages.create_customized_offer.insert_conversation",
            error: conversationError,
            userId: user.id,
            packageId: parsedPackageId,
            offerId: offer.id,
            serviceOrderId: order.id,
            level: "warning",
            message: "Nie udalo sie utworzyc rozmowy dla zapytania o pakiet.",
            context: { studentId: pkg.student_id },
        });
    }

    // 4. Notify student about new inquiry
    await supabase.from("notifications").insert({
        user_id: pkg.student_id,
        typ: "application_new",
        payload: {
            snippet: `Otrzymales nowe zamowienie na usługę: ${effectiveTitle}`,
            service_order_id: order.id,
            conversation_id: conversation?.id,
        }
    });

    revalidatePath("/app/company/offers");
    revalidatePath("/app/services/dashboard");

    // 5. Redirect company to chat
    if (conversation?.id) {
        redirect(`/app/chat/${conversation.id}`);
    } else {
        redirect("/app/company/offers");
    }
}


export async function updateCustomizedOffer(offerId: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Musisz być zalogowany.");
    }
    await requireProfileRole(supabase, user.id, ["company"]);
    const parsedOfferId = parseOrThrow(uuidSchema.safeParse(offerId));
    const briefInput = parsePackageBriefInput(formData);

    // 1. Fetch existing offer to preserve the BASE description (before separator)
    const { data: offer, error: fetchError } = await supabase
        .from("offers")
        .select("opis, company_id, service_package_id")
        .eq("id", parsedOfferId)
        .single();

    if (fetchError || !offer) throw new Error("Nie znaleziono oferty.");
    if (offer.company_id !== user.id) throw new Error("Nie masz uprawnień do edycji tej oferty.");

    const packageId = offer.service_package_id || null;
    const parsedPackageId = packageId ? parseOrThrow(uuidSchema.safeParse(packageId)) : null;
    const packageResponse = packageId
        ? await supabase
            .from("service_packages")
            .select("id, form_schema, variants, price, delivery_time_days, commission_rate, type, is_system, student_id")
            .eq("id", parsedPackageId)
            .maybeSingle()
        : null;
    const pkg = packageResponse?.data || null;

    if (packageResponse?.error) {
        await logCompanyPackageError({
            source: "company_packages.update_customized_offer.package_lookup",
            error: packageResponse.error,
            userId: user.id,
            packageId: parsedPackageId,
            offerId: parsedOfferId,
            message: "Nie udalo sie pobrac pakietu powiazanego z oferta.",
        });
        throw new Error("Nie udalo sie pobrac pakietu powiazanego z oferta.");
    }

    // Extract Base Description
    const separator = "\n\n" + PACKAGE_BRIEF_SEPARATOR;
    const baseDescription = splitPackageBriefDescription(offer.opis).baseDescription;

    const formSchema = normalizePackageFormSchema(pkg?.form_schema);
    const variants = resolvePackageVariantsWithFallback(packageId || "", pkg?.variants);
    const selectedVariant = resolveSelectedPackageVariant(
        variants,
        briefInput.variantName,
    );
    const isSystemPackage = isSystemServicePackage(pkg);
    const isPlatformService = isSystemPackage;
    const useDynamicBrief = Boolean(isSystemPackage && formSchema.length > 0);
    const formAnswers = useDynamicBrief
        ? extractValidatedFormAnswers(formData, formSchema)
        : [];
    const effectivePrice = selectedVariant?.price ?? pkg?.price ?? null;
    if (effectivePrice != null && (!Number.isFinite(Number(effectivePrice)) || Number(effectivePrice) <= 0)) {
        throw new Error("Pakiet nie ma poprawnej ceny.");
    }
    const effectiveDeliveryDays = selectedVariant?.delivery_time_days ?? pkg?.delivery_time_days ?? null;
    const effectiveCommissionRate = selectedVariant?.commission_rate ?? pkg?.commission_rate ?? null;

    // 2. Reconstruct Description
    let customDescription = baseDescription + separator + "\n";

    // General
    const notes = briefInput.notes;
    const deadline = briefInput.deadline;

    // Video
    const videoGoal = briefInput.videoGoal;
    const targetGroup = briefInput.targetGroup;
    const materialsLink = briefInput.materialsLink;
    const inspiration = briefInput.inspiration;
    const audioStyle = briefInput.audioStyle;
    const format = briefInput.format;
    const branding = briefInput.branding;

    // Logo
    const brandName = briefInput.brandName;
    const industry = briefInput.industry;
    const style = briefInput.style;
    const colors = briefInput.colors;

    // Marketing
    const campaignGoal = briefInput.campaignGoal;
    const platforms = briefInput.platforms;

    // Automation
    const processDesc = briefInput.processDesc;
    const expectedEffect = briefInput.expectedEffect;

    // Appending logic (same as create)
    const legacyDetailRows: Array<{ label: string; value: string }> = [
        { label: "Nazwa marki", value: brandName },
        { label: "Branza", value: industry },
        { label: "Cel wideo", value: videoGoal },
        { label: "Cel kampanii", value: campaignGoal },
        { label: "Grupa docelowa", value: targetGroup },
        { label: "Platformy", value: platforms },
        { label: "Format", value: format },
        { label: "Styl", value: style },
        { label: "Branding", value: branding },
        { label: "Kolorystyka", value: colors },
        { label: "Audio/Muzyka", value: audioStyle },
        { label: "Inspiracje", value: inspiration },
        { label: "Obecny proces", value: processDesc },
        { label: "Oczekiwany efekt", value: expectedEffect },
    ];

    legacyDetailRows.forEach((row) => {
        const trimmed = row.value?.trim();
        if (trimmed) {
            customDescription += `\n- ${row.label}: ${trimmed}`;
        }
    });

    if (materialsLink?.trim()) customDescription += `\n\nLINK DO MATERIALOW:\n${materialsLink.trim()}`;
    if (deadline?.trim()) customDescription += `\n\nPreferowany termin: ${deadline.trim()}`;
    if (notes?.trim()) customDescription += `\n\nDodatkowe uwagi:\n${notes.trim()}`;

    if (useDynamicBrief) {
        customDescription = buildPackageBriefDescription({
            baseDescription,
            formAnswers,
            notes,
            deadline,
            variant: selectedVariant,
        });
    }

    // 3. Update Offer
    const { error: updateError } = await supabase
        .from("offers")
        .update({
            opis: customDescription,
            obligations: materialsLink || undefined, // Update obligations link if provided
            ...(effectivePrice ? { stawka: effectivePrice } : {}),
            ...(effectiveDeliveryDays ? { czas: `${effectiveDeliveryDays} dni` } : {}),
            commission_rate: resolveCommissionRate({
                explicitRate: effectiveCommissionRate,
                sourceType: "service_order",
                isPlatformService,
            }),
        })
        .eq("id", parsedOfferId)
        .eq("company_id", user.id);

    if (updateError) {
        await logCompanyPackageError({
            source: "company_packages.update_customized_offer.update_offer",
            error: updateError,
            userId: user.id,
            packageId: parsedPackageId,
            offerId: parsedOfferId,
            message: PACKAGE_UPDATE_ERROR_MESSAGE,
        });
        throw new Error(PACKAGE_UPDATE_ERROR_MESSAGE);
    }

    revalidatePath("/app/company/offers");
    revalidatePath(`/app/offers/${parsedOfferId}`);
    redirect(`/app/offers/${parsedOfferId}`);
}
