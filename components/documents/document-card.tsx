import { FileBadge2, FileText, Receipt, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type UserFacingDocument,
  getContractStatusLabel,
  getDocumentTypeDescription,
  getDocumentTypeLabel,
} from "@/types/documents";

type DocumentCardProps = {
  document: UserFacingDocument;
  className?: string;
};

function getTone(type: UserFacingDocument["type"]) {
  if (type === "contract_a" || type === "contract_b") {
    return {
      icon: ShieldCheck,
      badge: "border border-indigo-200 bg-indigo-50 text-indigo-700",
      iconWrap: "border border-indigo-100 bg-indigo-50 text-indigo-600",
    };
  }

  return {
    icon: Receipt,
    badge: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    iconWrap: "border border-emerald-100 bg-emerald-50 text-emerald-600",
  };
}

export function DocumentCard({ document, className }: DocumentCardProps) {
  const tone = getTone(document.type);
  const Icon = tone.icon;

  return (
    <article
      className={cn(
        "rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-lg shadow-slate-200/30 sm:rounded-[2rem] sm:p-5",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3 sm:gap-4">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
              tone.iconWrap,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider",
                  tone.badge,
                )}
              >
                {getDocumentTypeLabel(document.type)}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                {getContractStatusLabel(document.contractStatus)}
              </span>
            </div>

            <div>
              <h3 className="line-clamp-2 break-words text-base font-black text-slate-900">{document.title}</h3>
              <p className="mt-1 break-words text-sm font-medium text-slate-400">
                {document.counterpartName}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex min-w-0 max-w-full items-center gap-1">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 truncate" title={document.fileName}>
                  {document.fileName}
                </span>
              </span>
              <span className="inline-flex min-w-0 max-w-full items-center gap-1">
                <FileBadge2 className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 break-words">
                  {getDocumentTypeDescription(document.type)}
                </span>
              </span>
              {document.createdAt ? (
                <span>
                  {new Date(document.createdAt).toLocaleDateString("pl-PL")}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {document.downloadUrl ? (
          <a
            href={document.downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs font-black uppercase tracking-wider text-slate-700 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 sm:w-auto sm:py-2"
          >
            Pobierz PDF
          </a>
        ) : (
          <span className="w-full shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs font-bold text-slate-500 sm:w-auto sm:py-2">
            Brak pliku
          </span>
        )}
      </div>
    </article>
  );
}
