"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { openChatForOfferInquiry } from "../chat/_actions";
import { parseCommissionRateInput, resolveCommissionRate } from "@/lib/commission";
import { sendNotification } from "@/lib/notifications/server";
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
import { findConversationForServiceOrder } from "@/lib/services/service-order-conversations";

type ServiceOrderNegotiationRow = {
    id: string;
    student_id: string;
    company_id: string;
    package_id: string | null;
    quote_snapshot?: ServiceOrderQuoteSnapshot | null;
    package: { title?: string | null } | null;
};

async function getConversationForOrder(
    supabase: any,
    params: { orderId: string; companyId: string; studentId: string; packageId?: string | null },
) {
    return findConversationForServiceOrder(supabase, {
        serviceOrderId: params.orderId,
        companyId: params.companyId,
        studentId: params.studentId,
        packageId: params.packageId,
    });
}

function getExplicitCommissionRateValue(data: Record<string, unknown>): string | number | null {
    const value = data["commission_rate"];
    return typeof value === "string" || typeof value === "number" ? value : null;
}

function isPlatformServiceInput(data: Record<string, unknown>): boolean {
    return data["type"] === "platform_service" || data["is_system"] === true;
}

export async function createOfferFromSystemPackage(packageId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

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
        .eq("id", packageId)
        .single();

    if (pkgErr || !pkg) throw new Error("Nie znaleziono pakietu.");

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
            // deadline? - zależy jak jest w User DB. W `createOffer` widać tylko tytul,opis,kategoria,typ,czas,wymagania,stawka,status
            // Nie widze deadline.
            // Spróbujmy dopasować do tego co widziałem w _actions.ts w new-offer
            status: "published",
            is_platform_service: true,
            commission_rate: resolveCommissionRate({
                explicitRate: pkg.commission_rate ?? null,
                sourceType: "service_order",
                isPlatformService: true,
            }),
        })
        .select("id")
        .single();

    if (offerErr) throw new Error(offerErr.message);

    revalidatePath("/app/company/offers");
    redirect(`/app/offers/${offer.id}`);
}

export async function createInquiryAction(packageId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

    const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
    if (profile?.role !== "company") throw new Error("Tylko firmy mogą wysyłać zapytania.");

    const { data: pkg } = await supabase.from("service_packages").select("*").eq("id", packageId).single();
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
        console.error("Error creating service order:", orderError);
        throw new Error("Błąd podczas tworzenia zlecenia: " + orderError.message);
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

    if (error) throw new Error(error.message);

    // Redirect to chat
    // createConversation will handle creating conversation with offer_id.
    // If we want conversation to have package_id directly, we might need to update openChatForOfferInquiry or let trigger handle it?
    // For now, linking Offer->Package is usually enough if DB triggers sync it, 
    // BUT dashboard looks for `conversations.package_id`.
    // Let's rely on the fact that `service_orders` now exists, so Dashboard shows the item.
    // Dashboard Chat Link might fail if conversation.package_id is missing.
    // We'll see.
    // Insert Notification for Student
    await supabase.from("notifications").insert({
        user_id: pkg.student_id,
        typ: "application_new",
        payload: {
            snippet: `Otrzymałeś nowe zapytanie o usługę: ${pkg.title}`,
            // No conversation ID available yet easily without double fetch, linking to general dashboard implicitly/fallback
        }
    });

    await openChatForOfferInquiry(offer.id);
}

export async function deleteServiceAction(serviceId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Musisz być zalogowany.");
    }

    // Sprawdź czy użytkownik jest właścicielem serwisu
    const { data: service } = await supabase
        .from("service_packages")
        .select("student_id")
        .eq("id", serviceId)
        .single();

    if (!service) {
        throw new Error("Nie znaleziono usługi.");
    }

    if (service.student_id !== user.id) {
        throw new Error("Nie masz uprawnień do usunięcia tej usługi.");
    }

    const { error } = await supabase
        .from("service_packages")
        .delete()
        .eq("id", serviceId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/app/services/my");
    return { success: true };
}

export async function createServiceAction(data: Record<string, unknown>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Musisz być zalogowany.");

    const { error } = await supabase
        .from("service_packages")
        .insert({
            ...data,
            commission_rate: resolveCommissionRate({
                explicitRate: parseCommissionRateInput(getExplicitCommissionRateValue(data)),
                sourceType: "service_order",
                isPlatformService: isPlatformServiceInput(data),
            }),
            student_id: user.id
        });

    if (error) throw new Error(error.message);

    revalidatePath("/app/services/my");
    return { success: true };
}

export async function updateServiceAction(serviceId: string, data: Record<string, unknown>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Musisz być zalogowany.");

    // Verify ownership
    const { data: service } = await supabase
        .from("service_packages")
        .select("student_id")
        .eq("id", serviceId)
        .single();

    if (!service || service.student_id !== user.id) {
        throw new Error("Nie masz uprawnień.");
    }

    const { error } = await supabase
        .from("service_packages")
        .update({
            ...data,
            commission_rate: resolveCommissionRate({
                explicitRate: parseCommissionRateInput(getExplicitCommissionRateValue(data)),
                sourceType: "service_order",
                isPlatformService: isPlatformServiceInput(data),
            }),
        })
        .eq("id", serviceId);

    if (error) throw new Error(error.message);

    revalidatePath("/app/services/my");
    return { success: true };
}

export async function toggleServiceStatusAction(serviceId: string, newStatus: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Musisz być zalogowany.");

    // Verify ownership
    const { data: service } = await supabase
        .from("service_packages")
        .select("student_id")
        .eq("id", serviceId)
        .single();

    if (!service || service.student_id !== user.id) {
        throw new Error("Nie masz uprawnień.");
    }

    const { error } = await supabase
        .from("service_packages")
        .update({ status: newStatus })
        .eq("id", serviceId);

    if (error) throw new Error(error.message);

    revalidatePath("/app/services/my");
}

export async function createPrivateProposalAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Musisz byc zalogowany.");
    }

    const packageId = String(formData.get("packageId") || "");
    const targetCompanyId = String(formData.get("companyId") || "");
    const proposalGoal = String(formData.get("proposal_goal") || "").trim();
    const expectedResult = String(formData.get("expected_result") || "").trim();
    const scopeSummary = String(formData.get("scope_summary") || "").trim();
    const timelineRaw = String(formData.get("estimated_timeline_days") || "").trim();
    const proposedAmountRaw = String(formData.get("proposed_amount") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!packageId || !targetCompanyId) {
        throw new Error("Wybierz usluge i firme docelowa.");
    }

    if (!proposalGoal || !expectedResult || !scopeSummary) {
        throw new Error("Uzupelnij cel wspolpracy, oczekiwany rezultat i zakres propozycji.");
    }

    const proposedAmount = Number(proposedAmountRaw);
    if (!proposedAmount || Number.isNaN(proposedAmount) || proposedAmount <= 0) {
        throw new Error("Podaj prawidlowa proponowana kwote.");
    }

    const estimatedTimelineDays = timelineRaw ? Number(timelineRaw) : null;
    if (timelineRaw && (!estimatedTimelineDays || Number.isNaN(estimatedTimelineDays) || estimatedTimelineDays <= 0)) {
        throw new Error("Podaj prawidlowa liczbe dni realizacji.");
    }

    const { data: pkg, error: pkgError } = await supabase
        .from("service_packages")
        .select("id, student_id, title, description")
        .eq("id", packageId)
        .eq("student_id", user.id)
        .single();

    if (pkgError || !pkg) {
        throw new Error("Nie znaleziono wybranej uslugi.");
    }

    await assertStudentCanPrivatelyProposeToCompany(supabase, user.id, targetCompanyId);

    const { data: company } = await supabase
        .from("company_profiles")
        .select("nazwa")
        .eq("user_id", targetCompanyId)
        .maybeSingle();

    const requestSnapshot = buildPrivateProposalRequestSnapshot({
        packageId: pkg.id,
        packageTitle: pkg.title || "Usluga",
        targetCompanyId,
        targetCompanyName: company?.nazwa || null,
        proposalGoal,
        expectedResult,
        scopeSummary,
        estimatedTimelineDays,
        proposedAmount,
        message,
    });

    const requirementsText = buildPrivateProposalLegacyText({
        targetCompanyName: company?.nazwa || null,
        proposalGoal,
        expectedResult,
        scopeSummary,
        estimatedTimelineDays,
        proposedAmount,
        message,
    });

    const quoteSnapshot = buildStudentProposalSnapshot(null, {
        amount: proposedAmount,
        message: message || null,
    });

    const { data: order, error: insertError } = await supabase
        .from("service_orders")
        .insert({
            company_id: targetCompanyId,
            student_id: user.id,
            package_id: packageId,
            title: pkg.title,
            amount: proposedAmount,
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
        throw new Error(insertError?.message || "Nie udalo sie zapisac prywatnej propozycji.");
    }

    const { data: conversation, error: conversationError } = await supabase
        .from("conversations")
        .insert({
            company_id: targetCompanyId,
            student_id: user.id,
            status: "active",
            type: "inquiry",
            package_id: packageId,
            application_id: null,
            service_order_id: order.id,
        })
        .select("id")
        .single();

    if (conversationError) {
        throw new Error(conversationError.message);
    }

    await supabase.from("messages").insert([
        {
            conversation_id: conversation.id,
            sender_id: user.id,
            content: "Student wyslal prywatna propozycje wspolpracy.",
        },
        {
            conversation_id: conversation.id,
            sender_id: user.id,
            content: requirementsText,
            event: "inquiry_details",
        },
    ]);

    await sendNotification(targetCompanyId, "application_new", {
        conversation_id: conversation.id,
        service_order_id: order.id,
        snippet: `Otrzymales prywatna propozycje wspolpracy: ${pkg.title}`,
        offer_title: pkg.title,
    });

    revalidatePath("/app/services/dashboard");
    revalidatePath("/app/company/orders");
    revalidatePath("/app/chat");
    redirect(`/app/services/dashboard/${order.id}`);
}

export async function proposeServicePriceAction(orderId: string, price: number, message?: string) {
    console.log("Server Action: proposeServicePriceAction started", { orderId, price, message });
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error("Unauthorized");

        // Verify ownership (Student side)
        const { data: orderData } = await supabase
            .from("service_orders")
            .select("id, student_id, company_id, package_id, quote_snapshot, package:service_packages(title)")
            .eq("id", orderId)
            .single();
        const order = orderData as ServiceOrderNegotiationRow | null;

        if (!order || order.student_id !== user.id) {
            console.error("Order not found or unauthorized", order);
            throw new Error("To nie jest twoje zlecenie.");
        }

        const quoteSnapshot = buildStudentProposalSnapshot(
            isQuoteSnapshot(order?.quote_snapshot) ? order.quote_snapshot : null,
            { amount: price, message }
        );

        const { error } = await supabase
            .from("service_orders")
            .update({
                amount: price,
                status: "proposal_sent",
                quote_snapshot: quoteSnapshot,
            })
            .eq("id", orderId);

        if (error) {
            console.error("Error updating service_orders", error);
            throw new Error(error.message);
        }

        // Find Conversation to link notification and message
        const conv = await getConversationForOrder(supabase, {
            orderId,
            companyId: order.company_id,
            studentId: user.id,
            packageId: order.package_id,
        });

        console.log("Found conversation:", conv?.id);

        if (conv) {
            // 1. Send "Negotiation Proposed" system message (Interactive Bubble)
            const { error: eventError } = await supabase.from("messages").insert({
                conversation_id: conv.id,
                sender_id: user.id,
                content: `Złożył ofertę realizacji: ${price} PLN.`,
                event: "negotiation_proposed",
                payload: {
                    proposed_stawka: price,
                    initiator: "student",
                    service_order_id: orderId // Context if needed
                }
            });
            if (eventError) console.error("Error inserting event message", eventError);

            // 2. Send optional text message
            if (message) {
                const { error: msgError } = await supabase.from("messages").insert({
                    conversation_id: conv.id,
                    sender_id: user.id,
                    content: message
                });
                if (msgError) console.error("Error inserting message", msgError);
            }

            // 3. Send Notification via RPC (bypasses RLS issues usually)
            await sendNotification(order.company_id, "negotiation_proposed", {
                    conversation_id: conv.id,
                    snippet: message ? `Nowa oferta (${price} PLN): ${message.slice(0, 40)}...` : `Otrzymałeś ofertę: ${price} PLN`,
                    proposed_stawka: price,
                    offer_title: order.package?.title || 'Usługa'
            });
        } else {
            console.warn("No conversation found, skipping messages/notification");
        }

        revalidatePath("/app/services/dashboard");
        revalidatePath("/app/company/orders");
        return { success: true };
    } catch (err: unknown) {
        console.error("Action Error:", err);
        // Throw simple error for client toast
        throw new Error(err instanceof Error ? err.message : "Wystąpił błąd po stronie serwera.");
    }
}

export async function acceptServiceProposalAction(orderId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Verify Company
    const { data: order } = await supabase.from("service_orders").select("*").eq("id", orderId).single();
    if (!order || order.company_id !== user.id) throw new Error("Nie masz uprawnień.");

    const acceptedSnapshot = buildAcceptedQuoteSnapshot(
        isQuoteSnapshot(order.quote_snapshot) ? order.quote_snapshot : null,
        { amount: order.amount, acceptedBy: "company" }
    );

    // Update Order
    const { error } = await supabase.from("service_orders")
        .update({ status: "accepted", agreed_amount: order.amount, quote_snapshot: acceptedSnapshot })
        .eq("id", orderId);
    if (error) throw new Error(error.message);

    // ✅ [Realization Guard]
    await supabase.rpc("ensure_contract_for_service_order", {
        p_service_order_id: orderId,
    });

    // Find Convo for Msg
    const conv = await getConversationForOrder(supabase, {
        orderId,
        companyId: order.company_id,
        studentId: order.student_id,
        packageId: order.package_id,
    });

    if (conv) {
        // System Msg
        await supabase.from("messages").insert({
            conversation_id: conv.id,
            sender_id: user.id,
            content: `Zaakceptowano ofertę: ${order.amount} PLN.`,
            event: "application_accepted"
        });
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
    if (!user) throw new Error("Unauthorized");

    const { data: order } = await supabase.from("service_orders").select("*").eq("id", orderId).single();
    if (order?.company_id !== user.id && order?.student_id !== user.id) throw new Error("Nie masz uprawnień.");

    const rejectedSnapshot = buildRejectedQuoteSnapshot(
        isQuoteSnapshot(order?.quote_snapshot) ? order.quote_snapshot : null
    );

    const { error } = await supabase
        .from("service_orders")
        .update({ status: "rejected", quote_snapshot: rejectedSnapshot })
        .eq("id", orderId);
    if (error) throw new Error(error.message);

    const conv = await getConversationForOrder(supabase, {
        orderId,
        companyId: order.company_id,
        studentId: order.student_id,
        packageId: order.package_id,
    });

    if (conv) {
        await supabase.from("messages").insert({
            conversation_id: conv.id,
            sender_id: user.id,
            content: "Oferta została odrzucona.",
            event: "application_rejected"
        });
    }
    revalidatePath("/app/services/dashboard");
    revalidatePath("/app/company/orders");
    return { success: true };
}

export async function counterServiceProposalAction(orderId: string, amount: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Company Counters
    const { data: order } = await supabase.from("service_orders").select("*").eq("id", orderId).single();
    if (!order || order.company_id !== user.id) throw new Error("Nie masz uprawnień.");

    const counterSnapshot = buildCompanyCounterSnapshot(
        isQuoteSnapshot(order.quote_snapshot) ? order.quote_snapshot : null,
        { amount }
    );

    const { error } = await supabase.from("service_orders")
        .update({ status: "countered", counter_amount: amount, quote_snapshot: counterSnapshot })
        .eq("id", orderId);

    if (error) throw new Error(error.message);

    const conv = await getConversationForOrder(supabase, {
        orderId,
        companyId: order.company_id,
        studentId: order.student_id,
        packageId: order.package_id,
    });

    if (conv) {
        await supabase.from("messages").insert({
            conversation_id: conv.id,
            sender_id: user.id,
            content: `Zaproponowano inną stawkę: ${amount} PLN.`,
            event: "counter_offer",
            payload: { counter_stawka: amount, initiator: "company" }
        });
        await sendNotification(order.student_id, "negotiation_proposed", {
            p_user_id: order.student_id,
            p_typ: "negotiation_proposed",
            p_payload: { conversation_id: conv.id, snippet: `Firma zaproponowała nową stawkę: ${amount} PLN`, proposed_stawka: amount }
        });
    }
    revalidatePath("/app/services/dashboard");
    revalidatePath("/app/company/orders");
    return { success: true };
}

export async function acceptServiceCounterAction(orderId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Student Accepts Counter
    const { data: order } = await supabase.from("service_orders").select("*").eq("id", orderId).single();
    if (!order || order.student_id !== user.id) throw new Error("Nie masz uprawnień.");

    const acceptedSnapshot = buildAcceptedQuoteSnapshot(
        isQuoteSnapshot(order.quote_snapshot) ? order.quote_snapshot : null,
        { amount: order.counter_amount, acceptedBy: "student" }
    );

    const { error } = await supabase.from("service_orders")
        .update({
            status: "accepted",
            agreed_amount: order.counter_amount,
            amount: order.counter_amount,
            quote_snapshot: acceptedSnapshot
        })
        .eq("id", orderId);

    if (error) throw new Error(error.message);

    // ✅ [Realization Guard] — same as acceptServiceProposalAction
    await supabase.rpc("ensure_contract_for_service_order", {
        p_service_order_id: orderId,
    });

    const conv = await getConversationForOrder(supabase, {
        orderId,
        companyId: order.company_id,
        studentId: order.student_id,
        packageId: order.package_id,
    });

    if (conv) {
        await supabase.from("messages").insert({
            conversation_id: conv.id,
            sender_id: user.id,
            content: `Zaakceptowano kontrofertę: ${order.counter_amount} PLN.`,
            event: "counter_accepted"
        });
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

export const rejectOrderAction = rejectServiceProposalAction;
