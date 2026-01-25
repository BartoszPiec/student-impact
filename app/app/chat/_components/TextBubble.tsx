
import { cn } from "@/lib/utils";

export function TextBubble({ content, isMine }: { content: string; isMine: boolean }) {
    return (
        <div
            className={cn(
                "px-4 py-2.5 rounded-2xl shadow-sm max-w-[85%] break-words whitespace-pre-wrap text-[15px] leading-relaxed",
                isMine
                    ? "bg-indigo-600 text-white rounded-tr-sm"
                    : "bg-slate-50 text-slate-800 border border-slate-100/50 rounded-tl-sm"
            )}
        >
            {content}
        </div>
    );
}
