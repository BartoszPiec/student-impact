import { cn } from "@/lib/utils";

interface MarkdownLiteProps {
    content: string;
    className?: string;
}

export function MarkdownLite({ content, className }: MarkdownLiteProps) {
    if (!content) return null;

    // Split by double newline to separate paragraphs
    const paragraphs = content.split(/\n\n+/);

    return (
        <div className={cn("space-y-4 text-slate-600 leading-relaxed", className)}>
            {paragraphs.map((paragraph, i) => {
                // Header detection (### Header)
                if (paragraph.startsWith("###")) {
                    return (
                        <h3 key={i} className="text-xl font-bold text-slate-900 mt-6 mb-2">
                            {paragraph.replace(/^###\s*/, "")}
                        </h3>
                    );
                }

                // Header detection (**Header:** at start of line)
                if (paragraph.startsWith("**") && paragraph.includes("**")) {
                    // Check if it's a stand-alone header line like "**Hook:**"
                    // or just a paragraph starting with bold.
                    // If it's short, treat as subheader? No, let's just render bold.
                }

                // List detection (* item)
                if (paragraph.trim().startsWith("* ")) {
                    const items = paragraph.split(/\n/).filter(line => line.trim().startsWith("*"));
                    return (
                        <ul key={i} className="list-disc pl-5 space-y-2">
                            {items.map((item, j) => (
                                <li key={j} className="pl-1">
                                    <FormatText text={item.replace(/^\*\s*/, "")} />
                                </li>
                            ))}
                        </ul>
                    );
                }

                // Default paragraph
                return (
                    <p key={i}>
                        <FormatText text={paragraph} />
                    </p>
                );
            })}
        </div>
    );
}

// Helper to render bold text (**text**)
function FormatText({ text }: { text: string }) {
    const parts = text.split(/(\*\*.*?\*\*)/);

    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                    return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
                }
                return part;
            })}
        </>
    );
}
