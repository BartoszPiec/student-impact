
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

export function SystemEventRow({ content, type }: { content: string; type?: string }) {
    return (
        <div className="flex justify-center w-full my-4">
            <div className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium shadow-sm border",
                (type === 'rate.accepted' || type === 'deadline.accepted')
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : (type === 'rate.rejected' || type === 'deadline.rejected')
                        ? "bg-red-50 text-red-700 border-red-100"
                        : "bg-slate-50 text-slate-500 border-slate-100"
            )}>
                <Info className="w-3 h-3 opacity-70" />
                <span>{content}</span>
            </div>
        </div>
    );
}
