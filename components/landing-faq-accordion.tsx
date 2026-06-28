"use client";

import { useId, useState } from "react";
import { Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";

type LandingFaqItem = {
  question: string;
  answer: string;
};

type LandingFaqAccordionProps = {
  items: ReadonlyArray<LandingFaqItem>;
  defaultOpenIndex?: number;
};

export function LandingFaqAccordion({
  items,
  defaultOpenIndex = 0,
}: LandingFaqAccordionProps) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(
    items[defaultOpenIndex] ? defaultOpenIndex : null,
  );

  return (
    <div className="mt-10 space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `${baseId}-faq-panel-${index}`;
        const triggerId = `${baseId}-faq-trigger-${index}`;

        return (
          <div
            key={item.question}
            className={cn(
              "rounded-2xl border bg-white p-5 transition-[border-color,box-shadow] duration-300",
              isOpen
                ? "border-lime-300 shadow-sm"
                : "border-slate-200 shadow-none",
            )}
          >
            <button
              id={triggerId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex w-full cursor-pointer items-center justify-between gap-4 text-left font-black text-[#0f2460]"
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span>{item.question}</span>
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
                  isOpen ? "bg-[#c5fb37]" : "bg-slate-50",
                )}
              >
                {isOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </span>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="mt-5 text-sm font-semibold leading-7 text-slate-600">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
