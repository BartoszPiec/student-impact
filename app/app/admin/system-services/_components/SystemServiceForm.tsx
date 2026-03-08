"use client";

import { useState } from "react";
import { createSystemService, updateSystemService } from "../_actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Zap, Loader2, UploadCloud, CheckCircle2, DollarSign, Plus, Trash2, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { SERVICE_CATEGORIES } from "@/lib/constants";

type Variant = {
    name: string;
    label: string;
    price: number;
    delivery_time_days?: number;
    scope?: string;
};

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

    // Variants state
    const [variants, setVariants] = useState<Variant[]>(
        initialData?.variants && Array.isArray(initialData.variants) ? initialData.variants : []
    );
    const [requiresNda, setRequiresNda] = useState<boolean>(initialData?.requires_nda || false);
    const [commissionRate, setCommissionRate] = useState<string>(
        initialData?.commission_rate != null ? String(initialData.commission_rate) : "0.25"
    );

    const [formData, setFormData] = useState({
        tytul: initialData?.title || "",
        kategoria: initialData?.category || SERVICE_CATEGORIES[0],
        opis: initialData?.description || "",
        stawka: initialData?.price ? String(initialData.price) : "",
        stawka_max: initialData?.price_max ? String(initialData.price_max) : "",
        czas: initialData?.delivery_time_days ? String(initialData.delivery_time_days) : "",
        materialy_link: "",
        materialy_opis: initialData?.locked_content || "",
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

    const addVariant = () => {
        setVariants(prev => [...prev, { name: "", label: "", price: 0, delivery_time_days: undefined, scope: "" }]);
    };

    const updateVariant = (index: number, field: keyof Variant, value: any) => {
        setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
    };

    const removeVariant = (index: number) => {
        setVariants(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Prepare Frontend Data -> Backend FormData
        const fd = new FormData();
        fd.append("is_platform_service", "on");
        fd.append("typ", "micro");
        fd.append("tytul", formData.tytul);
        fd.append("kategoria", formData.kategoria);
        fd.append("opis", formData.opis);
        fd.append("stawka", formData.stawka);
        fd.append("stawka_max", formData.stawka_max);
        fd.append("czas", formData.czas);
        fd.append("requires_nda", requiresNda ? "true" : "false");
        fd.append("commission_rate", commissionRate);

        // Variants
        if (variants.length > 0) {
            const cleanVariants = variants.filter(v => v.name && v.label && v.price > 0);
            fd.append("variants", JSON.stringify(cleanVariants));
        }

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
                                        {SERVICE_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Termin Realizacji (dni)</Label>
                                    <Input
                                        className="h-12 rounded-xl"
                                        type="number"
                                        placeholder="np. 7"
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
                    {/* VARIANTS CARD */}
                    <Card className="rounded-[1.5rem] border-indigo-200 bg-indigo-50/30 overflow-hidden shadow-sm">
                        <div className="bg-indigo-100/50 p-6 border-b border-indigo-200/50">
                            <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-indigo-600" /> Warianty S/M/L (opcjonalnie)
                            </h3>
                        </div>
                        <CardContent className="p-6 space-y-4">
                            <p className="text-xs text-indigo-700">
                                Dodaj warianty cenowe (np. S, M, L). Jeśli nie dodasz wariantów, obowiązuje jedna cena.
                            </p>

                            {variants.map((v, i) => (
                                <div key={i} className="grid grid-cols-5 gap-3 items-end bg-white p-4 rounded-xl border border-indigo-100">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Nazwa</Label>
                                        <Input
                                            className="h-10 rounded-lg"
                                            placeholder="S"
                                            value={v.name}
                                            onChange={e => updateVariant(i, "name", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Etykieta</Label>
                                        <Input
                                            className="h-10 rounded-lg"
                                            placeholder="Pakiet S"
                                            value={v.label}
                                            onChange={e => updateVariant(i, "label", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Cena (PLN)</Label>
                                        <Input
                                            className="h-10 rounded-lg"
                                            type="number"
                                            placeholder="699"
                                            value={v.price || ""}
                                            onChange={e => updateVariant(i, "price", Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Dni</Label>
                                        <Input
                                            className="h-10 rounded-lg"
                                            type="number"
                                            placeholder="7"
                                            value={v.delivery_time_days || ""}
                                            onChange={e => updateVariant(i, "delivery_time_days", Number(e.target.value) || undefined)}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => removeVariant(i)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <div className="col-span-5 space-y-1">
                                        <Label className="text-xs">Zakres (opcjonalnie)</Label>
                                        <Input
                                            className="h-10 rounded-lg"
                                            placeholder="np. do 3 stron, 1 runda poprawek"
                                            value={v.scope || ""}
                                            onChange={e => updateVariant(i, "scope", e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                onClick={addVariant}
                                className="w-full border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 rounded-xl"
                            >
                                <Plus className="h-4 w-4 mr-2" /> Dodaj wariant
                            </Button>
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
                                <Label>Cena bazowa (PLN)</Label>
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
                                <p className="text-xs text-slate-400">
                                    {variants.length > 0 ? "Cena min. wariantu (do sortowania w katalogu)." : "Kwota brutto za wykonanie całego zlecenia."}
                                </p>
                            </div>

                            {variants.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Cena maksymalna (PLN)</Label>
                                    <Input
                                        type="number"
                                        className="h-12 rounded-xl border-slate-200"
                                        placeholder="1499"
                                        value={formData.stawka_max}
                                        onChange={e => handleChange("stawka_max", e.target.value)}
                                    />
                                    <p className="text-xs text-slate-400">Cena najdroższego wariantu.</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Prowizja platformy</Label>
                                <select
                                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"
                                    value={commissionRate}
                                    onChange={e => setCommissionRate(e.target.value)}
                                >
                                    <option value="0.25">25% (usługi systemowe)</option>
                                    <option value="0.10">10% (usługi użytkowników)</option>
                                    <option value="0.15">15%</option>
                                    <option value="0.20">20%</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                                <input
                                    type="checkbox"
                                    id="requires_nda"
                                    checked={requiresNda}
                                    onChange={e => setRequiresNda(e.target.checked)}
                                    className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                />
                                <Label htmlFor="requires_nda" className="text-sm font-semibold text-amber-900 cursor-pointer flex items-center gap-2">
                                    <Shield className="h-4 w-4" /> Wymaga NDA
                                </Label>
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
