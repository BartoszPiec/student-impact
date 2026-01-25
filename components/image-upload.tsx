"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ImageUploadProps {
    value: string[];
    onChange: (urls: string[]) => void;
    bucketName?: string;
    folder?: string;
}

export default function ImageUpload({ value = [], onChange, bucketName = "portfolio", folder = "uploads" }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files?.length) return;

        setIsUploading(true);
        const supabase = createClient();
        const newUrls: string[] = [];

        try {
            for (let i = 0; i < e.target.files.length; i++) {
                const file = e.target.files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { error } = await supabase.storage
                    .from(bucketName)
                    .upload(fileName, file);

                if (error) {
                    console.error("Upload error:", error);
                    continue;
                }

                const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
                newUrls.push(data.publicUrl);
            }

            onChange([...value, ...newUrls]);
        } catch (err) {
            console.error(err);
            alert("Błąd podczas wysyłania zdjęć.");
        } finally {
            setIsUploading(false);
            e.target.value = "";
        }
    }

    const removeImage = (indexToRemove: number) => {
        onChange(value.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {value.map((url, index) => (
                    <div key={url} className="relative aspect-video rounded-lg overflow-hidden border bg-slate-100 group">
                        <Image
                            src={url}
                            alt="Portfolio item"
                            fill
                            className="object-cover"
                        />
                        <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}

                <label className="relative flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                        {isUploading ? (
                            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                        ) : (
                            <Upload className="h-8 w-8 text-slate-400 mb-2" />
                        )}
                        <span className="text-xs text-slate-500 font-medium">
                            {isUploading ? "Wysyłanie..." : "Dodaj zdjęcie"}
                        </span>
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />
                </label>
            </div>
            <p className="text-xs text-muted-foreground">
                Obsługiwane formaty: JPG, PNG, WEBP. Max rozmiar: 5MB.
            </p>
        </div>
    );
}
