"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart,
  Bot,
  CheckCircle2,
  Clipboard,
  Code,
  Database,
  Globe,
  Languages,
  Palette,
  PenTool,
  TrendingUp,
  Video,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ServiceDetails } from "./landing-interactive";

const SERVICE_ICONS: Record<string, LucideIcon> = {
  "Lead research": TrendingUp,
  "Prospecting i outreach": TrendingUp,
  "Prezentacje i materiały": Palette,
  "Data entry i CRM": Database,
  "Content i social media": PenTool,
  "Wsparcie operacyjne": Clipboard,
  "Strony i CMS": Globe,
  "Analiza i raporty": BarChart,
  "Wideo i multimedia": Video,
  "Programowanie i IT": Code,
  "Tłumaczenia": Languages,
  "Automatyzacje AI": Bot,
};

type LandingServiceDialogProps = {
  name: string;
  data: ServiceDetails;
  onClose: () => void;
};

export function LandingServiceDialog({ name, data, onClose }: LandingServiceDialogProps) {
  const Icon = SERVICE_ICONS[name] ?? Clipboard;

  return (
    <Dialog open onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-2xl overflow-hidden rounded-[2rem] border-none p-0">
        <div className="bg-[#0f2460] p-5 sm:p-8">
          <DialogHeader>
            <div className="flex items-start gap-3 sm:items-center sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white sm:h-14 sm:w-14">
                <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div>
                <DialogTitle className="text-xl font-extrabold text-white sm:text-2xl">{name}</DialogTitle>
                <DialogDescription className="sr-only">{data.description}</DialogDescription>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-white/60">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  <span>Proces z umową i kontrolą statusu</span>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-5 bg-white p-5 sm:space-y-6 sm:p-8">
          <p className="leading-relaxed text-slate-600">{data.description}</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Object.entries(data.stats).map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
                <div className="mb-1 text-sm font-extrabold text-[#0f2460]">{value}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{label}</div>
              </div>
            ))}
          </div>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {data.examples.map((example) => (
              <li key={example} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#5367d9]" />
                {example}
              </li>
            ))}
          </ul>
          <div className="rounded-xl border-l-4 border-[#5367d9] bg-[#5367d9]/5 p-5 text-sm text-slate-600">
            {data.funFact}
          </div>
          <Button asChild className="h-12 w-full rounded-full bg-[#0f2460] font-bold text-white hover:bg-[#1a3a8f]">
            <Link href="/auth?role=company">
              Znajdź eksperta <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
