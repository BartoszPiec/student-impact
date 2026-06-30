"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileIcon, UploadCloud, Trash2, Download } from "lucide-react";
import { addResource, deleteResource, getSignedStorageUrl } from "@/app/app/deliverables/_actions";
import { uploadPrivateFile } from "@/lib/security/client-upload";

type ResourceRow = {
    id: string;
    file_name: string | null;
    file_path: string | null;
    created_at: string | null;
};

type FilesTabProps = {
    applicationId: string;
    resources: ResourceRow[];
    deliverables?: unknown[];
    isCompany: boolean;
};

export function FilesTab({
    applicationId,
    resources,
    isCompany
}: FilesTabProps) {
    const [isUploading, setIsUploading] = useState(false);


    async function openSigned(bucket: string, pathOrUrl: string) {
        try {
            const signedOrUrl = await getSignedStorageUrl(bucket, pathOrUrl, 600);
            window.open(signedOrUrl, "_blank");
        } catch (err) {
            console.error(err);
            alert("Nie udało się wygenerować linku do pobrania.");
        }
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        try {
            const uploaded = await uploadPrivateFile({
                file,
                purpose: "deliverable_resource",
                sourceId: applicationId,
            });

            // Save to DB (store object path, not public URL)
            const formData = new FormData();
            formData.append("filename", uploaded.name);
            formData.append("fileUrl", uploaded.path);
            formData.append("fileSize", String(uploaded.size));

            await addResource(applicationId, formData);

        } catch (err) {
            console.error(err);
            alert("Błąd wysyłania pliku.");
        } finally {
            setIsUploading(false);
            e.target.value = ""; // reset
        }
    }

    return (
        <div className="space-y-8">


            {/* COMPANY RESOURCES */}
            <Card className="border-2 border-indigo-50 shadow-sm bg-white">
                <CardHeader>
                    <CardTitle>Materiały pomocnicze</CardTitle>
                    <CardDescription>Pliki wgrane przez firmę (wytyczne, logotypy, dostępy w plikach).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* List */}
                    {resources.length === 0 ? (
                        <div className="text-center py-8 text-sm text-slate-400 bg-slate-50/50 border border-dashed border-slate-200/60 rounded-xl">
                            Brak materiałów pomocniczych.
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {resources.map((res) => (
                                <div key={res.id} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded">
                                            <FileIcon className="w-4 h-4" />
                                        </div>
                                        <div className="truncate">
                                            <div className="font-medium text-sm truncate">{res.file_name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {res.created_at ? new Date(res.created_at).toLocaleDateString() : "-"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openSigned("deliverables", String(res.file_path))}
                                            className="p-2 text-slate-500 hover:bg-slate-100 rounded"
                                            title="Pobierz (signed URL)"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        {/* Only uploader can delete? Assume company can manage resources */}
                                        {isCompany && (
                                            <button
                                                onClick={() => deleteResource(res.id, applicationId)}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Upload */}
                    <div className="pt-4">
                        <Label htmlFor="upload-resource" className="cursor-pointer">
                            <div className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 font-medium text-sm">
                                {isUploading ? "Wysyłanie..." : <><UploadCloud className="w-4 h-4" /> Wgraj nowy plik</>}
                            </div>
                            <Input
                                id="upload-resource"
                                type="file"
                                className="hidden"
                                onChange={handleUpload}
                                disabled={isUploading}
                            />
                        </Label>
                    </div>
                </CardContent>
            </Card>


            {/* STUDENT DELIVERABLES REMOVED AS PER REQUEST */}


        </div>
    );
}
