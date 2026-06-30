"use client";

import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2, XCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PackageVariant } from "@/lib/services/package-customization";

type PricingVariant = PackageVariant;

interface InteractivePricingCardsProps {
  markdownContent: string;
  gradient: string;
  variants?: PricingVariant[];
}

type PricingCard = {
  name: string;
  label: string;
  price: string;
  features: Array<{ name: string; value: string }>;
  isRecommended: boolean;
};

function buildCardsFromMarkdown(markdownContent: string): PricingCard[] {
  const lines = markdownContent.split("\n");
  const tableLines: string[] = [];
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      tableLines.push(trimmed);
      inTable = true;
    } else if (inTable) {
      break;
    }
  }

  if (tableLines.length < 3) {
    return [];
  }

  const headers = tableLines[0]
    .split("|")
    .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
    .map((cell) => cell.trim());

  let dataStartIdx = 1;
  if (/^\|[\s\-:|]+\|$/.test(tableLines[1])) {
    dataStartIdx = 2;
  }

  const rows: string[][] = [];
  for (let rowIdx = dataStartIdx; rowIdx < tableLines.length; rowIdx++) {
    const cells = tableLines[rowIdx]
      .split("|")
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
      .map((cell) => cell.trim());
    rows.push(cells);
  }

  if (headers.length < 2) {
    return [];
  }

  const cards: PricingCard[] = [];

  for (let colIdx = 1; colIdx < headers.length; colIdx++) {
    const cleanHeader = headers[colIdx].replace(/\*\*/g, "").trim();
    const titleParts = cleanHeader.split(/\s+[—-]\s+/).map((part) => part.trim());
    const variantName = titleParts[0] || `Pakiet ${colIdx}`;
    const variantLabel = titleParts[1] || "";

    let price = "";
    const features: Array<{ name: string; value: string }> = [];

    for (const row of rows) {
      const rowLabel = (row[0] || "").replace(/\*\*/g, "");
      const rowValue = row[colIdx] || "";

      if (rowLabel.toLowerCase().includes("cena")) {
        price = rowValue.replace(/\*\*/g, "");
      } else {
        features.push({ name: rowLabel, value: rowValue });
      }
    }

    cards.push({
      name: variantName,
      label: variantLabel,
      price: price || "0 PLN",
      features,
      isRecommended: false,
    });
  }

  return cards;
}

function buildCardsFromVariants(variants: PricingVariant[]): PricingCard[] {
  return variants.map((variant) => {
    const includeFeatures = (variant.includes || []).map((item) => ({
      name: item,
      value: "Tak",
    }));

    const excludeFeatures = (variant.excludes || []).map((item) => ({
      name: item,
      value: "Brak",
    }));

    const details = [
      ...(variant.description ? [{ name: "Dla kogo", value: variant.description }] : []),
      ...includeFeatures,
      ...excludeFeatures,
    ];

    return {
      name: variant.name,
      label: variant.label,
      price: `${variant.price} PLN`,
      features: details.slice(0, 8),
      isRecommended: Boolean(variant.is_recommended),
    };
  });
}

export function InteractivePricingCards({ markdownContent, gradient, variants }: InteractivePricingCardsProps) {
  const cards = buildCardsFromMarkdown(markdownContent);
  const effectiveCards = cards.length > 0 ? cards : buildCardsFromVariants(variants || []);
  const cardCount = effectiveCards.length;

  if (effectiveCards.length === 0) {
    return null;
  }

  const handleSelect = (variantName: string) => {
    const event = new CustomEvent("selectVariant", { detail: variantName });
    window.dispatchEvent(event);
    window.scrollTo({ top: 100, behavior: "smooth" });
  };

  return (
    <div
      className={cn(
        "pt-4",
        cardCount >= 4
          ? "w-full overflow-x-auto"
          : "flex flex-wrap justify-center gap-6",
      )}
    >
      <div
        className={cn(
          cardCount >= 4
            ? "flex min-w-max justify-center gap-4 px-2"
            : "contents",
        )}
      >
        {effectiveCards.map((card, index) => {
          const isPopular = card.isRecommended || (effectiveCards.length === 3 && index === 1);

          return (
            <div
              key={`${card.name}-${index}`}
              className={cn(
                "relative w-full rounded-3xl border bg-white p-5 shadow-md shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl md:p-6",
                cardCount >= 4 ? "max-w-[260px]" : "max-w-[360px] lg:p-7 xl:p-8",
                isPopular ? "z-10 scale-[1.02] border-indigo-200 shadow-xl shadow-indigo-500/10" : "z-0 border-slate-200",
              )}
            >
              {isPopular ? <div className={`absolute inset-x-0 top-0 h-2 rounded-t-3xl bg-gradient-to-r ${gradient}`} /> : null}

              {isPopular ? (
                <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2">
                  <span
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-sm ring-4 ring-white",
                      `bg-gradient-to-r ${gradient}`,
                    )}
                  >
                    <Zap className="h-3 w-3 fill-current" />
                    Najlepszy wybor
                  </span>
                </div>
              ) : null}

              <div className={cn("mb-6 text-center", isPopular ? "mt-4" : "") }>
                <h3 className="mb-1 text-2xl font-black text-slate-900">{card.name}</h3>
                <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">{card.label}</p>

                <div className="mb-2 mt-6">
                  <span className={cn(
                    "font-extrabold text-slate-900",
                    cardCount >= 4 ? "text-3xl" : "text-4xl",
                  )}>
                    {card.price.replace("PLN", "").trim()}
                  </span>
                  {card.price.includes("PLN") ? <span className="ml-1 text-lg font-bold text-slate-400">PLN</span> : null}
                </div>
              </div>

              <Button
                onClick={() => handleSelect(card.name)}
                className={cn(
                  "mb-8 w-full rounded-xl py-6 text-base font-bold transition-all hover:scale-[1.02]",
                  isPopular
                    ? `bg-gradient-to-r ${gradient} text-white shadow-md shadow-indigo-500/25`
                    : "bg-slate-100 text-slate-800 hover:bg-slate-200",
                )}
              >
                Wybieram {card.name}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <div className="flex-1 space-y-4">
                {card.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <FeatureIcon value={feature.value} />
                    <div className="text-sm">
                      <span className="mb-0.5 block font-semibold text-slate-700">{feature.name}</span>
                      <span className="leading-snug text-slate-600">
                        <FormatInline text={feature.value} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FeatureIcon({ value }: { value: string }) {
  const normalizedValue = value.toLowerCase();
  if (value === "—" || value === "-" || normalizedValue.includes("brak") || /[✗✕]/.test(value)) {
    return <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />;
  }

  if (/[✔✅]/.test(value)) {
    return <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />;
  }

  return <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400" />;
}

function FormatInline({ text }: { text: string }) {
  const cleanText = text.replace(/\*\*/g, "").replace(/[✔✅✗✕]/g, "").trim();
  if (cleanText === "—" || cleanText === "-") return <span className="italic text-slate-400">Brak w tym pakiecie</span>;
  return <>{cleanText}</>;
}
