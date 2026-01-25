
import { FileIcon, ImageIcon } from "lucide-react";

export function FileBubble({
    name,
    url,
    type,
    isMine
}: {
    name: string;
    url: string;
    type: string;
    isMine: boolean;
}) {
    const isImage = type === "image";

    return (
        <div className="flex flex-col gap-1">
            {isImage ? (
                <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-slate-200 shadow-sm max-w-[280px]">
                    {/*eslint-disable-next-line @next/next/no-img-element*/}
                    <img src={url} alt={name} className="w-full h-auto object-cover max-h-64 hover:opacity-95 transition-opacity" />
                </a>
            ) : (
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-3 p-3 rounded-xl border shadow-sm transition-colors hover:bg-opacity-90 ${isMine ? "bg-indigo-600/10 border-indigo-200" : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                >
                    <div className={`p-2 rounded-lg ${isMine ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                        <FileIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isMine ? "text-indigo-900" : "text-slate-700"}`}>
                            {name || "Plik"}
                        </p>
                        <p className="text-xs text-slate-400 uppercase">Załącznik</p>
                    </div>
                </a>
            )}
        </div>
    );
}
