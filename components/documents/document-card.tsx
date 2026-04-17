import { FileBadge2, FileText, Receipt, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type UserFacingDocument,
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

function getStatusLabel(status: string) {
  if (status === "active") return "Aktywna";
  if (status === "completed") return "Zakonczona";
  if (status === "cancelled") return "Anulowana";
  if (status === "disputed") return "Sporna";
  if (status === "awaiting_funding") return "Czeka na finansowanie";
  if (status === "draft") return "Ustalanie kontraktu";
  return status;
}

export function DocumentCard({ document, className }: DocumentCardProps) {
  const tone = getTone(document.type);
  const Icon = tone.icon;

  return (
    <article
      className={cn(
        "rounded-[2rem] border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/30",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
              tone.iconWrap,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0 space-y-2">
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
                {getStatusLabel(document.contractStatus)}
              </span>
            </div>

            <div>
              <h3 className="line-clamp-1 text-base font-black text-slate-900">{document.title}</h3>
              <p className="mt-1 text-sm font-medium text-slate-400">
                {document.counterpartName}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {document.fileName}
              </span>
              <span className="inline-flex items-center gap-1">
                <FileBadge2 className="h-3.5 w-3.5" />
                {getDocumentTypeDescription(document.type)}
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
            className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-700 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
          >
            Pobierz PDF
          </a>
        ) : (
          <span className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500">
            Brak pliku
          </span>
        )}
      </div>
    </article>
  );
}
