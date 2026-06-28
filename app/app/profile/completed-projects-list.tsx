"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Calendar, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type CompletedProject = {
  id: string;
  title: string;
  summary: string | null;
  link: string | null;
  created_at: string;
  offer_id: string | null;
  isVerified?: boolean;
};

const INITIAL_VISIBLE_PROJECTS = 4;
const PROJECTS_STEP = 4;

function formatDate(ts?: string | null) {
  if (!ts) return "";
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" }).format(new Date(ts));
}

export function CompletedProjectsList({ projects }: { projects: CompletedProject[] }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_PROJECTS);
  const visibleProjects = projects.slice(0, visibleCount);
  const hasHiddenProjects = visibleCount < projects.length;
  const canCollapse = visibleCount > INITIAL_VISIBLE_PROJECTS;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Portfolio realizacji</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Pokazano <span className="font-black text-slate-900">{visibleProjects.length}</span> z{" "}
            <span className="font-black text-slate-900">{projects.length}</span> projektów.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasHiddenProjects ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setVisibleCount((count) => Math.min(projects.length, count + PROJECTS_STEP))}
              className="h-10 rounded-full border-slate-200 px-4 text-xs font-black text-[#10245f] hover:border-lime-200 hover:bg-lime-50"
            >
              <ChevronDown className="mr-2 h-4 w-4" />
              Pokaż kolejne
            </Button>
          ) : null}
          {canCollapse ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setVisibleCount(INITIAL_VISIBLE_PROJECTS)}
              className="h-10 rounded-full px-4 text-xs font-black text-slate-500 hover:bg-slate-100"
            >
              <ChevronUp className="mr-2 h-4 w-4" />
              Zwiń
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {visibleProjects.map((project) => (
          <div
            key={project.id}
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 transition-all duration-300 hover:border-indigo-100 hover:shadow-xl hover:shadow-slate-200/50"
          >
            {project.isVerified && (
              <div className="absolute right-0 top-0 p-4 opacity-50">
                <CheckCircle2 className="h-12 w-12 text-emerald-100 transition-colors group-hover:text-emerald-200" />
              </div>
            )}

            <div className="relative z-10">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="line-clamp-2 text-base font-black leading-tight text-slate-800 transition-colors group-hover:text-indigo-700">
                    {project.title}
                  </h3>
                  {project.isVerified && (
                    <Badge variant="outline" className="border-emerald-100 bg-emerald-50 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      Zweryfikowane przez Student2Work
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mb-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(project.created_at)}
              </div>

              <div className="min-h-[3rem]">
                {project.summary ? (
                  <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">{project.summary}</p>
                ) : (
                  <span className="text-sm italic text-slate-400">Brak dodatkowego opisu.</span>
                )}
              </div>
            </div>

            <div className="relative z-10 mt-6 flex items-center justify-between gap-3 border-t border-slate-50 pt-4">
              {project.link ? (
                <a href={project.link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 transition-colors hover:text-indigo-800">
                  Otwórz projekt <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              ) : <span />}

              {project.offer_id && (
                <Link href={`/app/offers/${project.offer_id}`}>
                  <Button variant="ghost" size="sm" className="h-8 rounded-lg bg-slate-50 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                    Oferta
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
