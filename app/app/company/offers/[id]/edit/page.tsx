import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import CustomizePackageForm from "@/app/app/company/packages/[id]/customize/customize-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  isSystemServicePackage,
  normalizePackageFormSchema,
  normalizePackageVariants,
  parsePackageBriefDescription,
  resolveSelectedPackageVariant,
} from "@/lib/services/package-customization";

export const dynamic = "force-dynamic";

export default async function EditOfferPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Fetch Offer
  const { data: offer } = await supabase
    .from("offers")
    .select(`
            *,
            service_packages (*)
        `)
    .eq("id", params.id)
    .single();

  if (!offer) notFound();
  if (offer.company_id !== user.id) redirect("/app/company/offers");

  // ✅ Security: Block editing if offer is not published (e.g. in_progress, closed)
  if (offer.status !== "published") {
    redirect(`/app/company/offers/${offer.id}`);
  }

  // Double check for accepted applications (source of truth for in_progress)
  const { data: acceptedApp } = await supabase
    .from("applications")
    .select("id")
    .eq("offer_id", offer.id)
    .eq("status", "accepted")
    .limit(1)
    .maybeSingle();

  if (acceptedApp) {
    redirect(`/app/company/offers/${offer.id}`);
  }


  // Helper to extract value from description
  const extract = (label: string): string => {
    const regex = new RegExp(`${label}: (.*)`);
    const match = offer.opis.match(regex);
    return match ? match[1].trim() : "";
  }

  const servicePackage = Array.isArray((offer as any).service_packages)
    ? (offer as any).service_packages[0]
    : (offer as any).service_packages;
  const parsedBrief = parsePackageBriefDescription(offer.opis);
  const isSystemPackage = isSystemServicePackage(servicePackage);
  const formSchema = isSystemPackage ? normalizePackageFormSchema(servicePackage?.form_schema) : [];
  const variants = normalizePackageVariants(servicePackage?.variants);
  const selectedVariant = resolveSelectedPackageVariant(variants, parsedBrief.variantName);

  // Parse existing description to populate form
  const initialData: Record<string, string> = {
    // General
    notes: "", // Notes are tricky to regex perfectly if multiline, but valid attempt:
    deadline: extract("📅 Preferowany termin").replace("undefined", ""),

    // Video
    videoGoal: extract("🎯 Cel wideo"),
    targetGroup: extract("👥 Grupa docelowa"),
    materialsLink: "", // Actually, we might have stored this in obligations too, or extracting from Desc
    inspiration: extract("💡 Inspiracje"),
    audioStyle: extract("🎵 Audio/Muzyka"),
    format: extract("📐 Format"),
    branding: extract("🖌️ Branding"),

    // Logo
    brandName: extract("🏷️ Nazwa Marki"),
    industry: extract("🏭 Branża"),
    style: extract("🎨 Styl"),
    colors: extract("🌈 Kolorystyka"),

    // Marketing
    campaignGoal: extract("🎯 Cel kampanii"),
    platforms: extract("📱 Platformy"),

    // Automation
    processDesc: extract("⚙️ Obecny proces"),
    expectedEffect: extract("✨ Oczekiwany efekt"),
  };

  formSchema.forEach((field) => {
    initialData[field.id] = parsedBrief.answersByLabel[field.label] || "";
  });

  if (parsedBrief.notes) {
    initialData.notes = parsedBrief.notes;
  }

  if (parsedBrief.deadline) {
    initialData.deadline = parsedBrief.deadline;
  }

  // Extracting multi-line notes or materials if possible
  // Materials Link extraction
  if (offer.opis.includes("📂 LINK DO MATERIAŁÓW:")) {
    const parts = offer.opis.split("📂 LINK DO MATERIAŁÓW:");
    if (parts[1]) {
      initialData.materialsLink = parts[1].split("\n")[1]?.trim() || "";
    }
  }

  // Notes extraction
  if (offer.opis.includes("📝 Dodatkowe uwagi:")) {
    const parts = offer.opis.split("📝 Dodatkowe uwagi:");
    if (parts[1]) {
      initialData.notes = parts[1].trim();
    }
  }


  const pkgTitle = offer.tytul; // Or offer.service_packages?.title if available
  const pkgCategory = offer.kategoria || "";

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link
        href={`/app/offers/${offer.id}`}
        className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Anuluj edycję
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Edytuj Zlecenie</h1>
        <p className="text-slate-600">
          Możesz zaktualizować szczegóły zlecenia poniżej.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
        <CustomizePackageForm
          packageId={offer.service_package_id || ""} // Not strictly needed for update, but type requires it
          packageTitle={pkgTitle}
          packageCategory={pkgCategory}
          initialData={initialData}
          offerId={offer.id}
          formSchema={formSchema}
          selectedVariant={selectedVariant}
        />
      </div>
    </div>
  );
}
