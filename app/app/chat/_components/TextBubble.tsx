
import { cn } from "@/lib/utils";

export function TextBubble({ content, isMine }: { content: string; isMine: boolean }) {
    return (
        <div
            className={cn(
                "max-w-[min(78vw,36rem)] whitespace-pre-wrap break-words rounded-2xl px-3 py-2.5 text-[15px] leading-relaxed shadow-sm sm:max-w-[85%] sm:px-4",
                isMine
                    ? "bg-[#10245f] text-white rounded-tr-sm"
                    : "bg-slate-50 text-slate-800 border border-slate-100/50 rounded-tl-sm"
            )}
        >
            {content}
        </div>
    );
}
