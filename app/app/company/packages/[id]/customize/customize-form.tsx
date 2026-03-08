"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createCustomizedOffer, updateCustomizedOffer } from "../../_actions";
import {
    Loader2, ArrowRight, Video, Palette, Megaphone, Zap, Save,
    CheckCircle2, MonitorPlay, Smartphone, BarChart3, Languages,
    PenTool, Briefcase, Scale, Globe, FileText
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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

    // Normalized values for matching
    const t = packageTitle.toLowerCase();
    const c = packageCategory ? packageCategory.toLowerCase() : "";

    // Feature Flags — exact category matching to avoid false positives
    const isVideo = c === "multimedia" || t.includes("wideo") || t.includes("video") || t.includes("rolek") || t.includes("film") || t.includes("montaż");
    const isYouTube = t.includes("youtube") || t.includes("dłuższe");
    const isLogo = c === "design" || t.includes("logo") || t.includes("grafik") || t.includes("identyfikacja") || t.includes("opakow") || t.includes("ux/ui") || t.includes("makiet") || t.includes("broszur") || t.includes("katalog");
    const isMarketing = c === "marketing" || t.includes("kampania") || t.includes("ads") || t.includes("social media") || t.includes("content plan") || t.includes("newsletter") || t.includes("email market");
    const isIT = c === "programowanie i it" || c === "serwisy internetowe" || t.includes("wordpress") || t.includes("landing") || t.includes("sklep") || t.includes("crm") || t.includes("chatbot") || t.includes("helpdesk") || t.includes("infrastruktur") || t.includes("migracj");
    const isAnalytics = c === "analiza danych" || t.includes("raport") || t.includes("dashboard") || t.includes("analitycz") || t.includes("benchmark") || t.includes("osint") || t.includes("wywiad");
    const isTranslation = c === "tłumaczenia" || t.includes("tłumacz") || t.includes("lokalizac");
    const isCopywriting = c === "copywriting" || t.includes("tekst") || t.includes("dokumentacja techniczna") || t.includes("white paper");
    const isOfficeWork = c === "prace biurowe" || t.includes("transkryp") || t.includes("kosztorys") || t.includes("szablo");
    const isLegal = c === "prawo" || t.includes("regulamin") || t.includes("rodo") || t.includes("prawo") || t.includes("umow");

    // Check if any specific category matched
    const hasSpecificForm = isVideo || isLogo || isMarketing || isIT || isAnalytics || isTranslation || isCopywriting || isOfficeWork || isLegal;

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            try {
                if (offerId) {
                    await updateCustomizedOffer(offerId, formData);
                } else {
                    await createCustomizedOffer(packageId, formData);
                }
            } catch (error: any) {
                if (error.message === "NEXT_REDIRECT" || error.message?.includes("NEXT_REDIRECT")) {
                    return;
                }
                alert("Błąd: " + (error.message || "Wystąpił nieznany błąd."));
            }
        });
    };

    // --- OPTION LISTS ---

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

    const videoGoalsYouTube = [
        "Vlog / Lifestyle", "Tutorial / Edukacja", "Recenzja Produktu",
        "Wywiad / Podcast", "Gaming / Gameplay", "Dokument / Reportaż",
        "Video Essay", "Kompilacja / Best of", "Inny"
    ];

    const videoGoalsGeneral = [
        "Reklama Social Media (FB/IG/TikTok)", "Prezentacja Firmy",
        "Relacja z Wydarzenia", "Teledysk", "Video Explainer",
        "Rolka / Short / TikTok", "Szkolenie / Kurs", "Inny"
    ];

    const industries = [
        "IT / Technologia", "Beauty / Fashion", "Budownictwo / Architektura",
        "Gastronomia / Jedzenie", "Finanse / Prawo", "Edukacja / Szkolenia",
        "Sport / Zdrowie", "Nieruchomości", "E-commerce",
        "Usługi Kreatywne", "Inna"
    ];

    const designStyles = [
        "Minimalistyczny / Czysty", "Nowoczesny / Tech", "Luksusowy / Elegancki",
        "Retro / Vintage", "Zabawny / Kolorowy", "Industrialny / Surowy",
        "Korporacyjny / Poważny", "Artystyczny / Ręcznie rysowany", "Inny"
    ];

    const marketingGoals = [
        "Sprzedaż Produktu/Usługi", "Pozyskanie Leadów (Kontaktów)",
        "Budowanie Świadomości Marki (Zasięg)", "Promocja Wydarzenia/Webinaru",
        "Ruch na Stronę WWW", "Aktywność / Zaangażowanie Fanów", "Inny"
    ];

    const dataFormats = [
        "Excel / CSV", "Google Sheets", "Baza danych SQL",
        "API / JSON", "PDF / Dokumenty", "Inne (opisz w uwagach)"
    ];

    const analysisGoals = [
        "Raport z wnioskami", "Dashboard interaktywny",
        "Rekomendacje biznesowe", "Analiza konkurencji",
        "Audyt / przegląd", "Inne"
    ];

    const documentTypes = [
        "Regulamin strony / sklepu", "Polityka prywatności / RODO",
        "Umowa współpracy", "Ogólne warunki umowy (OWU)",
        "Regulamin konkursu / promocji", "Inny dokument prawny"
    ];

    const translationLanguages = [
        "Polski → Angielski", "Angielski → Polski",
        "Polski → Niemiecki", "Niemiecki → Polski",
        "Polski → Francuski", "Inny (wpisz w uwagach)"
    ];

    const translationDocTypes = [
        "Strona internetowa", "Dokumenty prawne / umowy",
        "Materiały marketingowe", "Dokumentacja techniczna",
        "Prezentacja / raport", "Inny"
    ];

    const copywritingTypes = [
        "Teksty na stronę WWW", "Blog / artykuły eksperckie",
        "Oferta handlowa / prezentacja", "Email marketing / newsletter",
        "Dokumentacja techniczna", "White paper / e-book", "Inny"
    ];

    const toneOfVoice = [
        "Profesjonalny / formalny", "Luźny / przyjazny",
        "Ekspercki / branżowy", "Sprzedażowy / perswazyjny",
        "Informacyjny / neutralny", "Inny"
    ];

    const officeWorkTypes = [
        "Transkrypcja audio/wideo", "Kosztorys / wycena",
        "Szablony dokumentów", "Wprowadzanie danych",
        "Analiza dokumentów", "Inne"
    ];

    const outputFormats = [
        "Microsoft Word (.docx)", "Microsoft Excel (.xlsx)",
        "PDF", "Google Docs / Sheets", "PowerPoint (.pptx)", "Inny"
    ];

    const websiteGoals = [
        "Strona wizytówkowa", "Strona sprzedażowa / e-commerce",
        "Landing page (kampania)", "Blog / portal treściowy",
        "Portfolio", "Aplikacja webowa", "Inna"
    ];

    return (
        <form action={handleSubmit} className="space-y-8 animate-in fade-in duration-700">

            {/* --- VIDEO / MULTIMEDIA SECTION --- */}
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
                            <Input id="materialsLink" name="materialsLink" defaultValue={initialData.materialsLink} placeholder="https://..." required className="h-11 bg-white border-slate-200 focus:border-indigo-500 transition-colors" />
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
                                        <input type="radio" name="format" value="9:16" className="peer sr-only"
                                            defaultChecked={initialData.format === "9:16" || (!initialData.format && !isYouTube)} />
                                        <div className="p-4 rounded-xl border-2 border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-white transition-all peer-checked:border-indigo-600 peer-checked:bg-white peer-checked:shadow-md flex flex-col items-center gap-2 text-center h-full">
                                            <Smartphone className="w-6 h-6 text-slate-400 mb-1" />
                                            <span className="font-medium text-slate-700 text-sm">Pionowo</span>
                                            <span className="text-xs text-slate-500">TikTok / Reels / Shorts</span>
                                        </div>
                                    </label>
                                    <label className="cursor-pointer group relative">
                                        <input type="radio" name="format" value="16:9" className="peer sr-only"
                                            defaultChecked={initialData.format === "16:9" || (!initialData.format && !!isYouTube)} />
                                        <div className="p-4 rounded-xl border-2 border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-white transition-all peer-checked:border-indigo-600 peer-checked:bg-white peer-checked:shadow-md flex flex-col items-center gap-2 text-center h-full">
                                            <MonitorPlay className="w-6 h-6 text-slate-400 mb-1" />
                                            <span className="font-medium text-slate-700 text-sm">Poziomo</span>
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
            {isLogo && !isVideo && (
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
                            <Label htmlFor="designInspiration" className="text-slate-700 font-medium">Przykłady / Inspiracje</Label>
                            <Textarea id="designInspiration" name="designInspiration" defaultValue={initialData.designInspiration} placeholder="Opisz lub wklej linki do projektów, które Ci się podobają..." className="min-h-[100px] bg-white border-slate-200" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* --- MARKETING SECTION --- */}
            {isMarketing && !isVideo && !isLogo && (
                <Card className="border-pink-100 shadow-lg shadow-pink-50 overflow-hidden bg-white/90 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-pink-50 to-white border-b border-pink-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
                                <Megaphone className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-pink-950 text-xl">Cele Kampanii / Strategii</CardTitle>
                                <CardDescription>Zdefiniuj grupę docelową i oczekiwane wyniki.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 space-y-6">
                        <div className="space-y-3">
                            <Label htmlFor="campaignGoal" className="text-slate-700 font-medium">Cel</Label>
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
                                <Input id="platforms" name="platforms" defaultValue={initialData.platforms} placeholder="np. Facebook + Instagram..." className="h-11 bg-white border-slate-200" />
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

            {/* --- IT / PROGRAMMING SECTION --- */}
            {isIT && !isVideo && !isLogo && !isMarketing && (
                <Card className="border-blue-100 shadow-lg shadow-blue-50 overflow-hidden bg-white/90 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-blue-950 text-xl">Wymagania Techniczne</CardTitle>
                                <CardDescription>Opisz obecny stan i oczekiwany rezultat.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 space-y-6">
                        <div className="space-y-3">
                            <Label htmlFor="currentState" className="text-slate-700 font-medium">Obecny stan / Co masz teraz? <span className="text-red-500">*</span></Label>
                            <Textarea id="currentState" name="currentState" defaultValue={initialData.currentState || initialData.processDesc} placeholder="Opisz obecne środowisko, stronę, system — co istnieje, a co wymaga zmiany..." className="min-h-[100px] bg-white border-slate-200" required />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="expectedEffect" className="text-slate-700 font-medium">Oczekiwany efekt <span className="text-red-500">*</span></Label>
                            <Textarea id="expectedEffect" name="expectedEffect" defaultValue={initialData.expectedEffect} placeholder="Co ma być efektem końcowym? Jakie funkcje, jakie zmiany?" className="min-h-[100px] bg-white border-slate-200" required />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="accessInfo" className="text-slate-700 font-medium">Dostępy (opcjonalnie)</Label>
                            <Input id="accessInfo" name="accessInfo" defaultValue={initialData.accessInfo} placeholder="Czy potrzebne będą dostępy do serwera / panelu / repo?" className="h-11 bg-white border-slate-200" />
                            <p className="text-xs text-slate-500">Nie wpisuj haseł — podaj je bezpiecznie przez czat po nawiązaniu współpracy.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* --- ANALYTICS / DATA SECTION --- */}
            {isAnalytics && !isIT && !isVideo && !isLogo && !isMarketing && (
                <Card className="border-amber-100 shadow-lg shadow-amber-50 overflow-hidden bg-white/90 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b border-amber-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-amber-950 text-xl">Szczegóły Analizy</CardTitle>
                                <CardDescription>Określ źródło danych i cel analizy.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label htmlFor="dataFormat" className="text-slate-700 font-medium">Format danych źródłowych</Label>
                                <Select name="dataFormat" defaultValue={initialData.dataFormat || ""}>
                                    <SelectTrigger className="h-11 bg-white border-slate-200">
                                        <SelectValue placeholder="W jakim formacie masz dane?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dataFormats.map(opt => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="analysisGoal" className="text-slate-700 font-medium">Cel analizy</Label>
                                <Select name="analysisGoal" defaultValue={initialData.analysisGoal || ""}>
                                    <SelectTrigger className="h-11 bg-white border-slate-200">
                                        <SelectValue placeholder="Jaki efekt chcesz uzyskać?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {analysisGoals.map(opt => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="dataDescription" className="text-slate-700 font-medium">Opis danych <span className="text-red-500">*</span></Label>
                            <Textarea id="dataDescription" name="dataDescription" defaultValue={initialData.dataDescription} placeholder="Opisz jakie dane posiadasz, co mierzysz, na jakie pytania szukasz odpowiedzi..." className="min-h-[100px] bg-white border-slate-200" required />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="materialsLink" className="text-slate-700 font-medium">Link do danych (opcjonalnie)</Label>
                            <Input id="materialsLink" name="materialsLink" defaultValue={initialData.materialsLink} placeholder="Google Drive / Dropbox z plikami..." className="h-11 bg-white border-slate-200" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* --- TRANSLATION SECTION --- */}
            {isTranslation && !isAnalytics && !isIT && !isVideo && !isLogo && !isMarketing && (
                <Card className="border-green-100 shadow-lg shadow-green-50 overflow-hidden bg-white/90 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                <Languages className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-green-950 text-xl">Szczegóły Tłumaczenia</CardTitle>
                                <CardDescription>Określ język, typ dokumentu i objętość.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label htmlFor="languagePair" className="text-slate-700 font-medium">Para językowa</Label>
                                <Select name="languagePair" defaultValue={initialData.languagePair || ""}>
                                    <SelectTrigger className="h-11 bg-white border-slate-200">
                                        <SelectValue placeholder="Wybierz języki..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {translationLanguages.map(opt => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="docType" className="text-slate-700 font-medium">Typ dokumentu</Label>
                                <Select name="docType" defaultValue={initialData.docType || ""}>
                                    <SelectTrigger className="h-11 bg-white border-slate-200">
                                        <SelectValue placeholder="Co tłumaczymy?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {translationDocTypes.map(opt => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="textVolume" className="text-slate-700 font-medium">Objętość tekstu</Label>
                            <Input id="textVolume" name="textVolume" defaultValue={initialData.textVolume} placeholder="np. 10 stron A4, 5000 słów, 3 podstrony..." className="h-11 bg-white border-slate-200" />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="materialsLink" className="text-slate-700 font-medium">Link do dokumentów <span className="text-red-500">*</span></Label>
                            <Input id="materialsLink" name="materialsLink" defaultValue={initialData.materialsLink} placeholder="Google Drive / Dropbox z plikami do tłumaczenia..." className="h-11 bg-white border-slate-200" required />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* --- COPYWRITING SECTION --- */}
            {isCopywriting && !isTranslation && !isAnalytics && !isIT && !isVideo && !isLogo && !isMarketing && (
                <Card className="border-emerald-100 shadow-lg shadow-emerald-50 overflow-hidden bg-white/90 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                <PenTool className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-emerald-950 text-xl">Brief Copywritera</CardTitle>
                                <CardDescription>Określ typ treści, ton i grupę docelową.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label htmlFor="contentType" className="text-slate-700 font-medium">Typ treści</Label>
                                <Select name="contentType" defaultValue={initialData.contentType || ""}>
                                    <SelectTrigger className="h-11 bg-white border-slate-200">
                                        <SelectValue placeholder="Co piszemy?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {copywritingTypes.map(opt => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="tone" className="text-slate-700 font-medium">Ton komunikacji</Label>
                                <Select name="tone" defaultValue={initialData.tone || ""}>
                                    <SelectTrigger className="h-11 bg-white border-slate-200">
                                        <SelectValue placeholder="Jak ma brzmieć tekst?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {toneOfVoice.map(opt => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="targetGroup" className="text-slate-700 font-medium">Grupa docelowa</Label>
                            <Select name="targetGroup" defaultValue={initialData.targetGroup || ""}>
                                <SelectTrigger className="h-11 bg-white border-slate-200">
                                    <SelectValue placeholder="Kto to będzie czytał?" />
                                </SelectTrigger>
                                <SelectContent>
                                    {targetGroups.map(opt => (
                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="copyBrief" className="text-slate-700 font-medium">Opis zlecenia <span className="text-red-500">*</span></Label>
                            <Textarea id="copyBrief" name="copyBrief" defaultValue={initialData.copyBrief} placeholder="O czym mają być teksty? Jaki przekaz? Jakie CTA?" className="min-h-[100px] bg-white border-slate-200" required />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* --- OFFICE WORK SECTION --- */}
            {isOfficeWork && !isCopywriting && !isTranslation && !isAnalytics && !isIT && !isVideo && !isLogo && !isMarketing && (
                <Card className="border-stone-200 shadow-lg shadow-stone-50 overflow-hidden bg-white/90 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-stone-50 to-white border-b border-stone-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-stone-950 text-xl">Szczegóły Zlecenia</CardTitle>
                                <CardDescription>Określ rodzaj pracy i format materiałów.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label htmlFor="workType" className="text-slate-700 font-medium">Rodzaj pracy</Label>
                                <Select name="workType" defaultValue={initialData.workType || ""}>
                                    <SelectTrigger className="h-11 bg-white border-slate-200">
                                        <SelectValue placeholder="Co robimy?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {officeWorkTypes.map(opt => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="outputFormat" className="text-slate-700 font-medium">Format wyjściowy</Label>
                                <Select name="outputFormat" defaultValue={initialData.outputFormat || ""}>
                                    <SelectTrigger className="h-11 bg-white border-slate-200">
                                        <SelectValue placeholder="W jakim formacie dostarczyć?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {outputFormats.map(opt => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="materialsLink" className="text-slate-700 font-medium">Link do materiałów źródłowych <span className="text-red-500">*</span></Label>
                            <Input id="materialsLink" name="materialsLink" defaultValue={initialData.materialsLink} placeholder="Google Drive / Dropbox z plikami..." className="h-11 bg-white border-slate-200" required />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="workDescription" className="text-slate-700 font-medium">Opis zadania</Label>
                            <Textarea id="workDescription" name="workDescription" defaultValue={initialData.workDescription} placeholder="Opisz co dokładnie trzeba zrobić z materiałami..." className="min-h-[100px] bg-white border-slate-200" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* --- LEGAL SECTION --- */}
            {isLegal && !isOfficeWork && !isCopywriting && !isTranslation && !isAnalytics && !isIT && !isVideo && !isLogo && !isMarketing && (
                <Card className="border-slate-200 shadow-lg shadow-slate-50 overflow-hidden bg-white/90 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-slate-100 to-white border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-200 rounded-lg text-slate-700">
                                <Scale className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-slate-950 text-xl">Zakres Dokumentu Prawnego</CardTitle>
                                <CardDescription>Określ rodzaj dokumentu i branżę.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label htmlFor="legalDocType" className="text-slate-700 font-medium">Rodzaj dokumentu</Label>
                                <Select name="legalDocType" defaultValue={initialData.legalDocType || ""}>
                                    <SelectTrigger className="h-11 bg-white border-slate-200">
                                        <SelectValue placeholder="Co przygotowujemy?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {documentTypes.map(opt => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="industry" className="text-slate-700 font-medium">Branża firmy</Label>
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
                        <div className="space-y-3">
                            <Label htmlFor="legalScope" className="text-slate-700 font-medium">Zakres i kontekst <span className="text-red-500">*</span></Label>
                            <Textarea id="legalScope" name="legalScope" defaultValue={initialData.legalScope} placeholder="Opisz czego dotyczy dokument, czy to nowy czy aktualizacja istniejącego, jakie są kluczowe wymagania..." className="min-h-[100px] bg-white border-slate-200" required />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="existingDocLink" className="text-slate-700 font-medium">Istniejący dokument (opcjonalnie)</Label>
                            <Input id="existingDocLink" name="existingDocLink" defaultValue={initialData.existingDocLink} placeholder="Link do obecnego regulaminu / umowy do aktualizacji..." className="h-11 bg-white border-slate-200" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* --- FALLBACK: UNIVERSAL FORM (when no specific category matches) --- */}
            {!hasSpecificForm && (
                <Card className="border-indigo-100 shadow-lg shadow-indigo-50 overflow-hidden bg-white/90 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-indigo-950 text-xl">Opis Zlecenia</CardTitle>
                                <CardDescription>Opisz czego potrzebujesz — im więcej szczegółów, tym lepszy efekt.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 space-y-6">
                        <div className="space-y-3">
                            <Label htmlFor="projectDescription" className="text-slate-700 font-medium">Czego potrzebujesz? <span className="text-red-500">*</span></Label>
                            <Textarea id="projectDescription" name="projectDescription" defaultValue={initialData.projectDescription} placeholder="Opisz jak najdokładniej czego oczekujesz — cel, zakres, oczekiwany efekt..." className="min-h-[120px] bg-white border-slate-200" required />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="materialsLink" className="text-slate-700 font-medium">Link do materiałów (opcjonalnie)</Label>
                            <Input id="materialsLink" name="materialsLink" defaultValue={initialData.materialsLink} placeholder="Google Drive / Dropbox z materiałami..." className="h-11 bg-white border-slate-200" />
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
