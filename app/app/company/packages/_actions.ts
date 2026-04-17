"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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
} from "@/lib/services/package-customization";
import { fetchAvailableLogoStudents, LOGO_PACKAGE_ID } from "@/lib/services/logo-student-selection";

export async function createOfferFromPackage(packageId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Fetch package details
    const { data: pkg, error: pkgError } = await supabase
        .from("service_packages")
        .select("*")
        .eq("id", packageId)
        .single();

    if (pkgError || !pkg) {
        throw new Error(pkgError?.message || "Package not found");
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
        console.error("Error creating offer from package:", offerError);
        // Throw the ACTUAL error message so the UI can show it
        throw new Error(offerError.message || offerError.details || "Unknown database error");
    }

    revalidatePath("/app/company/offers");
    redirect(`/app/offers/${offer.id}`);
}

export async function resetServices() {
    const supabase = await createClient();

    // 1. Delete old platform services (avoid deleting 'Piec' which is a user/student gig)
    await supabase.from("service_packages")
        .delete()
        .neq("type", "student_gig") // Safest bet if types were partially applied
        .not("title", "ilike", "%Piec%"); // Backup condition

    // 2. Insert fresh Platform Services
    const { error } = await supabase.from("service_packages").insert([
        {
            title: "Montaz Rolek (TikTok, Reels, Shorts)",
            description: "Dynamiczny montaz krotkich form wideo. Dodanie napisow (captions), przejsc, muzyki trendujacej i efektow dzwiekowych.",
            price: 150.00,
            delivery_time_days: 2,
            type: 'platform_service'
        },
        {
            title: "Montaz Wideo na YouTube",
            description: "Profesjonalny montaz dluzszego materialu (do 15 min). Korekcja kolorow, audio, intro/outro, B-roll.",
            price: 400.00,
            delivery_time_days: 5,
            type: 'platform_service'
        },
        {
            title: "Przygotowanie Logo",
            description: "3 propozycje logo + ksiega znaku. Pliki wektorowe i rastrowe (PNG, SVG, AI).",
            price: 500.00,
            delivery_time_days: 7,
            type: 'platform_service'
        },
        {
            title: "Kampania Marketingowa",
            description: "Kompleksowa kampania w social media (FB + IG). Obejmuje 8 postow, 4 stories i moderacje komentarzy przez miesiac.",
            price: 1200.00,
            delivery_time_days: 30,
            type: 'platform_service'
        },
        {
            title: "Automatyzacja Skrzynki Pocztowej",
            description: "Wdrozenie autoresponderow i etykietowania w Gmail/Outlook. Oszczedz 5h tygodniowo na segregowaniu maili.",
            price: 300.00,
            delivery_time_days: 3,
            type: 'platform_service'
        }
    ]);

    if (error) {
        console.error("Reset failed:", error);
        throw new Error(error.message);
    }

    revalidatePath("/app/company/packages");
}

export async function createCustomizedOffer(packageId: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Fetch package details
    const { data: pkg, error: pkgError } = await supabase
        .from("service_packages")
        .select("*")
        .eq("id", packageId)
        .single();

    if (pkgError || !pkg) {
        throw new Error(pkgError?.message || "Package not found");
    }

    const isPlatformService = pkg.type === 'platform_service';
    const isSystemPackage = isSystemServicePackage(pkg);
    const formSchema = normalizePackageFormSchema(pkg.form_schema);
    const variants = resolvePackageVariantsWithFallback(pkg.id, pkg.variants);
    const selectedVariant = resolveSelectedPackageVariant(
        variants,
        String(formData.get("variantName") ?? ""),
    );
    const useDynamicBrief = isSystemPackage && formSchema.length > 0;
    const formAnswers = useDynamicBrief
        ? extractRequestFormAnswers(Array.from(formData.entries()), formSchema)
        : [];
    const effectivePrice = selectedVariant?.price ?? pkg.price;
    const effectiveDeliveryDays = selectedVariant?.delivery_time_days ?? pkg.delivery_time_days;
    const effectiveCommissionRate = selectedVariant?.commission_rate ?? pkg.commission_rate ?? null;
    const baseTitle = pkg.id === LOGO_PACKAGE_ID ? "Projekt Logo" : pkg.title;
    const effectiveTitle = selectedVariant ? `${baseTitle} - ${selectedVariant.label}` : baseTitle;

    // Construct Detailed Description based on Form Data
    let customDescription = `${pkg.description}` + "\n\n" + PACKAGE_BRIEF_SEPARATOR + "\n";

    // General
    const notes = formData.get("notes") as string;
    const deadline = formData.get("deadline") as string;

    // Video
    const videoGoal = formData.get("videoGoal") as string;
    const targetGroup = formData.get("targetGroup") as string;
    const materialsLink = formData.get("materialsLink") as string;
    const inspiration = formData.get("inspiration") as string;
    const audioStyle = formData.get("audioStyle") as string;
    const format = formData.get("format") as string;
    const branding = formData.get("branding") as string;

    // Logo
    const brandName = formData.get("brandName") as string;
    const industry = formData.get("industry") as string;
    const style = formData.get("style") as string;
    const colors = formData.get("colors") as string;

    // Marketing
    const campaignGoal = formData.get("campaignGoal") as string;
    const platforms = formData.get("platforms") as string;

    // Automation
    const processDesc = formData.get("processDesc") as string;
    const expectedEffect = formData.get("expectedEffect") as string;


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
            const requestedSelectionMode = String(formData.get("studentSelectionMode") ?? "company_choice");
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
                packageId,
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
                    package_id: packageId,
                    status: "pending_selection",
                    amount: effectivePrice,
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

            if (logoOrderError?.message?.includes("service_orders_status_check")) {
                const fallback = await supabase
                    .from("service_orders")
                    .insert({
                        company_id: user.id,
                        student_id: null,
                        package_id: packageId,
                        status: "pending",
                        amount: effectivePrice,
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
                console.error("Error creating logo order:", logoOrderError);
                throw new Error(logoOrderError?.message || "Unknown database error");
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
                        if (lockError.message?.includes("does not exist")) {
                            break;
                        }
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
                const { data: conversation } = await supabase
                    .from("conversations")
                    .insert({
                        package_id: packageId,
                        student_id: effectiveStudentId,
                        company_id: user.id,
                        type: "inquiry",
                        status: "active",
                        service_order_id: logoOrder.id,
                    })
                    .select("id")
                    .maybeSingle();

                conversationId = conversation?.id || null;

                await supabase.from("notifications").insert({
                    user_id: effectiveStudentId,
                    typ: "application_new",
                    payload: {
                        snippet: `Otrzymales nowe zamowienie uslugi: ${effectiveTitle}`,
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
                        snippet: "Nie udalo sie automatycznie przypisac studenta. Mozesz wybrac wykonawce recznie z listy.",
                        service_order_id: logoOrder.id,
                    },
                });
            }

            revalidatePath("/app/company/orders");
            revalidatePath("/app/company/packages");
            revalidatePath("/app/services/dashboard");
            redirect(`/app/company/orders/${logoOrder.id}`);
        }

        const { data: offer, error: offerError } = await supabase
            .from("offers")
            .insert({
                company_id: user.id,
                tytul: effectiveTitle,
                opis: customDescription,
                stawka: effectivePrice,
                czas: `${effectiveDeliveryDays} dni`,
                status: "published",
                typ: "projekt",
                is_platform_service: true,
                service_package_id: pkg.id,
                commission_rate: resolveCommissionRate({
                    explicitRate: effectiveCommissionRate,
                    sourceType: "service_order",
                    isPlatformService: true,
                }),
                technologies: [],
                contract_type: "B2B",
                kategoria: pkg.category,
                wymagania: pkg.features || [],
            })
            .select("id")
            .single();

        if (offerError) {
            console.error("Error creating platform offer:", offerError);
            throw new Error(offerError.message || "Unknown database error");
        }

        revalidatePath("/app/company/offers");
        redirect(`/app/offers/${offer.id}`);
    }

    // --- Student gig flow (student_id istnieje) ---

    // 1. Create Service Order (visible to student in /app/services/dashboard)
    const { data: order, error: orderError } = await supabase
        .from("service_orders")
        .insert({
            company_id: user.id,
            student_id: pkg.student_id,
            package_id: packageId,
            status: "inquiry",
            amount: effectivePrice,
            requirements: customDescription,
            title: effectiveTitle,
        })
        .select("id")
        .single();

    if (orderError) {
        console.error("Error creating service order:", orderError);
        throw new Error(orderError.message || "Unknown database error");
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
        console.error("Error creating offer context:", offerError);
        throw new Error(offerError.message || "Unknown database error");
    }

    // 3. Create conversation with package_id so service actions can find it
    const { data: conversation } = await supabase
        .from("conversations")
        .insert({
            offer_id: offer.id,
            package_id: packageId,
            student_id: pkg.student_id,
            company_id: user.id,
            type: "inquiry",
        })
        .select("id")
        .single();

    // 4. Notify student about new inquiry
    await supabase.from("notifications").insert({
        user_id: pkg.student_id,
        typ: "application_new",
        payload: {
            snippet: `Otrzymales nowe zamowienie na usluge: ${effectiveTitle}`,
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
        throw new Error("Unauthorized");
    }

    // 1. Fetch existing offer to preserve the BASE description (before separator)
    const { data: offer, error: fetchError } = await supabase
        .from("offers")
        .select("opis, company_id, service_package_id")
        .eq("id", offerId)
        .single();

    if (fetchError || !offer) throw new Error("Offer not found");
    if (offer.company_id !== user.id) throw new Error("Unauthorized");

    const packageId = offer.service_package_id || null;
    const packageResponse = packageId
        ? await supabase
            .from("service_packages")
            .select("*")
            .eq("id", packageId)
            .maybeSingle()
        : null;
    const pkg = packageResponse?.data || null;

    if (packageResponse?.error) {
        throw new Error(packageResponse.error.message);
    }

    // Extract Base Description
    const separator = "\n\n" + PACKAGE_BRIEF_SEPARATOR;
    const baseDescription = splitPackageBriefDescription(offer.opis).baseDescription;

    const formSchema = normalizePackageFormSchema(pkg?.form_schema);
    const variants = resolvePackageVariantsWithFallback(packageId || "", pkg?.variants);
    const selectedVariant = resolveSelectedPackageVariant(
        variants,
        String(formData.get("variantName") ?? ""),
    );
    const isSystemPackage = isSystemServicePackage(pkg);
    const isPlatformService = isSystemPackage;
    const useDynamicBrief = Boolean(isSystemPackage && formSchema.length > 0);
    const formAnswers = useDynamicBrief
        ? extractRequestFormAnswers(Array.from(formData.entries()), formSchema)
        : [];
    const effectivePrice = selectedVariant?.price ?? pkg?.price ?? null;
    const effectiveDeliveryDays = selectedVariant?.delivery_time_days ?? pkg?.delivery_time_days ?? null;
    const effectiveCommissionRate = selectedVariant?.commission_rate ?? pkg?.commission_rate ?? null;

    // 2. Reconstruct Description
    let customDescription = baseDescription + separator + "\n";

    // General
    const notes = formData.get("notes") as string;
    const deadline = formData.get("deadline") as string;

    // Video
    const videoGoal = formData.get("videoGoal") as string;
    const targetGroup = formData.get("targetGroup") as string;
    const materialsLink = formData.get("materialsLink") as string;
    const inspiration = formData.get("inspiration") as string;
    const audioStyle = formData.get("audioStyle") as string;
    const format = formData.get("format") as string;
    const branding = formData.get("branding") as string;

    // Logo
    const brandName = formData.get("brandName") as string;
    const industry = formData.get("industry") as string;
    const style = formData.get("style") as string;
    const colors = formData.get("colors") as string;

    // Marketing
    const campaignGoal = formData.get("campaignGoal") as string;
    const platforms = formData.get("platforms") as string;

    // Automation
    const processDesc = formData.get("processDesc") as string;
    const expectedEffect = formData.get("expectedEffect") as string;

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
        .eq("id", offerId);

    if (updateError) {
        throw new Error(updateError.message);
    }

    revalidatePath("/app/company/offers");
    revalidatePath(`/app/offers/${offerId}`);
    redirect(`/app/offers/${offerId}`);
}



