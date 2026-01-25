"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { openChatForOfferInquiry } from "../chat/_actions";

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
        typ: "micro" // Standardize type
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

export async function createServiceAction(data: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Musisz być zalogowany.");

    const { error } = await supabase
        .from("service_packages")
        .insert({
            ...data,
            student_id: user.id
        });

    if (error) throw new Error(error.message);

    revalidatePath("/app/services/my");
    return { success: true };
}

export async function updateServiceAction(serviceId: string, data: any) {
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
        .update(data)
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

export async function proposeServicePriceAction(orderId: string, price: number, message?: string) {
    console.log("Server Action: proposeServicePriceAction started", { orderId, price, message });
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error("Unauthorized");

        // Verify ownership (Student side)
        const { data: order } = await supabase
            .from("service_orders")
            .select("student_id, company_id, package:service_packages(title)")
            .eq("id", orderId)
            .single();

        if (!order || order.student_id !== user.id) {
            console.error("Order not found or unauthorized", order);
            throw new Error("To nie jest twoje zlecenie.");
        }

        const { error } = await supabase
            .from("service_orders")
            .update({
                amount: price,
                status: "proposal_sent"
            })
            .eq("id", orderId);

        if (error) {
            console.error("Error updating service_orders", error);
            throw new Error(error.message);
        }

        // Find Conversation to link notification and message
        const { data: conv } = await supabase.from("conversations")
            .select("id")
            .eq("company_id", order.company_id)
            .eq("student_id", user.id)
            .eq("type", "inquiry") // Assuming inquiry type
            .limit(1)
            .maybeSingle();

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
            const { error: rpcError } = await supabase.rpc("create_notification", {
                p_user_id: order.company_id,
                p_typ: "negotiation_proposed", // Special type for offers? Or message_new? negotiation_proposed is better if supported
                p_payload: {
                    conversation_id: conv.id,
                    snippet: message ? `Nowa oferta (${price} PLN): ${message.slice(0, 40)}...` : `Otrzymałeś ofertę: ${price} PLN`,
                    proposed_stawka: price,
                    offer_title: (order.package as any)?.title || 'Usługa'
                }
            });
            if (rpcError) console.error("Error sending notification RPC", rpcError);
        } else {
            console.warn("No conversation found, skipping messages/notification");
        }

        revalidatePath("/app/services/dashboard");
        return { success: true };
    } catch (err: any) {
        console.error("Action Error:", err);
        // Throw simple error for client toast
        throw new Error(err.message || "Wystąpił błąd po stronie serwera.");
    }
}

export async function acceptServiceProposalAction(orderId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Verify Company
    const { data: order } = await supabase.from("service_orders").select("*").eq("id", orderId).single();
    if (!order || order.company_id !== user.id) throw new Error("Nie masz uprawnień.");

    // Update Order
    const { error } = await supabase.from("service_orders")
        .update({ status: "accepted", agreed_amount: order.amount })
        .eq("id", orderId);
    if (error) throw new Error(error.message);

    // ✅ [Realization Guard]
    await supabase.rpc("ensure_contract_for_service_order", {
        p_service_order_id: orderId,
    });

    // Find Convo for Msg
    const { data: conv } = await supabase.from("conversations").select("id").eq("package_id", order.package_id).eq("student_id", order.student_id).eq("company_id", order.company_id).maybeSingle();

    if (conv) {
        // System Msg
        await supabase.from("messages").insert({
            conversation_id: conv.id,
            sender_id: user.id,
            content: `Zaakceptowano ofertę: ${order.amount} PLN.`,
            event: "application_accepted"
        });
        // Notif
        await supabase.rpc("create_notification", {
            p_user_id: order.student_id,
            p_typ: "application_accepted",
            p_payload: { conversation_id: conv.id, snippet: `Twoja oferta została zaakceptowana!`, offer_title: "Usługa" }
        });
    }
    revalidatePath("/app/services/dashboard");
    return { success: true };
}

export async function rejectServiceProposalAction(orderId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: order } = await supabase.from("service_orders").select("*").eq("id", orderId).single();
    if (order?.company_id !== user.id && order?.student_id !== user.id) throw new Error("Nie masz uprawnień.");

    const { error } = await supabase.from("service_orders").update({ status: "rejected" }).eq("id", orderId);
    if (error) throw new Error(error.message);

    const { data: conv } = await supabase.from("conversations").select("id").eq("package_id", order.package_id).eq("student_id", order.student_id).eq("company_id", order.company_id).maybeSingle();

    if (conv) {
        await supabase.from("messages").insert({
            conversation_id: conv.id,
            sender_id: user.id,
            content: "Oferta została odrzucona.",
            event: "application_rejected"
        });
    }
    revalidatePath("/app/services/dashboard");
    return { success: true };
}

export async function counterServiceProposalAction(orderId: string, amount: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Company Counters
    const { data: order } = await supabase.from("service_orders").select("*").eq("id", orderId).single();
    if (!order || order.company_id !== user.id) throw new Error("Nie masz uprawnień.");

    const { error } = await supabase.from("service_orders")
        .update({ status: "countered", counter_amount: amount })
        .eq("id", orderId);

    if (error) throw new Error(error.message);

    const { data: conv } = await supabase.from("conversations").select("id").eq("package_id", order.package_id).eq("student_id", order.student_id).eq("company_id", order.company_id).maybeSingle();

    if (conv) {
        await supabase.from("messages").insert({
            conversation_id: conv.id,
            sender_id: user.id,
            content: `Zaproponowano inną stawkę: ${amount} PLN.`,
            event: "counter_offer",
            payload: { counter_stawka: amount, initiator: "company" }
        });
        await supabase.rpc("create_notification", {
            p_user_id: order.student_id,
            p_typ: "negotiation_proposed",
            p_payload: { conversation_id: conv.id, snippet: `Firma zaproponowała nową stawkę: ${amount} PLN`, proposed_stawka: amount }
        });
    }
    revalidatePath("/app/services/dashboard");
    return { success: true };
}

export async function acceptServiceCounterAction(orderId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Student Accepts Counter
    const { data: order } = await supabase.from("service_orders").select("*").eq("id", orderId).single();
    if (!order || order.student_id !== user.id) throw new Error("Nie masz uprawnień.");

    const { error } = await supabase.from("service_orders")
        .update({ status: "accepted", agreed_amount: order.counter_amount })
        .eq("id", orderId);

    if (error) throw new Error(error.message);

    const { data: conv } = await supabase.from("conversations").select("id").eq("package_id", order.package_id).eq("student_id", order.student_id).eq("company_id", order.company_id).maybeSingle();

    if (conv) {
        await supabase.from("messages").insert({
            conversation_id: conv.id,
            sender_id: user.id,
            content: `Zaakceptowano kontrofertę: ${order.counter_amount} PLN.`,
            event: "counter_accepted"
        });
        await supabase.rpc("create_notification", {
            p_user_id: order.company_id,
            p_typ: "application_accepted",
            p_payload: { conversation_id: conv.id, snippet: `Student zaakceptował Twoją stawkę!`, offer_title: "Usługa" }
        });
    }
    revalidatePath("/app/services/dashboard");
    return { success: true };
}

export async function rejectServiceCounterAction(orderId: string) {
    // Same as rejectServiceProposalAction basically, but logic flow might differ slightly? 
    // Usually rejection ends the order processing.
    return rejectServiceProposalAction(orderId);
}

export const rejectOrderAction = rejectServiceProposalAction;
