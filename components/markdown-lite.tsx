import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, ChevronRight } from "lucide-react";

interface MarkdownLiteProps {
    content: string;
    className?: string;
    listIcon?: "check" | "x" | "arrow" | "dot";
}

export function MarkdownLite({ content, className, listIcon = "dot" }: MarkdownLiteProps) {
    if (!content) return null;
    const blocks = parseBlocks(content);
    return (
        <div className={cn("space-y-4 text-slate-600 leading-relaxed", className)}>
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
                <h3 key={key} className="text-xl font-bold text-slate-900 mt-8 mb-3 first:mt-0">
                    <FormatText text={block.text} />
                </h3>
            );

        case "h4":
            return (
                <h4 key={key} className="text-base font-bold text-slate-800 mt-6 mb-2 flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    <FormatText text={block.text} />
                </h4>
            );

        case "list":
            return (
                <ul key={key} className="space-y-3 my-1">
                    {block.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-3">
                            <ListIcon type={listIcon} />
                            <span className="leading-relaxed flex-1">
                                <FormatText text={item} />
                            </span>
                        </li>
                    ))}
                </ul>
            );

        case "table":
            return <MarkdownTable key={key} headers={block.headers} rows={block.rows} />;

        case "paragraph":
            return (
                <p key={key} className="leading-relaxed">
                    <FormatText text={block.text} />
                </p>
            );
    }
}

// ── List icon component ──────────────────────────────────────

function ListIcon({ type }: { type: string }) {
    switch (type) {
        case "check":
            return <CheckCircle2 className="w-[18px] h-[18px] text-emerald-500 mt-[3px] shrink-0" />;
        case "x":
            return <XCircle className="w-[18px] h-[18px] text-red-400 mt-[3px] shrink-0" />;
        case "arrow":
            return <ChevronRight className="w-[18px] h-[18px] text-blue-400 mt-[3px] shrink-0" />;
        default:
            return <div className="w-[7px] h-[7px] rounded-full bg-slate-300 mt-[9px] shrink-0" />;
    }
}

// ── Table component ──────────────────────────────────────────

function MarkdownTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 my-5 shadow-sm">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-200">
                        {headers.map((header, i) => (
                            <th
                                key={i}
                                className={cn(
                                    "px-4 py-3.5 text-left font-bold text-slate-700 whitespace-nowrap text-xs uppercase tracking-wider",
                                    i === 0 && "bg-slate-100/80"
                                )}
                            >
                                <FormatText text={header} />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {rows.map((row, i) => (
                        <tr
                            key={i}
                            className={cn(
                                "hover:bg-blue-50/40 transition-colors",
                                i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                            )}
                        >
                            {row.map((cell, j) => (
                                <td
                                    key={j}
                                    className={cn(
                                        "px-4 py-3 text-slate-600",
                                        j === 0 && "font-medium text-slate-700 bg-slate-50/30"
                                    )}
                                >
                                    <FormatText text={cell} />
                                </td>
                            ))}
                            {/* Pad missing cells */}
                            {row.length < headers.length &&
                                Array.from({ length: headers.length - row.length }).map((_, j) => (
                                    <td key={`pad-${j}`} className="px-4 py-3 text-slate-400">—</td>
                                ))
                            }
                        </tr>
                    ))}
                </tbody>
            </table>
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
                        <strong key={i} className="font-semibold text-slate-900">
                            <InlineMarks text={part.slice(2, -2)} />
                        </strong>
                    );
                }
                return <InlineMarks key={i} text={part} />;
            })}
        </>
    );
}

// Styles ✔/✓ in green, ✗/✕ in red
function InlineMarks({ text }: { text: string }) {
    const parts = text.split(/(✔|✓|✗|✕)/);
    if (parts.length === 1) return <>{text}</>;
    return (
        <>
            {parts.map((p, i) => {
                if (p === "✔" || p === "✓") return <span key={i} className="text-emerald-500 font-bold">✓</span>;
                if (p === "✗" || p === "✕") return <span key={i} className="text-red-400 font-bold">✗</span>;
                return <span key={i}>{p}</span>;
            })}
        </>
    );
}
