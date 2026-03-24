import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // 1. Fetch all active offers
  const { data: offers } = await supabase
    .from("offers")
    .select("id, updated_at")
    .order("updated_at", { ascending: false });

  const offerUrls = (offers || []).map((offer) => ({
    url: `https://student2work.pl/app/offers/${offer.id}`,
    lastModified: new Date(offer.updated_at),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // 2. Static Pages
  const staticUrls = [
    {
      url: "https://student2work.pl",
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
    {
      url: "https://student2work.pl/regulamin",
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    {
      url: "https://student2work.pl/polityka-prywatnosci",
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
  ];

  return [...staticUrls, ...offerUrls];
}
