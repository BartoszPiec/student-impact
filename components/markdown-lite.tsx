import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronRight, FileText, X, Lightbulb, AlertCircle } from "lucide-react";

interface MarkdownLiteProps {
    content: string;
    className?: string;
    listIcon?: "check" | "x" | "arrow" | "dot";
}

export function MarkdownLite({ content, className, listIcon = "dot" }: MarkdownLiteProps) {
    if (!content) return null;
    const blocks = parseBlocks(content);
    return (
        <div className={cn("space-y-6", className)}>
            {blocks.map((block, i) => renderBlock(block, i, listIcon))}
        </div>
    );
}

// ── Block types ──────────────────────────────────────────────

type Block =
    | { type: "h3"; text: string }
    | { type: "h4"; text: string }
    | { type: "list"; items: string[] }
    | { type: "table"; headers: string[]; rows: string[][] }
    | { type: "paragraph"; text: string };

// ── Parser ───────────────────────────────────────────────────

function parseBlocks(content: string): Block[] {
    const lines = content.split("\n");
    const blocks: Block[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip empty lines
        if (!trimmed) { i++; continue; }

        // H4 header (####)
        if (trimmed.startsWith("#### ")) {
            blocks.push({ type: "h4", text: trimmed.replace(/^####\s*/, "") });
            i++; continue;
        }

        // H3 header (###)
        if (trimmed.startsWith("### ")) {
            blocks.push({ type: "h3", text: trimmed.replace(/^###\s*/, "") });
            i++; continue;
        }

        // Table detection (| ... |)
        if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
            const tableLines: string[] = [];
            while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
                tableLines.push(lines[i].trim());
                i++;
            }
            if (tableLines.length >= 2) {
                const parsed = parseTable(tableLines);
                if (parsed) { blocks.push(parsed); continue; }
            }
            for (const tl of tableLines) {
                blocks.push({ type: "paragraph", text: tl });
            }
            continue;
        }

        // List detection (* item or - item)
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
            const items: string[] = [];
            while (i < lines.length && (lines[i].trim().startsWith("* ") || lines[i].trim().startsWith("- "))) {
                items.push(lines[i].trim().replace(/^[*\-]\s*/, ""));
                i++;
            }
            blocks.push({ type: "list", items });
            continue;
        }

        // Regular paragraph — collect consecutive non-special lines
        const paragraphLines: string[] = [];
        while (
            i < lines.length &&
            lines[i].trim() !== "" &&
            !lines[i].trim().startsWith("### ") &&
            !lines[i].trim().startsWith("#### ") &&
            !lines[i].trim().startsWith("* ") &&
            !lines[i].trim().startsWith("- ") &&
            !(lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|"))
        ) {
            paragraphLines.push(lines[i].trim());
            i++;
        }
        if (paragraphLines.length > 0) {
            blocks.push({ type: "paragraph", text: paragraphLines.join("\n") });
        }
    }

    return blocks;
}

function parseTable(lines: string[]): Block | null {
    const headerLine = lines[0];
    const headers = headerLine
        .split("|")
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        .map(cell => cell.trim());

    // Check if second line is separator (| --- | --- |)
    let dataStartIdx = 1;
    if (lines.length > 1 && /^\|[\s\-:|]+\|$/.test(lines[1])) {
        dataStartIdx = 2;
    }

    const rows: string[][] = [];
    for (let r = dataStartIdx; r < lines.length; r++) {
        const cells = lines[r]
            .split("|")
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
            .map(cell => cell.trim());
        rows.push(cells);
    }

    if (headers.length === 0) return null;
    return { type: "table", headers, rows };
}

// ── Renderers ────────────────────────────────────────────────

function renderBlock(block: Block, key: number, listIcon: string) {
    switch (block.type) {
        case "h3":
            return (
                <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-5 mt-20 mb-10 first:mt-0 group animate-in slide-in-from-bottom-2 fade-in duration-500">
                    <div className="w-14 h-14 bg-indigo-50/80 rounded-2xl flex items-center justify-center flex-shrink-0 border border-indigo-100/50 group-hover:bg-gradient-to-br group-hover:from-[#667eea] group-hover:to-[#764ba2] group-hover:shadow-[0_8px_25px_rgba(102,126,234,0.35)] transition-all duration-500">
                        <FileText className="w-6 h-6 text-indigo-400 group-hover:text-white transition-colors duration-500" />
                    </div>
                    <div className="pt-1.5 flex-1 border-b-[3px] border-slate-200/60 pb-3 relative">
                        {/* Animated underline */}
                        <div className="absolute bottom-[-3px] left-0 w-0 h-[3px] bg-gradient-to-r from-[#667eea] to-[#764ba2] group-hover:w-full transition-all duration-700 rounded-full"></div>
                        <h3 className="text-2xl sm:text-[27px] font-black text-[#0a0f1c] leading-tight tracking-tight">
                            <FormatText text={block.text} />
                        </h3>
                    </div>
                </div>
            );

        case "h4":
            return (
                <h4 key={key} className="text-lg font-bold text-[#0a0f1c] mt-8 mb-4 flex items-center gap-3 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-75">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] shrink-0 shadow-sm" />
                    <FormatText text={block.text} />
                </h4>
            );

        case "list":
            return (
                <ul key={key} className="space-y-4 my-6">
                    {block.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:border-indigo-100 hover:shadow-[0_4px_20px_rgba(102,126,234,0.08)] transition-all animate-in slide-in-from-bottom-2 fade-in duration-500" style={{ animationDelay: `${(j + 2) * 50}ms` }}>
                            <div className="mt-0.5">
                                <ListIcon type={listIcon} />
                            </div>
                            <span className="text-[16px] text-slate-700 leading-relaxed flex-1 font-medium">
                                <FormatText text={item} />
                            </span>
                        </li>
                    ))}
                </ul>
            );

        case "table":
            return <MarkdownTable key={key} headers={block.headers} rows={block.rows} />;

        case "paragraph": {
            // User requested to remove this specific text at the bottom.
            if (block.text.includes("Typowa ścieżka:")) {
                return null;
            }

            return (
                <p key={key} className="text-[15.5px] sm:text-[16.5px] text-slate-500 leading-relaxed font-semibold mt-6 mb-8 animate-in slide-in-from-bottom-2 fade-in duration-500 max-w-4xl">
                    <FormatText text={block.text} />
                </p>
            );
        }
    }
}

// ── List icon component ──────────────────────────────────────

function ListIcon({ type }: { type: string }) {
    switch (type) {
        case "check":
            return (
                <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
            );
        case "x":
            return (
                <div className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
                    <X className="w-4 h-4 text-rose-600" strokeWidth={3} />
                </div>
            );
        case "arrow":
            return (
                <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                    <ChevronRight className="w-4 h-4 text-blue-600 ml-0.5" />
                </div>
            );
        default:
            return <div className="w-[8px] h-[8px] rounded-full bg-indigo-400 shrink-0 mt-2 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />;
    }
}

// ── Table component ──────────────────────────────────────────

function MarkdownTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
    return (
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/50 my-12 bg-white relative max-w-full animate-in slide-in-from-bottom-4 fade-in duration-700 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="w-full overflow-x-auto scroller">
                <table className="w-full text-[15.5px] sm:text-[16px] border-collapse min-w-[600px] lg:min-w-full">
                    <thead>
                        <tr>
                            {headers.map((header, i) => {
                                const isLast = i === headers.length - 1 && headers.length > 1;
                                return (
                                    <th
                                        key={i}
                                        className={cn(
                                            "px-8 py-7 font-black whitespace-nowrap text-[11.5px] sm:text-[12px] uppercase tracking-[0.15em] border-b-[1.5px] border-slate-100",
                                            i === 0 ? "text-left w-[30%] sm:w-[260px] text-slate-500" : "text-center text-[#0a0f1c]",
                                            isLast ? "bg-indigo-50/40 relative" : ""
                                        )}
                                    >
                                        {isLast && (
                                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#667eea] to-[#764ba2]"></div>
                                        )}
                                        <FormatText text={header} />
                                    </th>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50/80">
                        {rows.map((row, i) => (
                            <tr
                                key={i}
                                className="group hover:bg-slate-50/40 transition-colors duration-300"
                            >
                                {row.map((cell, j) => {
                                    const isLast = j === headers.length - 1 && headers.length > 1;
                                    return (
                                        <td
                                            key={j}
                                            className={cn(
                                                "px-8 py-6 align-middle leading-[1.7]",
                                                j === 0 ? "font-bold text-[#0a0f1c] text-left border-r border-slate-50/50" : "text-slate-600 font-normal text-center",
                                                isLast ? "bg-indigo-50/40 group-hover:bg-indigo-50/60 transition-colors" : ""
                                            )}
                                        >
                                            <FormatText text={cell} />
                                        </td>
                                    )
                                })}
                                {/* Pad missing cells */}
                                {row.length < headers.length &&
                                    Array.from({ length: headers.length - row.length }).map((_, j) => {
                                        const actualIndex = row.length + j;
                                        const isLast = actualIndex === headers.length - 1 && headers.length > 1;
                                        return (
                                            <td key={`pad-${j}`} className={cn("px-8 py-6 text-slate-200 align-middle text-center font-normal", isLast ? "bg-indigo-50/40" : "")}>—</td>
                                        )
                                    })
                                }
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Inline formatting ────────────────────────────────────────

function FormatText({ text }: { text: string }) {
    const parts = text.split(/(\*\*.*?\*\*)/);

    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                        <strong key={i} className="font-extrabold text-[#0a0f1c] tracking-tight">
                            <InlineMarks text={part.slice(2, -2)} />
                        </strong>
                    );
                }
                return <InlineMarks key={i} text={part} />;
            })}
        </>
    );
}

// Styles ✔/✓ with emerald icons, ✗/✕ with red icons
function InlineMarks({ text }: { text: string }) {
    const isOnlyMark = text.trim() === "✔" || text.trim() === "✓" || text.trim() === "✗" || text.trim() === "✕";
    
    // First, let's see if the text contains these marks.
    const parts = text.split(/(✔|✓|✗|✕)/);
    if (parts.length === 1) return <>{text}</>;
    
    return (
        <span className="inline-flex flex-wrap items-center">
            {parts.map((p, i) => {
                if (p === "✔" || p === "✓") {
                    if (isOnlyMark) {
                        return (
                            <div key={i} className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm mx-auto">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            </div>
                        );
                    }
                    return <CheckCircle2 key={i} className="inline-block w-5 h-5 text-emerald-500 mr-2 -mt-0.5 shrink-0" />;
                }
                if (p === "✗" || p === "✕") {
                    if (isOnlyMark) {
                        return (
                            <div key={i} className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 shadow-sm mx-auto">
                                <X key={i} className="w-5 h-5 text-[#764ba2]" strokeWidth={3} />
                            </div>
                        );
                    }
                    // Purple X to match the screenshot!
                    return <X key={i} className="inline-block w-5 h-5 text-[#764ba2] mr-2 -mt-0.5 shrink-0" strokeWidth={3} />;
                }
                return <span key={i} className="align-middle">{p}</span>;
            })}
        </span>
    );
}

