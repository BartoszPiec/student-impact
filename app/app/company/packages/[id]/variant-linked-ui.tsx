"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2, Coins, Shield, ShieldCheck, Timer, XCircle } from "lucide-react";
import type { PackageVariant } from "@/lib/services/package-customization";

type VariantLinkedUiProps = {
  variants: PackageVariant[];
  baseDeliveryDays: number;
  gradient: string;
  packageId: string;
};

type FormatCardKey = "post" | "carousel" | "reel" | "story";

type FormatCardDefinition = {
  key: FormatCardKey;
  title: string;
  subtitle: string;
  purpose: string;
};

type FormatStatus = {
  available: boolean;
  note: string;
};

type PostTypeBreakdownItem = {
  key: string;
  label: string;
  count: number;
};

const FORMAT_CARD_DEFINITIONS: FormatCardDefinition[] = [
  {
    key: "post",
    title: "Post statyczny",
    subtitle: "Grafika + tekst",
    purpose: "Buduje regularna obecnosc i spojny wizerunek marki.",
  },
  {
    key: "carousel",
    title: "Karuzela",
    subtitle: "Seria slajdow",
    purpose: "Tlumaczy temat krok po kroku i zwieksza zaangazowanie.",
  },
  {
    key: "reel",
    title: "Rolka / Reel",
    subtitle: "Krotki format wideo",
    purpose: "Szybko buduje zasieg i dociera do nowych odbiorcow.",
  },
  {
    key: "story",
    title: "Stories",
    subtitle: "Relacje pionowe",
    purpose: "Utrzymuje codzienny kontakt i kieruje ruch do oferty.",
  },
];

function getDefaultVariant(variants: PackageVariant[]) {
  const recommended = variants.find((variant) => variant.is_recommended);
  if (recommended) return recommended;

  const standard = variants.find((variant) => variant.name.toLowerCase() === "standard");
  if (standard) return standard;

  return variants.length === 3 ? variants[1] : variants[0];
}

function getVariantNameFromEvent(detail: unknown): string | null {
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && typeof (detail as { name?: unknown }).name === "string") {
    return String((detail as { name: string }).name);
  }
  return null;
}

function getDeliveryLabel(selected: PackageVariant, baseDeliveryDays: number) {
  const deliveryDays = selected.delivery_time_days || baseDeliveryDays;
  if (baseDeliveryDays > 0 && deliveryDays > baseDeliveryDays) {
    return `${baseDeliveryDays}-${deliveryDays} dni`;
  }
  return `${deliveryDays} dni`;
}

function getVariantLead(variant: PackageVariant): string {
  const scope = (variant.scope || "").trim();
  if (!scope) {
    return "Zakres dopasowany do potrzeb tego poziomu współpracy.";
  }
  return scope;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getPostTypeLabel(rawKey: string): string {
  const key = normalizeText(rawKey);
  if (key.includes("eduk")) return "Edukacyjne";
  if (key.includes("ofert") || key.includes("sprzed")) return "Ofertowe";
  if (key.includes("angaz")) return "Angazujace";
  if (key.includes("wizer")) return "Wizerunkowe";
  return rawKey;
}

function getPostTypeSortIndex(rawKey: string): number {
  const key = normalizeText(rawKey);
  if (key.includes("eduk")) return 0;
  if (key.includes("ofert") || key.includes("sprzed")) return 1;
  if (key.includes("angaz")) return 2;
  if (key.includes("wizer")) return 3;
  return 99;
}

function getPostTypeBreakdown(variant: PackageVariant): PostTypeBreakdownItem[] {
  const entries = Object.entries(variant.post_types || {})
    .map(([key, value]) => ({ key, value: Number(value) }))
    .filter((entry) => Number.isFinite(entry.value) && entry.value > 0)
    .map((entry) => ({
      key: entry.key,
      label: getPostTypeLabel(entry.key),
      count: entry.value,
    }))
    .sort((a, b) => {
      const indexDiff = getPostTypeSortIndex(a.key) - getPostTypeSortIndex(b.key);
      if (indexDiff !== 0) return indexDiff;
      return a.label.localeCompare(b.label);
    });

  return entries;
}

function extractCount(text: string, keywordPattern: RegExp): number | null {
  const normalized = normalizeText(text);
  const countMatch = normalized.match(/(\d+)\s*(?:x\s*)?(.*)/);
  if (!countMatch) return null;
  const count = Number(countMatch[1]);
  if (!Number.isFinite(count)) return null;
  return keywordPattern.test(countMatch[2]) ? count : null;
}

function getPlatformSummaryLabel(platforms?: string[]): string {
  if (!platforms || platforms.length === 0) return "Wedlug zakresu";
  const normalized = platforms.map((platform) => normalizeText(platform));
  const hasAnySingle = normalized.some((platform) => platform.includes("facebook_or_instagram"));
  const hasFacebook = normalized.some((platform) => platform.includes("facebook"));
  const hasInstagram = normalized.some((platform) => platform.includes("instagram"));

  if (hasAnySingle) return "FB lub IG";
  if (hasFacebook && hasInstagram) return "FB + IG";
  if (hasFacebook) return "Facebook";
  if (hasInstagram) return "Instagram";

  return platforms.join(", ");
}

function getPostVolumeSummary(variant: PackageVariant): string {
  const postTypesCount = Object.values(variant.post_types || {}).reduce((sum, value) => sum + value, 0);
  const postCountFromList = (variant.includes || [])
    .map((item) => extractCount(item, /post|feed/))
    .find((value): value is number => typeof value === "number");
  const storyCount = variant.stories_count
    || (variant.includes || [])
      .map((item) => extractCount(item, /stor|relac/))
      .find((value): value is number => typeof value === "number")
    || 0;

  const feedCount = postCountFromList || postTypesCount;
  if (feedCount > 0 && storyCount > 0) return `${feedCount} postow + ${storyCount} stories`;
  if (feedCount > 0) return `${feedCount} postow`;
  if (storyCount > 0) return `${storyCount} stories`;
  return "Zakres z opisu";
}

function buildVariantFormatStatus(variant: PackageVariant): Record<FormatCardKey, FormatStatus> {
  const items = variant.includes || [];
  const normalizedItems = items.map((item) => normalizeText(item));
  const postTypeBreakdown = getPostTypeBreakdown(variant);
  const postTypeSummary = postTypeBreakdown.length > 0
    ? ` | Mix: ${postTypeBreakdown.map((item) => `${item.count}x ${item.label.toLowerCase()}`).join(", ")}`
    : "";

  const postTypesCount = Object.values(variant.post_types || {}).reduce((sum, value) => sum + value, 0);
  const postCountFromList = items
    .map((item) => extractCount(item, /post|feed/))
    .find((value): value is number => typeof value === "number");
  const storyCountFromList = items
    .map((item) => extractCount(item, /stor|relac/))
    .find((value): value is number => typeof value === "number");

  const hasPost = postTypesCount > 0 || normalizedItems.some((item) => item.includes("post") || item.includes("feed"));
  const hasCarousel = normalizedItems.some((item) => item.includes("karuzel") || item.includes("carousel") || item.includes("rotat"));
  const hasReel = normalizedItems.some((item) => item.includes("reel") || item.includes("rolk") || item.includes("shorts") || item.includes("tiktok") || item.includes("wideo"));
  const hasStory = Boolean(variant.includes_stories) || normalizedItems.some((item) => item.includes("stor") || item.includes("relac"));

  const platformLabel = variant.platforms && variant.platforms.length > 0
    ? getPlatformSummaryLabel(variant.platforms)
    : "Wedlug zakresu pakietu";

  return {
    post: {
      available: hasPost,
      note: hasPost
        ? `${postCountFromList || postTypesCount || "Kilka"} postow (kanaly: ${platformLabel})${postTypeSummary}`
        : "Brak zadeklarowanych postow w tym wariancie",
    },
    carousel: {
      available: hasCarousel,
      note: hasCarousel
        ? "Karuzele dostępne w ramach materiałów feed"
        : "Brak karuzeli w standardowym zakresie",
    },
    reel: {
      available: hasReel,
      note: hasReel
        ? "Rolka/wideo jest czescia tego pakietu"
        : "Rolka nie jest uwzgledniona w tym poziomie",
    },
    story: {
      available: hasStory,
      note: hasStory
        ? `${variant.stories_count || storyCountFromList || "Kilka"} stories w pakiecie`
        : "Stories niedostepne w tym wariancie",
    },
  };
}
function hasAnyFormatData(variants: PackageVariant[]): boolean {
  return variants.some((variant) => {
    if ((variant.includes || []).length > 0) return true;
    if ((variant.post_types && Object.keys(variant.post_types).length > 0)) return true;
    if ((variant.platforms && variant.platforms.length > 0)) return true;
    if (typeof variant.includes_stories === "boolean") return true;
    return false;
  });
}

function getEnabledFormatKeys(variants: PackageVariant[]): FormatCardKey[] {
  const enabled = new Set<FormatCardKey>();

  variants.forEach((variant) => {
    const status = buildVariantFormatStatus(variant);
    (Object.keys(status) as FormatCardKey[]).forEach((key) => {
      if (status[key].available) {
        enabled.add(key);
      }
    });
  });

  if (enabled.size === 0) {
    return ["post"];
  }

  return FORMAT_CARD_DEFINITIONS
    .map((definition) => definition.key)
    .filter((key) => enabled.has(key));
}

function useSyncedVariant(variants: PackageVariant[]) {
  const [selectedName, setSelectedName] = useState<string>(() => getDefaultVariant(variants)?.name || variants[0]?.name || "");
  const selected = useMemo(
    () => variants.find((variant) => variant.name === selectedName) || getDefaultVariant(variants),
    [selectedName, variants],
  );

  useEffect(() => {
    const handleVariantEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const name = getVariantNameFromEvent(customEvent.detail);
      if (!name) return;
      if (variants.some((variant) => variant.name === name)) {
        setSelectedName(name);
      }
    };

    window.addEventListener("selectVariant", handleVariantEvent);
    window.addEventListener("variantChanged", handleVariantEvent);
    return () => {
      window.removeEventListener("selectVariant", handleVariantEvent);
      window.removeEventListener("variantChanged", handleVariantEvent);
    };
  }, [variants]);

  const selectVariant = (name: string) => {
    setSelectedName(name);
    window.dispatchEvent(new CustomEvent("selectVariant", { detail: { name } }));
    window.dispatchEvent(new CustomEvent("variantChanged", { detail: { name } }));
  };

  return { selected, selectVariant };
}

export function VariantSyncedSnapshot({
  variants,
  baseDeliveryDays,
  gradient,
}: Omit<VariantLinkedUiProps, "packageId">) {
  const { selected } = useSyncedVariant(variants);
  if (!selected) return null;
  const deliveryLabel = getDeliveryLabel(selected, baseDeliveryDays);

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-[0_35px_90px_-45px_rgba(71,85,105,0.35)]">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`} />
      <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-indigo-100/70 blur-2xl" />
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Snapshot pakietu</p>
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
          Depozyt aktywny
        </span>
      </div>
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Cena {selected.label.toLowerCase()}</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{selected.price} PLN</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Realizacja</p>
            <p className="mt-1 text-base font-bold text-slate-800">{deliveryLabel}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Platnosc</p>
            <p className="mt-1 text-base font-bold text-slate-800">Po akceptacji</p>
          </div>
        </div>
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Zakres współpracy</p>
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div className={`h-2 rounded-full bg-gradient-to-r ${gradient} w-4/5`} />
          </div>
          <p className="text-sm text-slate-600">{selected.scope || "Brief, realizacja, poprawki, finalne pliki."}</p>
        </div>
      </div>
    </div>
  );
}

export function VariantSyncedFactsStrip({
  variants,
  baseDeliveryDays,
  gradient,
}: Omit<VariantLinkedUiProps, "packageId">) {
  const { selected } = useSyncedVariant(variants);
  if (!selected) return null;
  const deliveryLabel = getDeliveryLabel(selected, baseDeliveryDays);

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_25px_60px_-40px_rgba(71,85,105,0.35)]">
      <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 md:grid-cols-4 md:divide-y-0">
        <div className="p-5 md:p-6">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <Coins className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Cena</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{selected.price} PLN</p>
          <p className={`mt-1 text-[11px] font-bold uppercase tracking-[0.16em] bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>{selected.label}</p>
        </div>
        <div className="p-5 md:p-6">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <Timer className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Realizacja</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{deliveryLabel}</p>
        </div>
        <div className="p-5 md:p-6">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <Shield className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Platnosc</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">Depozyt</p>
        </div>
        <div className="p-5 md:p-6">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Gwarancja</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">Satysfakcji</p>
        </div>
      </div>
    </div>
  );
}

export function VariantPackageCards({
  variants,
  baseDeliveryDays,
  gradient,
  packageId,
}: VariantLinkedUiProps) {
  const { selected, selectVariant } = useSyncedVariant(variants);
  if (!selected) return null;

  const gridClass =
    variants.length >= 4
      ? "grid gap-5 md:grid-cols-2 xl:grid-cols-4"
      : variants.length === 3
        ? "grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        : "grid gap-5 md:grid-cols-2";

  return (
    <div className={gridClass}>
      {variants.map((variant) => {
        const active = variant.name === selected.name;
        const deliveryLabel = getDeliveryLabel(variant, baseDeliveryDays);
        const includes = (variant.includes || []).slice(0, 10);
        const excludes = (variant.excludes || []).slice(0, 3);
        const variantLead = getVariantLead(variant);
        const postTypeBreakdown = getPostTypeBreakdown(variant);
        const postVolumeSummary = getPostVolumeSummary(variant);
        const platformSummary = getPlatformSummaryLabel(variant.platforms);

        return (
          <div
            key={variant.name}
            onClick={() => selectVariant(variant.name)}
            className={cn(
              "relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.75rem] border bg-white p-6 pt-7 transition-all duration-300",
              active
                ? "border-indigo-300 shadow-[0_26px_60px_-38px_rgba(79,70,229,0.45)]"
                : "border-slate-200 shadow-[0_20px_48px_-40px_rgba(15,23,42,0.35)] hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_28px_60px_-38px_rgba(79,70,229,0.35)]",
            )}
          >
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${gradient}`} />

            <div className="mb-6">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{variant.label}</p>
                  <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{variant.price} PLN</h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">{deliveryLabel}</p>
                </div>
                {variant.is_recommended ? (
                  <span className={`rounded-full bg-gradient-to-r ${gradient} px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white`}>
                    Polecany
                  </span>
                ) : null}
              </div>
              <p className="text-sm leading-relaxed text-slate-600">{variantLead}</p>
            </div>

            <div className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600 underline decoration-indigo-300 decoration-2 underline-offset-4">
                Najwazniejsze w pakiecie
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl border border-white bg-white/90 p-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Posty</p>
                  <p className="mt-1 font-extrabold text-slate-900">{postVolumeSummary}</p>
                </div>
                <div className="rounded-xl border border-white bg-white/90 p-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Kanaly</p>
                  <p className="mt-1 font-extrabold text-slate-900">{platformSummary}</p>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <Button asChild className={`h-11 w-full rounded-full bg-gradient-to-r ${gradient} text-base font-semibold text-white hover:text-white`}>
                <Link
                  href={{
                    pathname: `/app/company/packages/${packageId}/customize`,
                    query: { variant: variant.name },
                  }}
                  onClick={(event) => event.stopPropagation()}
                  className="font-semibold text-white hover:text-white"
                >
                  Zamawiam {variant.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mb-3 border-t border-slate-200 pt-5">
              <p className="mb-3 text-sm font-semibold text-slate-700">
                <span className="font-black text-slate-900 underline decoration-indigo-300 decoration-2 underline-offset-4">{variant.label}</span> zawiera:
              </p>
            </div>

            <div className="space-y-2.5">
              {includes.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {postTypeBreakdown.length > 0 ? (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 underline decoration-indigo-200 decoration-2 underline-offset-4">Mix typow postow</p>
                <div className="space-y-2">
                  {postTypeBreakdown.map((item) => (
                    <div key={item.key} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                      <span><strong className="font-extrabold text-slate-900">{item.count}x</strong> {item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {excludes.length > 0 ? (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Poza zakresem</p>
                <div className="space-y-2">
                  {excludes.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-slate-500">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function VariantContentFormatsSection({
  variants,
  gradient,
}: Pick<VariantLinkedUiProps, "variants" | "gradient">) {
  const { selected } = useSyncedVariant(variants);
  const enabledFormatKeys = useMemo(() => getEnabledFormatKeys(variants), [variants]);
  if (!selected) return null;
  if (!hasAnyFormatData(variants)) return null;

  const statusMap = buildVariantFormatStatus(selected);
  const visibleDefinitions = FORMAT_CARD_DEFINITIONS.filter((definition) =>
    enabledFormatKeys.includes(definition.key),
  );

  const gridClass =
    visibleDefinitions.length >= 4
      ? "grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      : visibleDefinitions.length === 3
        ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        : visibleDefinitions.length === 2
          ? "grid gap-4 md:grid-cols-2"
          : "grid gap-4";

  return (
    <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.35)] sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Jakie formaty tresci otrzymasz</h2>
        <p className="mt-1 text-slate-500">
          Status kart automatycznie dopasowuje sie do aktualnie wybranego pakietu.
        </p>
      </div>

      <div className={gridClass}>
        {visibleDefinitions.map((formatDef) => {
          const formatStatus = statusMap[formatDef.key];
          return (
            <article
              key={formatDef.key}
              className={cn(
                "rounded-[1.25rem] border p-4 transition-all",
                formatStatus.available
                  ? "border-indigo-200 bg-indigo-50/40"
                  : "border-slate-200 bg-slate-50/70",
              )}
            >
              <div className="mb-4">
                <div
                  className={cn(
                    "relative h-28 w-full overflow-hidden rounded-xl border",
                    formatStatus.available ? "border-indigo-200 bg-white" : "border-slate-200 bg-white",
                  )}
                >
                  <div className="absolute left-3 top-3 h-2 w-16 rounded-full bg-slate-200" />
                  <div className="absolute right-3 top-3 h-2 w-10 rounded-full bg-slate-200" />
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`} />
                  <div className="absolute left-3 right-3 top-10 h-3 rounded-full bg-slate-100" />
                  <div className="absolute left-3 right-8 top-16 h-2 rounded-full bg-slate-100" />
                  <div className="absolute bottom-3 left-3 h-2 w-24 rounded-full bg-slate-200" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900">{formatDef.title}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">{formatDef.subtitle}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{formatDef.purpose}</p>

              <div className="mt-4 border-t border-slate-200 pt-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em]",
                    formatStatus.available
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-600",
                  )}
                >
                  {formatStatus.available ? "W pakiecie" : "Niedostepne"}
                </span>
                <p className="mt-2 text-xs leading-5 text-slate-500">{formatStatus.note}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
