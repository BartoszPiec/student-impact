"use client";

import { Building2, Scale, TrendingDown, Trophy } from "lucide-react";
import { MarkdownLite } from "@/components/markdown-lite";

interface MarketComparisonCardsProps {
  markdownContent: string;
  gradient: string;
  studentPriceLabel?: string;
}

type MarketOption = {
  provider: string;
  deliverables: string;
  price: string;
};

function cleanText(value: string) {
  return value.replace(/\*\*/g, "").trim();
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function MarketComparisonCards({ markdownContent, gradient, studentPriceLabel }: MarketComparisonCardsProps) {
  const lines = markdownContent.split("\n");
  const tableLines: string[] = [];
  const paragraphsBeforeTable: string[] = [];
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      tableLines.push(trimmed);
      inTable = true;
    } else if (inTable) {
      if (trimmed !== "") break;
    } else if (trimmed) {
      paragraphsBeforeTable.push(trimmed);
    }
  }

  if (tableLines.length < 3) {
    return <MarkdownLite content={markdownContent} />;
  }

  const headers = tableLines[0]
    .split("|")
    .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
    .map((cell) => cleanText(cell));

  let dataStartIdx = 1;
  if (/^\|[\s\-:|]+\|$/.test(tableLines[1])) {
    dataStartIdx = 2;
  }

  const marketOptions: MarketOption[] = [];
  let studentOption: MarketOption | null = null;

  for (let rowIdx = dataStartIdx; rowIdx < tableLines.length; rowIdx++) {
    const cells = tableLines[rowIdx]
      .split("|")
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
      .map((cell) => cell.trim());

    if (cells.length === 0) continue;

    const rowText = normalizeText(cells.join(" "));
    const isOurs =
      rowText.includes("student2work")
      || rowText.includes("twoj")
      || rowText.includes("twoj optymalny")
      || rowText.includes("twoj wybor");

    const option: MarketOption = {
      provider: cleanText(cells[0] || ""),
      deliverables: cleanText(cells[1] || ""),
      price: cleanText(cells[2] || ""),
    };

    if (isOurs) {
      studentOption = option;
    } else {
      marketOptions.push(option);
    }
  }

  if (!studentOption && marketOptions.length > 0) {
    studentOption = marketOptions.pop() || null;
  }

  if (!studentOption || marketOptions.length === 0) {
    return <MarkdownLite content={markdownContent} />;
  }

  const effectiveStudentPrice = studentPriceLabel?.trim() || studentOption.price;

  return (
    <div className="mt-4">
      {paragraphsBeforeTable.length > 0 ? (
        <div className="mb-10 prose-lg text-slate-600">
          <MarkdownLite content={paragraphsBeforeTable.join("\n")} />
        </div>
      ) : null}

      <div className="relative mt-8">
        <h3 className="mb-6 flex items-center gap-3 text-xl font-bold text-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/50 bg-slate-100">
            <Building2 className="h-5 w-5 text-slate-500" />
          </div>
          Dostepne na rynku opcje
        </h3>

        <div className="mb-12 grid grid-cols-1 gap-5 md:grid-cols-2">
          {marketOptions.map((option, index) => (
            <div
              key={`${option.provider}-${index}`}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/50 p-6 transition-all duration-500 hover:border-slate-300 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50"
            >
              <div className="pointer-events-none absolute -right-6 -top-6 p-4 opacity-[0.03] transition-opacity duration-500 group-hover:scale-110 group-hover:opacity-10">
                <Scale className="h-40 w-40 text-slate-900" />
              </div>

              <div className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">{headers[0]}</div>
              <div className="mb-6 text-xl font-bold text-slate-800">{option.provider}</div>

              <div className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">{headers[1]}</div>
              <div className="mb-6 line-clamp-3 text-sm leading-relaxed text-slate-600">{option.deliverables}</div>

              <div className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">{headers[2]}</div>
              <div className="text-2xl font-black text-slate-700">{option.price}</div>
            </div>
          ))}
        </div>

        <div className="relative mb-6 pt-6">
          <div className="absolute left-1/2 -top-2 h-8 w-[2px] -ml-[1px] bg-gradient-to-b from-transparent to-slate-200" />
          <div className="absolute left-1/2 -top-2 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400 shadow-sm">
            VS
          </div>

          <div className="group relative mt-4 overflow-hidden rounded-[2.5rem] border border-indigo-100 bg-white shadow-2xl shadow-indigo-500/10 transition-transform duration-700 hover:-translate-y-2">
            <div className={`absolute inset-x-0 top-0 h-3 bg-gradient-to-r ${gradient}`} />
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.02] transition-opacity duration-700 group-hover:opacity-[0.04]`} />

            <div className="p-8 md:p-12">
              <div className="relative z-10 flex flex-col justify-between gap-10 xl:flex-row xl:items-center">
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-4">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg shadow-indigo-500/30`}>
                      <Trophy className="h-7 w-7" />
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-indigo-500">Twoj optymalny wybor</div>
                      <div className="text-3xl font-black leading-none tracking-tight text-slate-900 md:text-5xl">
                        {studentOption.provider}
                      </div>
                    </div>
                  </div>

                  <div className="mt-10">
                    <div className="mb-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">{headers[1]}</div>
                    <p className="rounded-2xl border border-slate-100 bg-white/80 p-6 text-lg font-medium leading-relaxed text-slate-700 shadow-sm backdrop-blur">
                      {studentOption.deliverables}
                    </p>
                  </div>
                </div>

                <div className="relative w-full shrink-0 overflow-hidden rounded-[2rem] bg-slate-900 p-8 text-white shadow-2xl transition-transform duration-500 group-hover:scale-[1.02] xl:w-[350px]">
                  <div className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${gradient} opacity-40 blur-3xl transition-all duration-700 group-hover:scale-110 group-hover:opacity-60`} />

                  <div className="relative z-10 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-80">
                    {headers[2]}
                  </div>
                  <div className="relative z-10 mb-2 text-4xl font-black leading-none text-white md:text-5xl">
                    {effectiveStudentPrice}
                  </div>

                  <div className="relative z-10 mt-6 flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-400 backdrop-blur-sm">
                    <TrendingDown className="h-4 w-4" />
                    Zoptymalizowany budzet
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
