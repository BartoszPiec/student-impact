"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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
        throw new Error("Package not found");
    }

    const isPlatformService = pkg.type === 'platform_service';

    // Create Offer
    const { data: offer, error: offerError } = await supabase
        .from("offers")
        .insert({
            company_id: user.id,
            tytul: pkg.title,
            opis: pkg.description,
            stawka: pkg.price,
            czas: `${pkg.delivery_time_days} dni`,
            status: "published",
            typ: isPlatformService ? "projekt" : "zlecenie",
            is_platform_service: isPlatformService,
            service_package_id: pkg.id,
            technologies: [],
            contract_type: "b2b",
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
            title: "Montaż Rolek (TikTok, Reels, Shorts)",
            description: "Dynamiczny montaż krótkich form wideo. Dodanie napisów (captions), przejść, muzyki trendującej i efektów dźwiękowych.",
            price: 150.00,
            delivery_time_days: 2,
            type: 'platform_service'
        },
        {
            title: "Montaż Wideo na YouTube",
            description: "Profesjonalny montaż dłuższego materiału (do 15 min). Korekcja kolorów, audio, intro/outro, B-roll.",
            price: 400.00,
            delivery_time_days: 5,
            type: 'platform_service'
        },
        {
            title: "Przygotowanie Logo",
            description: "3 propozycje logo + księga znaku. Pliki wektorowe i rastrowe (PNG, SVG, AI).",
            price: 500.00,
            delivery_time_days: 7,
            type: 'platform_service'
        },
        {
            title: "Kampania Marketingowa",
            description: "Kompleksowa kampania w social media (FB + IG). Obejmuje 8 postów, 4 stories i moderację komentarzy przez miesiąc.",
            price: 1200.00,
            delivery_time_days: 30,
            type: 'platform_service'
        },
        {
            title: "Automatyzacja Skrzynki Pocztowej",
            description: "Wdrożenie autoresponderów i etykietowania w Gmail/Outlook. Oszczędź 5h tygodniowo na segregowaniu maili.",
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
        throw new Error("Package not found");
    }

    const isPlatformService = pkg.type === 'platform_service';

    // Construct Detailed Description based on Form Data
    let customDescription = pkg.description + "\n\n--- SZCZEGÓŁY ZAMÓWIENIA ---\n";

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
    if (brandName) customDescription += `\n🏷️ Nazwa Marki: ${brandName}`;
    if (industry) customDescription += `\n🏭 Branża: ${industry}`;
    if (videoGoal) customDescription += `\n🎯 Cel wideo: ${videoGoal}`;
    if (campaignGoal) customDescription += `\n🎯 Cel kampanii: ${campaignGoal}`;
    if (targetGroup) customDescription += `\n👥 Grupa docelowa: ${targetGroup}`;
    if (platforms) customDescription += `\n📱 Platformy: ${platforms}`;

    if (format) customDescription += `\n📐 Format: ${format}`;
    if (style) customDescription += `\n🎨 Styl: ${style}`;
    if (branding) customDescription += `\n🖌️ Branding: ${branding}`;
    if (colors) customDescription += `\n🌈 Kolorystyka: ${colors}`;

    if (audioStyle) customDescription += `\n🎵 Audio/Muzyka: ${audioStyle}`;
    if (inspiration) customDescription += `\n💡 Inspiracje: ${inspiration}`;

    if (processDesc) customDescription += `\n⚙️ Obecny proces: ${processDesc}`;
    if (expectedEffect) customDescription += `\n✨ Oczekiwany efekt: ${expectedEffect}`;

    if (materialsLink) customDescription += `\n\n📂 LINK DO MATERIAŁÓW:\n${materialsLink}`;

    if (deadline) customDescription += `\n\n📅 Preferowany termin: ${deadline}`;
    if (notes) customDescription += `\n\n📝 Dodatkowe uwagi:\n${notes}`;


    // Create Offer
    const { data: offer, error: offerError } = await supabase
        .from("offers")
        .insert({
            company_id: user.id,
            tytul: pkg.title,
            opis: customDescription, // Using customized description
            stawka: pkg.price,
            czas: `${pkg.delivery_time_days} dni`,
            status: "published",
            typ: isPlatformService ? "projekt" : "zlecenie",
            is_platform_service: isPlatformService,
            service_package_id: pkg.id,
            technologies: [],
            contract_type: "b2b",
            kategoria: pkg.category,
            wymagania: pkg.features || [],
            obligations: materialsLink // Store material link in obligations too for easy access
        })
        .select("id")
        .single();

    if (offerError) {
        console.error("Error creating customized offer:", offerError);
        throw new Error(offerError.message || "Unknown database error");
    }

    revalidatePath("/app/company/offers");
    redirect(`/app/offers/${offer.id}`);
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
        .select("opis, company_id")
        .eq("id", offerId)
        .single();

    if (fetchError || !offer) throw new Error("Offer not found");
    if (offer.company_id !== user.id) throw new Error("Unauthorized");

    // Extract Base Description
    const separator = "\n\n--- SZCZEGÓŁY ZAMÓWIENIA ---";
    const baseDescription = offer.opis ? offer.opis.split(separator)[0] : "";

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
    if (brandName) customDescription += `\n🏷️ Nazwa Marki: ${brandName}`;
    if (industry) customDescription += `\n🏭 Branża: ${industry}`;
    if (videoGoal) customDescription += `\n🎯 Cel wideo: ${videoGoal}`;
    if (campaignGoal) customDescription += `\n🎯 Cel kampanii: ${campaignGoal}`;
    if (targetGroup) customDescription += `\n👥 Grupa docelowa: ${targetGroup}`;
    if (platforms) customDescription += `\n📱 Platformy: ${platforms}`;

    if (format) customDescription += `\n📐 Format: ${format}`;
    if (style) customDescription += `\n🎨 Styl: ${style}`;
    if (branding) customDescription += `\n🖌️ Branding: ${branding}`;
    if (colors) customDescription += `\n🌈 Kolorystyka: ${colors}`;

    if (audioStyle) customDescription += `\n🎵 Audio/Muzyka: ${audioStyle}`;
    if (inspiration) customDescription += `\n💡 Inspiracje: ${inspiration}`;

    if (processDesc) customDescription += `\n⚙️ Obecny proces: ${processDesc}`;
    if (expectedEffect) customDescription += `\n✨ Oczekiwany efekt: ${expectedEffect}`;

    if (materialsLink) customDescription += `\n\n📂 LINK DO MATERIAŁÓW:\n${materialsLink}`;

    if (deadline) customDescription += `\n\n📅 Preferowany termin: ${deadline}`;
    if (notes) customDescription += `\n\n📝 Dodatkowe uwagi:\n${notes}`;


    // 3. Update Offer
    const { error: updateError } = await supabase
        .from("offers")
        .update({
            opis: customDescription,
            obligations: materialsLink || undefined // Update obligations link if provided
        })
        .eq("id", offerId);

    if (updateError) {
        throw new Error(updateError.message);
    }

    revalidatePath("/app/company/offers");
    revalidatePath(`/app/offers/${offerId}`);
    redirect(`/app/offers/${offerId}`);
}
