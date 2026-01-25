"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

import { UploadCloud, Send, File, X } from "lucide-react";

export function UploadForm({
    applicationId,
    action
}: {
    applicationId: string,
    action: (appId: string, formData: FormData) => Promise<void>
}) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<{ name: string, bucket: string, path: string, size: number, url?: string }[]>([]);

    // Wrapper for action to include files
    async function handleSubmit(formData: FormData) {
        formData.append("filesJson", JSON.stringify(uploadedFiles));
        await action(applicationId, formData);
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files?.length) return;

        setIsUploading(true);
        const supabase = createClient();
        const newFiles: { name: string, bucket: string, path: string, size: number, url?: string }[] = [];

        try {
            for (let i = 0; i < e.target.files.length; i++) {
                const file = e.target.files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${applicationId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { error } = await supabase.storage
                    .from('deliverables')
                    .upload(fileName, file);

                if (error) throw error;

                newFiles.push({
                    name: file.name,
                    bucket: 'deliverables',
                    path: fileName,
                    size: file.size
                });
            }
            setUploadedFiles(prev => [...prev, ...newFiles]);
        } catch (err) {
            console.error(err);
            alert("Brak dostępu lub błąd wysyłania.");
        } finally {
            setIsUploading(false);
            e.target.value = "";
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6 text-left">
            <div className="space-y-4">
                <div>
                    <Label className="text-base font-bold text-slate-800">Prześlij pliki</Label>
                    <p className="text-sm text-slate-500 mb-3">Wgraj gotowe pliki dla klienta (np. logo, raport, kod).</p>

                    <Label htmlFor="file-upload" className="cursor-pointer group block">
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-300 group-hover:shadow-md">
                            <div className="p-4 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                <UploadCloud className="w-8 h-8 text-indigo-600" />
                            </div>
                            <span className="font-bold text-indigo-700 text-lg">Kliknij, aby wybrać pliki</span>
                            <span className="text-sm text-slate-500 mt-1">lub przeciągnij je tutaj</span>
                        </div>
                        <Input
                            id="file-upload"
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            disabled={isUploading}
                            className="hidden"
                        />
                    </Label>

                    {isUploading && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-indigo-600 font-medium animate-pulse">
                            <Loader2 className="animate-spin h-5 w-5" />
                            Wysyłanie plików...
                        </div>
                    )}

                    {uploadedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {uploadedFiles.map((f, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-white rounded-xl border shadow-sm hover:border-indigo-200 transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 bg-slate-100 rounded text-slate-500">
                                            <File className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium text-slate-700 truncate">{f.name}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))}
                                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label className="font-semibold text-slate-800">Opis realizacji (opcjonalne)</Label>
                <Textarea
                    name="description"
                    placeholder="Napisz krótko co zostało zrobione, dodaj linki zewnętrzne itp."
                    className="min-h-[100px] border-slate-200 focus:border-indigo-300 rounded-xl resize-none"
                />
            </div>

            <Button
                type="submit"
                size="lg"
                className={`w-full font-bold text-lg rounded-xl py-6 shadow-[0_4px_14px_0_rgba(79,70,229,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]
                    ${uploadedFiles.length > 0
                        ? "bg-[#4F46E5] hover:bg-[#4338ca] text-white"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"}
                `}
                disabled={isUploading || uploadedFiles.length === 0}
            >
                <Send className="w-5 h-5 mr-2" />
                Wyślij do akceptacji
            </Button>
        </form>
    )
}
