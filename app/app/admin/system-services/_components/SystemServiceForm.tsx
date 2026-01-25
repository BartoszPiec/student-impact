"use client";

import { useState } from "react";
import { createSystemService, updateSystemService } from "../_actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Zap, Loader2, UploadCloud, CheckCircle2, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SystemServiceFormProps {
    initialData?: any;
    offerId?: string;
}

export default function SystemServiceForm({ initialData, offerId }: SystemServiceFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // File Upload State
    const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const [formData, setFormData] = useState({
        tytul: initialData?.title || "",
        kategoria: initialData?.category || "IT - Rozwój oprogramowania",
        opis: initialData?.description || "",
        stawka: initialData?.price ? String(initialData.price) : "",
        czas: initialData?.delivery_time_days ? String(initialData.delivery_time_days) : "",
        materialy_link: "", // Don't try to parse back for now
        materialy_opis: initialData?.locked_content || "", // Load existing locked content
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const supabase = createClient();
            const filename = `params/${Date.now()}-${file.name.replace(/\s/g, '_')}`;

            const { data, error } = await supabase.storage
                .from('offer_attachments')
                .upload(filename, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('offer_attachments')
                .getPublicUrl(data.path);

            setUploadedFileUrl(publicUrl);
        } catch (err: any) {
            console.error(err);
            setError("Błąd przesyłania pliku: " + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Prepare Frontend Data -> Backend FormData
        const fd = new FormData();
        fd.append("is_platform_service", "on"); // FORCE FLAG
        fd.append("typ", "micro"); // Usually micro for system services
        fd.append("tytul", formData.tytul);
        fd.append("kategoria", formData.kategoria);
        fd.append("opis", formData.opis);
        fd.append("stawka", formData.stawka);
        fd.append("czas", formData.czas);

        // Construct Obligations (Locked Content)
        let lockedContent = formData.materialy_opis;
        if (formData.materialy_link) lockedContent += `\n\n[LINK DO MATERIAŁÓW]: ${formData.materialy_link}`;
        if (uploadedFileUrl) lockedContent += `\n\n[ZAŁĄCZONY PLIK]: ${uploadedFileUrl}`;

        fd.append("obligations", lockedContent);

        try {
            if (offerId) {
                await updateSystemService(offerId, fd);
            } else {
                await createSystemService(fd);
                router.push("/app/admin/system-services");
            }
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5" />
                    {error}
                </div>
            )}

            <div className="grid md:grid-cols-3 gap-8">
                {/* LEFT COLUMN: BASIC INFO */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="rounded-[1.5rem] border-slate-100 shadow-sm overflow-hidden">
                        <div className="bg-slate-50/50 p-6 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-500" /> Podstawowe Informacje
                            </h3>
                        </div>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label>Tytuł Usługi</Label>
                                <Input
                                    className="h-12 rounded-xl text-lg font-bold"
                                    placeholder="np. Wykonanie prostej grafiki social media"
                                    required
                                    value={formData.tytul}
                                    onChange={e => handleChange("tytul", e.target.value)}
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Kategoria</Label>
                                    <select
                                        className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                                        value={formData.kategoria}
                                        onChange={e => handleChange("kategoria", e.target.value)}
                                    >
                                        <option value="IT - Rozwój oprogramowania">IT - Rozwój oprogramowania</option>
                                        <option value="Grafika & Design">Grafika & Design</option>
                                        <option value="Marketing">Marketing</option>
                                        <option value="Copywriting">Copywriting</option>
                                        <option value="Inne">Inne</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Termin Realizacji</Label>
                                    <Input
                                        className="h-12 rounded-xl"
                                        placeholder="np. 3 dni"
                                        value={formData.czas}
                                        onChange={e => handleChange("czas", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Opis Publiczny (Widoczny dla wszystkich)</Label>
                                <Textarea
                                    className="min-h-[150px] rounded-xl p-4 leading-relaxed"
                                    placeholder="Opisz, na czym polega usługa i czego oczekujesz..."
                                    required
                                    value={formData.opis}
                                    onChange={e => handleChange("opis", e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[1.5rem] border-amber-200 bg-amber-50/30 overflow-hidden shadow-sm">
                        <div className="bg-amber-100/50 p-6 border-b border-amber-200/50">
                            <h3 className="font-bold text-amber-900 flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-amber-600" /> Zablokowane Materiały (Tylko dla wykonawcy)
                            </h3>
                        </div>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-amber-900">Instrukcje / Opis szczegółowy</Label>
                                <Textarea
                                    className="min-h-[100px] rounded-xl border-amber-200 bg-white"
                                    placeholder="Te informacje zobaczy tylko osoba, która przyjmie zlecenie."
                                    value={formData.materialy_opis}
                                    onChange={e => handleChange("materialy_opis", e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-amber-900">Link do zasobów (opcjonalnie)</Label>
                                <Input
                                    className="h-12 rounded-xl border-amber-200 bg-white"
                                    placeholder="https://drive.google.com/..."
                                    value={formData.materialy_link}
                                    onChange={e => handleChange("materialy_link", e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-amber-900">Plik z materiałami (opcjonalnie)</Label>
                                <div className="flex items-center gap-4">
                                    <Label htmlFor="file-upload" className="cursor-pointer inline-flex items-center gap-2 bg-white border border-amber-200 px-6 py-3 rounded-xl hover:bg-amber-100 transition-colors text-sm font-semibold text-amber-800 shadow-sm">
                                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                                        {isUploading ? "Przesyłanie..." : "Wgraj plik"}
                                    </Label>
                                    <Input
                                        id="file-upload"
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        disabled={isUploading}
                                    />
                                    {uploadedFileUrl && (
                                        <div className="text-sm text-green-600 font-extrabold flex items-center gap-2 animate-in fade-in slide-in-from-left-2 bg-white px-3 py-1.5 rounded-lg border border-green-100 shadow-sm">
                                            <CheckCircle2 className="h-4 w-4" /> Plik gotowy
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: PRICING & ACTION */}
                <div className="space-y-6">
                    <Card className="rounded-[1.5rem] border-slate-100 shadow-lg sticky top-6">
                        <div className="bg-slate-900 text-white p-6 rounded-t-[1.5rem]">
                            <h3 className="font-bold flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-emerald-400" /> Wycena
                            </h3>
                        </div>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label>Stawka Gwarantowana (PLN)</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        className="h-14 pl-4 text-2xl font-black rounded-xl border-slate-200"
                                        placeholder="500"
                                        required
                                        value={formData.stawka}
                                        onChange={e => handleChange("stawka", e.target.value)}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">PLN</span>
                                </div>
                                <p className="text-xs text-slate-400">Kwota brutto za wykonanie całego zlecenia.</p>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-14 rounded-xl text-lg font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (offerId ? "Zapisz Zmiany" : "Publikuj Usługę")}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    );
}
