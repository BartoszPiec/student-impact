
import { FileIcon, ImageIcon } from "lucide-react";
import { storageDownloadUrl } from "@/lib/security/storage-url";

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
    const downloadUrl = storageDownloadUrl(url);

    return (
        <div className="flex max-w-[min(78vw,26rem)] flex-col gap-1 sm:max-w-md">
            {isImage ? (
                <a href={downloadUrl} target="_blank" rel="noreferrer" className="flex max-w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:bg-slate-50">
                    <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                        <ImageIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-700">{name || "Obraz"}</p>
                        <p className="text-xs uppercase text-slate-400">Prywatny załącznik</p>
                    </div>
                </a>
            ) : (
                <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex max-w-full items-center gap-3 p-3 rounded-xl border shadow-sm transition-colors hover:bg-opacity-90 ${isMine ? "bg-indigo-600/10 border-indigo-200" : "bg-white border-slate-200 hover:bg-slate-50"
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
