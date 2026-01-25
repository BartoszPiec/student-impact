"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createOrder(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const packageId = formData.get("packageId") as string;
    const price = Number(formData.get("price"));
    const title = formData.get("title") as string;

    // Pola kontaktowe
    const contactEmail = formData.get("contact_email") as string;
    const companyWebsite = formData.get("company_website") as string;

    // Fetch package details EARLY to know the schema and student
    const { data: pkgData, error: pkgError } = await supabase
        .from("service_packages")
        .select("student_id, is_system, form_schema")
        .eq("id", packageId)
        .single();

    if (pkgError || !pkgData) throw new Error("Package not found");

    // Parsowanie odpowiedzi dynamicznych
    let requirementsText = "=== DANE KONTAKTOWE ===\n";
    requirementsText += `Email: ${contactEmail}\n`;
    if (companyWebsite) requirementsText += `WWW: ${companyWebsite}\n`;
    requirementsText += "\n=== SZCZEGÓŁY ZLECENIA ===\n";

    // Wyciągamy odpowiedzi na pytania (zaczynają się od q_)
    const entries = Array.from(formData.entries());
    const schema = Array.isArray(pkgData.form_schema) ? pkgData.form_schema : [];

    entries.forEach(([key, value]) => {
        if (key.startsWith("q_")) {
            const questionId = key.replace("q_", "");
            const questionDef = schema.find((f: any) => f.id === questionId);
            const label = questionDef ? questionDef.label : questionId.toUpperCase();

            requirementsText += `${label}: ${value}\n`;
        }
    });

    const additionalInfo = formData.get("requirements") as string;
    if (additionalInfo) {
        requirementsText += `\n=== DODATKOWE INFORMACJE ===\nDodał: ${additionalInfo}`;
    }

    const { data: order, error } = await supabase
        .from("service_orders")
        .insert({
            company_id: user.id,
            package_id: packageId,
            student_id: pkgData.is_system ? null : pkgData.student_id,
            amount: price,
            requirements: requirementsText, // Zapisujemy wszystko jako jeden tekst dla studenta
            status: "pending",
            title: title,
            contact_email: contactEmail,
            company_website: companyWebsite
        })
        .select("id")
        .single();

    if (error) throw new Error(error.message);

    // --- LOGIKA CZATU / ZAPYTANIA ---
    // Jeśli to nie jest usługa systemowa (student_id istnieje), tworzymy konwersację i przekierowujemy na czat
    if (pkgData.student_id && pkgData.is_system !== true) {
        // Sprawdź czy konwersacja już istnieje dla tego pakietu ORAZ czy jest związana z aktywnym zleceniem.
        // Jeśli poprzednie zlecenia są zakończone, chcemy otworzyć NOWY czat (nowy kontekst).

        // 1. Sprawdź czy jest aktywne zlecenie (inne niż to dopiero tworzone - chociaż to tworzone jest 'pending', ale tu sprawdzamy kontekst historyczny)
        // Właściwie, skoro createOrder tworzy zlecenie PO tytule, to w tym momencie mamy już `order` (stworzone wyżej).
        // Ale szukamy poprzednich. 

        // Uproszczenie: Sprawdzamy czy istnieje JAKIEKOLWIEK inne aktywne zlecenie dla tego pakietu.
        // Jeśli tak -> podpinamy się pod istniejącą rozmowę (kontynuacja).
        // Jeśli nie -> tworzymy nową rozmowę (czysta karta).

        const { data: activeOrder } = await supabase
            .from("service_orders")
            .select("id")
            .eq("company_id", user.id)
            .eq("student_id", pkgData.student_id)
            .eq("package_id", packageId)
            .in("status", ["pending", "negotiating", "in_progress", "accepted"])
            .neq("id", order.id) // Nie bierzemy pod uwagę tego co właśnie stworzyliśmy
            .limit(1)
            .maybeSingle();

        let conversationId = null;

        if (activeOrder) {
            const { data: existingStats } = await supabase
                .from("conversations")
                .select("id")
                .eq("company_id", user.id)
                .eq("student_id", pkgData.student_id)
                .eq("package_id", packageId)
                .limit(1)
                .maybeSingle();
            conversationId = existingStats?.id;
        }

        if (!conversationId) {
            const { data: newConv, error: convError } = await supabase
                .from("conversations")
                .insert({
                    company_id: user.id,
                    student_id: pkgData.student_id,
                    status: "active",
                    type: "inquiry",
                    package_id: packageId,
                    application_id: null // Na razie null, może kiedyś linkujemy service_order_id ?
                })
                .select("id")
                .single();

            if (newConv) conversationId = newConv.id;
        }

        if (conversationId) {
            // 1. Wyślij prostą wiadomość informacyjną od klienta
            await supabase.from("messages").insert({
                conversation_id: conversationId,
                sender_id: user.id,
                content: `Zapytano o wycenę usługi.`
            });

            // 2. Wyślij szczegóły zapytania jako wiadomość systemową
            await supabase.from("messages").insert({
                conversation_id: conversationId,
                sender_id: user.id,
                content: requirementsText,
                event: 'inquiry_details'
            });

            // Przekieruj do katalogu usług z komunikatem sukcesu
            revalidatePath("/app/chat");
            revalidatePath("/app/company/packages");
            redirect(`/app/company/packages?success=inquiry_sent`);
        }
    }

    // Fallback dla usług systemowych
    revalidatePath("/app/company/packages");
    redirect(`/app/company/packages`);
}

export async function startInquiry(packageId: string, message: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

    const { data: pkg } = await supabase.from("service_packages").select("student_id, title").eq("id", packageId).single();
    if (!pkg || !pkg.student_id) throw new Error("Cannot start inquiry for this package");

    // Check if conversation exists
    // Note: We need to check if a conversation already exists between these 2 users related to this topic context, 
    // but for now simple 1:1 check. 
    // Actually, 'conversations' table usually links company_id and student_id.

    // Simple fetch existing
    // Check if conversation exists for this SPECIFIC package to avoid duplicates
    const { data: existingStats } = await supabase
        .from("conversations")
        .select("id")
        .eq("company_id", user.id)
        .eq("student_id", pkg.student_id)
        .eq("package_id", packageId)
        .limit(1);

    let conversationId = existingStats?.[0]?.id;

    if (!conversationId) {
        const { data: newConv, error } = await supabase
            .from("conversations")
            .insert({
                company_id: user.id,
                student_id: pkg.student_id,
                status: "active",
                type: "inquiry",
                package_id: packageId // Link to package
            })
            .select("id")
            .single();

        if (error) throw new Error("Failed to create conversation");
        conversationId = newConv.id;
    }

    // Send the message
    await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: message || `Dzień dobry, chciałbym zapytać o szczegóły usługi: "${pkg.title}".`
    });

    revalidatePath("/app/chat");
    redirect(`/app/chat/${conversationId}`);
}
