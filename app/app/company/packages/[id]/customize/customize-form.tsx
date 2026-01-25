"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createCustomizedOffer, updateCustomizedOffer } from "../../_actions";
import { Loader2, ArrowRight, Video, Palette, Megaphone, Zap, Save, CheckCircle2, MonitorPlay, Smartphone } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function CustomizePackageForm({
    packageId,
    packageTitle,
    packageCategory,
    initialData = {},
    offerId
}: {
    packageId: string,
    packageTitle: string,
    packageCategory: string,
    initialData?: Record<string, string>,
    offerId?: string
}) {
    const [isPending, startTransition] = useTransition();

    // Helper to determine category
    const t = packageTitle.toLowerCase();
    const c = packageCategory ? packageCategory.toLowerCase() : "";

    // Feature Flags
    const isVideo = t.includes("wideo") || t.includes("video") || t.includes("rolek") || t.includes("film") || c.includes("video");
    const isYouTube = t.includes("youtube") || t.includes("dłuższe"); // Specific for YouTube
    const isLogo = t.includes("logo") || t.includes("grafik") || t.includes("identyfikacja") || c.includes("design");
    const isMarketing = t.includes("marketing") || t.includes("kampania") || t.includes("ads") || c.includes("marketing");
    const isAutomation = t.includes("auto") || t.includes("skrzynk") || c.includes("it");

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            try {
                if (offerId) {
                    await updateCustomizedOffer(offerId, formData);
                } else {
                    await createCustomizedOffer(packageId, formData);
                }
            } catch (error: any) {
                // Ignore Next.js redirect "error"
                if (error.message === "NEXT_REDIRECT" || error.message?.includes("NEXT_REDIRECT")) {
                    return;
                }
                alert("Błąd: " + (error.message || "Wystąpił nieznany błąd."));
            }
        });
    };

    // --- OPTION LISTS ---

    // Target Groups
    const targetGroups = [
        "Młodzież (Gen Z)",
        "Dorośli (25-45 lat)",
        "Seniorzy",
        "Klienci Biznesowi (B2B)",
        "Klienci Indywidualni (B2C)",
        "Gracze / Gamerzy",
        "Entuzjaści Tech",
        "Fashion & Beauty",
        "Rodzice",
        "Inna (wpisz w uwagach)"
    ];

    // Video Goals
    const videoGoalsYouTube = [
        "Vlog / Lifestyle",
        "Tutorial / Edukacja",
        "Recenzja Produktu",
        "Wywiad / Podcast",
        "Gaming / Gameplay",
        "Dokument / Reportaż",
        "Video Essay",
        "Kompilacja / Best of",
        "Inny"
    ];

    const videoGoalsGeneral = [
        "Reklama Social Media (FB/IG/TikTok)",
        "Prezentacja Firmy",
        "Relacja z Wydarzenia",
        "Teledysk",
        "Video Explainer",
        "Rolka / Short / TikTok",
        "Szolenie / Kurs",
        "Inny"
    ];

    // Design Industries
    const industries = [
        "IT / Technologia",
        "Beauty / Fashion",
        "Budownictwo / Architektura",
        "Gastronomia / Jedzenie",
        "Finanse / Prawo",
        "Edukacja / Szkolenia",
        "Sport / Zdrowie",
        "Nieruchomości",
        "E-commerce",
        "Usługi Kreatywne",
        "Inna"
    ];

    // Design Styles
    const designStyles = [
        "Minimalistyczny / Czysty",
        "Nowoczesny / Tech",
        "Luksusowy / Elegancki",
        "Retro / Vintage",
        "Zabawny / Kolorowy",
        "Industrialny / Surowy",
        "Korporacyjny / Poważny",
        "Artystyczny / Ręcznie rysowany",
        "Inny" // Fallback
    ];

    // Marketing Goals
    const marketingGoals = [
        "Sprzedaż Produktu/Usługi",
        "Pozyskanie Leadów (Kontaktów)",
        "Budowanie Świadomości Marki (Zasięg)",
        "Promocja Wydarzenia/Webinaru",
        "Ruch na Stronę WWW",
        "Aktywność / Zaangażowanie Fanów",
        "Inny"
    ];

    return (
        <form action={handleSubmit} className="space-y-8 animate-in fade-in duration-700">

            {/* --- VIDEO SECTION --- */}
            {isVideo && (
                <Card className="border-indigo-100 shadow-lg shadow-indigo-50 overflow-hidden bg-white/90 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                <Video className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-indigo-950 text-xl">Scenariusz Wideo</CardTitle>
                                <CardDescription>Precyzując cel i format, przyspieszysz montaż.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label htmlFor="videoGoal" className="text-slate-700 font-medium">Cel wideo / Rodzaj</Label>
                                <Select name="videoGoal" defaultValue={initialData.videoGoal || ""}>
                                    <SelectTrigger className="h-11 bg-white border-slate-200">
                                        <SelectValue placeholder="Wybierz rodzaj wideo..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(isYouTube ? videoGoalsYouTube : videoGoalsGeneral).map(opt => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="targetGroup" className="text-slate-700 font-medium">Grupa docelowa</Label>
                                <Select name="targetGroup" defaultValue={initialData.targetGroup || ""}>
                                    <SelectTrigger className="h-11 bg-white border-slate-200">
                                        <SelectValue placeholder="Do kogo kierujesz materiał?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {targetGroups.map(opt => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="materialsLink" className="font-bold text-slate-900 flex items-center justify-between">
                                <span>Link do materiałów <span className="text-red-500">*</span></span>
                                <span className="text-xs font-normal text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">Google Drive / Dropbox</span>
                            </Label>
                            <Input
                                id="materialsLink"
                                name="materialsLink"
                                defaultValue={initialData.materialsLink}
                                placeholder="https://..."
                                required
                                className="h-11 bg-white border-slate-200 focus:border-indigo-500 transition-colors"
                            />
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-green-600" />
                                Wklej link do folderu z wideo/zdjęciami do montażu.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 pt-2">
                            <div className="space-y-3">
                                <Label className="block text-slate-700 font-medium mb-3">Format / Proporcje</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="cursor-pointer group relative">
                                        <input
                                            type="radio"
                                            name="format"
                                            value="9:16"
                                            className="peer sr-only"
                                            defaultChecked={initialData.format === "9:16" || (!initialData.format && !isYouTube)}
                                        />
                                        <div className="p-4 rounded-xl border-2 border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-white transition-all peer-checked:border-indigo-600 peer-checked:bg-white peer-checked:shadow-md flex flex-col items-center gap-2 text-center h-full">
                                            <Smartphone className="w-6 h-6 text-slate-400 peer-checked:text-indigo-600 mb-1" />
                                            <span className="font-medium text-slate-700 peer-checked:text-indigo-700 text-sm">Pionowo</span>
                                            <span className="text-xs text-slate-500">TikTok / Reels / Shorts</span>
                                        </div>
                                    </label>
                                    <label className="cursor-pointer group relative">
                                        <input
                                            type="radio"
                                            name="format"
                                            value="16:9"
                                            className="peer sr-only"
                                            defaultChecked={initialData.format === "16:9" || (!initialData.format && !!isYouTube)}
                                        />
                                        <div className="p-4 rounded-xl border-2 border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-white transition-all peer-checked:border-indigo-600 peer-checked:bg-white peer-checked:shadow-md flex flex-col items-center gap-2 text-center h-full">
                                            <MonitorPlay className="w-6 h-6 text-slate-400 peer-checked:text-indigo-600 mb-1" />
                                            <span className="font-medium text-slate-700 peer-checked:text-indigo-700 text-sm">Poziomo</span>
                                            <span className="text-xs text-slate-500">YouTube / TV</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="audioStyle" className="text-slate-700 font-medium">Audio / Muzyka</Label>
                                <Input id="audioStyle" name="audioStyle" defaultValue={initialData.audioStyle} placeholder="np. Energiczna, Lofi, Własny lektor..." className="h-11 bg-white border-slate-200" />
                                <p className="text-xs text-slate-500">Opisz nastrój lub podaj nazwę utworu.</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="inspiration" className="text-slate-700 font-medium">Inspiracje (Linki)</Label>
                            <Textarea id="inspiration" name="inspiration" defaultValue={initialData.inspiration} placeholder="Link do filmu na YouTube/TikTok, który Ci się podoba..." className="bg-white border-slate-200" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* --- LOGO / DESIGN SECTION --- */}
            {isLogo && (
                <Card className="border-purple-100 shadow-lg shadow-purple-50 overflow-hidden bg-white/90 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                <Palette className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-purple-950 text-xl">Wizja Graficzna</CardTitle>
                                <CardDescription>Określ styl i kolorystykę, aby projekt trafił w Twój gust.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label htmlFor="brandName" className="text-slate-700 font-medium">Nazwa Marki / Firmy <span className="text-red-500">*</span></Label>
                                <Input id="brandName" name="brandName" defaultValue={initialData.brandName} placeholder="Pełna nazwa do logo" required className="h-11 bg-white border-slate-200" />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="industry" className="text-slate-700 font-medium">Branża</Label>
                                <Select name="industry" defaultValue={initialData.industry || ""}>
                                    <SelectTrigger className="h-11 bg-white border-slate-200">
                                        <SelectValue placeholder="Wybierz branżę..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {industries.map(opt => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label htmlFor="style" className="text-slate-700 font-medium">Preferowany styl</Label>
                                <Select name="style" defaultValue={initialData.style || ""}>
                                    <SelectTrigger className="h-11 bg-white border-slate-200">
                                        <SelectValue placeholder="Wybierz styl..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {designStyles.map(opt => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="colors" className="text-slate-700 font-medium">Preferowana kolorystyka</Label>
                                <Input id="colors" name="colors" defaultValue={initialData.colors} placeholder="np. Granat i Złoto, Pastele..." className="h-11 bg-white border-slate-200" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="inspiration" className="text-slate-700 font-medium">Przykłady / Inspiracje</Label>
                            <Textarea id="inspiration" name="inspiration" defaultValue={initialData.inspiration} placeholder="Opisz lub wklej linki do logo, które Ci się podobają..." className="min-h-[100px] bg-white border-slate-200" />
                        </div>
                    </CardContent>
                </Card>
            )}


            {/* --- MARKETING SECTION --- */}
            {isMarketing && (
                <Card className="border-pink-100 shadow-lg shadow-pink-50 overflow-hidden bg-white/90 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-pink-50 to-white border-b border-pink-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
                                <Megaphone className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-pink-950 text-xl">Cele Kampanii</CardTitle>
                                <CardDescription>Zdefiniuj grupę docelową i oczekiwane wyniki.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 space-y-6">
                        <div className="space-y-3">
                            <Label htmlFor="campaignGoal" className="text-slate-700 font-medium">Cel Kampanii</Label>
                            <Select name="campaignGoal" defaultValue={initialData.campaignGoal || ""}>
                                <SelectTrigger className="h-11 bg-white border-slate-200">
                                    <SelectValue placeholder="Co chcesz osiągnąć?" />
                                </SelectTrigger>
                                <SelectContent>
                                    {marketingGoals.map(opt => (
                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label htmlFor="platforms" className="text-slate-700 font-medium">Platformy</Label>
                                <Input id="platforms" name="platforms" defaultValue={initialData.platforms} placeholder="np. Facebook + Instagram..." required className="h-11 bg-white border-slate-200" />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="targetGroup" className="text-slate-700 font-medium">Grupa docelowa</Label>
                                <Select name="targetGroup" defaultValue={initialData.targetGroup || ""}>
                                    <SelectTrigger className="h-11 bg-white border-slate-200">
                                        <SelectValue placeholder="Kto jest odbiorcą?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {targetGroups.map(opt => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="materialsLink" className="text-slate-700 font-medium">Materiały graficzne (Jeśli posiadasz)</Label>
                            <Input id="materialsLink" name="materialsLink" defaultValue={initialData.materialsLink} placeholder="Link do zdjęć/kreacji..." className="h-11 bg-white border-slate-200" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* --- AUTOMATION / IT SECTION --- */}
            {isAutomation && (
                <Card className="border-blue-100 shadow-lg shadow-blue-50 overflow-hidden bg-white/90 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-blue-950 text-xl">Scenariusz Automatyzacji</CardTitle>
                                <CardDescription>Opisz proces, który chcesz usprawnić.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 space-y-6">
                        <div className="space-y-3">
                            <Label htmlFor="processDesc" className="text-slate-700 font-medium">Obecny proces (Jak to robisz teraz?) <span className="text-red-500">*</span></Label>
                            <Textarea id="processDesc" name="processDesc" defaultValue={initialData.processDesc} placeholder="Opisz krok po kroku co robisz ręcznie..." className="min-h-[100px] bg-white border-slate-200" required />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="expectedEffect" className="text-slate-700 font-medium">Oczekiwany efekt</Label>
                            <Textarea id="expectedEffect" name="expectedEffect" defaultValue={initialData.expectedEffect} placeholder="Co ma się dziać automatycznie?" className="min-h-[100px] bg-white border-slate-200" required />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* --- COMMON FIELDS (ALWAYS VISIBLE) --- */}
            <Card className="border-slate-100 shadow-lg bg-white/90 backdrop-blur-sm">
                <CardContent className="p-6 md:p-8 space-y-6 pt-8">
                    <div className="space-y-3">
                        <Label htmlFor="notes" className="text-slate-700 font-medium text-lg">Dodatkowe uwagi</Label>
                        <Textarea
                            id="notes"
                            name="notes"
                            defaultValue={initialData.notes}
                            placeholder="Wszelkie inne informacje, które mogą być przydatne..."
                            className="min-h-[120px] bg-white border-slate-200 text-base"
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label htmlFor="deadline" className="flex items-center justify-between text-slate-700 font-medium">
                                <span>Preferowany termin (Opcjonalnie)</span>
                            </Label>
                            <Input id="deadline" name="deadline" type="date" defaultValue={initialData.deadline} className="h-11 bg-white border-slate-200" />
                            <p className="text-xs text-slate-400">Standardowy czas realizacji zależy od pakietu.</p>
                        </div>
                        <div className="flex items-end justify-end">
                            <Button
                                type="submit"
                                disabled={isPending}
                                size="lg"
                                className="w-full md:w-auto min-w-[200px] h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200 rounded-xl font-medium text-base transition-all hover:scale-[1.02]"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Przetwarzanie...
                                    </>
                                ) : (
                                    offerId ? (
                                        <>
                                            <Save className="mr-2 h-5 w-5" /> Zapisz zmiany
                                        </>
                                    ) : (
                                        <>
                                            Zatwierdź i przejdź dalej <ArrowRight className="ml-2 h-5 w-5" />
                                        </>
                                    )
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

        </form>
    );
}
