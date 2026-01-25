"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createServiceAction, updateServiceAction } from "../_actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ImageUpload from "@/components/image-upload";
import { Badge } from "@/components/ui/badge";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ServiceFormProps {
    initialData?: any;
    isEditing?: boolean;
}

export default function ServiceForm({ initialData, isEditing = false }: ServiceFormProps) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [galleryUrls, setGalleryUrls] = useState<string[]>(initialData?.gallery_urls || []);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(initialData?.categories || []);
    const [questions, setQuestions] = useState<{ id: string; label: string }[]>(
        initialData?.form_schema
            ? (Array.isArray(initialData.form_schema) ? initialData.form_schema.map((q: any) => ({ id: q.id, label: q.label })) : [])
            : []
    );
    const [enableQuestions, setEnableQuestions] = useState(questions.length > 0);

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const addQuestion = () => {
        const newId = Math.random().toString(36).substring(2, 9).toUpperCase();
        setQuestions([...questions, { id: newId, label: "" }]);
    };

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const updateQuestion = (id: string, label: string) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, label } : q));
    };

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        const formData = new FormData(e.currentTarget);
        const portfolioRaw = formData.get("portfolio_items") as string;
        const portfolio_items = portfolioRaw
            ? portfolioRaw.split(',').map(s => s.trim()).filter(Boolean)
            : [];

        // Build form_schema
        const form_schema = enableQuestions
            ? questions.filter(q => q.label.trim().length > 0).map(q => ({
                id: q.id,
                label: q.label,
                type: "text", // Default to text input
                options: []
            }))
            : [];

        const data = {
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            price: Number(formData.get("price")),
            price_max: formData.get("price_max") ? Number(formData.get("price_max")) : null,
            delivery_time_days: Number(formData.get("delivery_time_days")),
            requirements: formData.get("requirements") as string,
            status: "active",
            portfolio_items,
            gallery_urls: galleryUrls,
            categories: selectedCategories,
            form_schema: form_schema,
        };

        startTransition(async () => {
            try {
                if (isEditing && initialData?.id) {
                    await updateServiceAction(initialData.id, data);
                } else {
                    await createServiceAction(data);
                }
                router.push("/app/services/my");
                router.refresh();
            } catch (err: any) {
                setError(err.message);
            }
        });
    }

    return (
        <form onSubmit={onSubmit} className="space-y-6 bg-white p-6 rounded-lg border shadow-sm">
            {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm border border-red-100">
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="title">Tytuł usługi</Label>
                <Input
                    id="title"
                    name="title"
                    required
                    defaultValue={initialData?.title}
                    placeholder="np. Projekt logo, Tłumaczenie CV"
                />
            </div>

            <div className="space-y-2">
                <Label>Kategorie</Label>
                <div className="flex flex-wrap gap-2 pt-2">
                    {SERVICE_CATEGORIES.map((cat) => (
                        <div
                            key={cat}
                            className={cn(
                                "cursor-pointer py-1.5 px-3 rounded-full text-xs font-medium border transition-all select-none",
                                selectedCategories.includes(cat)
                                    ? "bg-indigo-600 border-indigo-600 text-white"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                            )}
                            onClick={() => toggleCategory(cat)}
                        >
                            {cat}
                        </div>
                    ))}
                </div>
                {selectedCategories.length === 0 && (
                    <p className="text-xs text-amber-600 pt-1">Wybierz przynajmniej jedną kategorię, aby dać się znaleźć.</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Opis</Label>
                <Textarea
                    id="description"
                    name="description"
                    rows={4}
                    defaultValue={initialData?.description}
                    placeholder="Opisz dokładnie, co oferujesz w ramach tego pakietu..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="price">Cena min. / Szacowana</Label>
                    <Input
                        id="price"
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        defaultValue={initialData?.price}
                        placeholder="od..."
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="price_max">Cena max. (Opcjonalnie)</Label>
                    <Input
                        id="price_max"
                        name="price_max"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={initialData?.price_max}
                        placeholder="do..."
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="delivery_time_days">Czas realizacji (dni)</Label>
                    <Input
                        id="delivery_time_days"
                        name="delivery_time_days"
                        type="number"
                        min="1"
                        required
                        defaultValue={initialData?.delivery_time_days ?? 3}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="portfolio_items">Realizacje (Opcjonalne)</Label>
                <p className="text-xs text-muted-foreground">Dodaj linki do swoich prac (oddzielone przecinkami).</p>
                <Textarea
                    id="portfolio_items"
                    name="portfolio_items"
                    rows={3}
                    className="font-mono text-sm"
                    defaultValue={initialData?.portfolio_items?.join(", ")}
                    placeholder="https://behance.net/..., https://dribbble.com/..."
                />
            </div>

            <div className="space-y-2">
                <Label>Galeria / Portfolio</Label>
                <div className="bg-slate-50 border border-dashed rounded-lg p-6">
                    <ImageUpload
                        value={galleryUrls}
                        onChange={setGalleryUrls}
                        folder="portfolio"
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Wgraj zdjęcia swoich realizacji, aby zachęcić klientów.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="requirements">Wymagania od klienta (Opis ogólny)</Label>
                <p className="text-xs text-muted-foreground">Opisz, czego potrzebujesz, aby zacząć pracę (np. logo, teksty, dostęp do kont).</p>
                <Textarea
                    id="requirements"
                    name="requirements"
                    rows={4}
                    defaultValue={initialData?.requirements}
                    placeholder="Aby zrealizować zlecenie, będziemy potrzebować..."
                    className="bg-indigo-50/30 border-indigo-100 focus:border-indigo-500"
                />
            </div>

            {/* Personalizowane Pytania */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="enable_questions"
                        checked={enableQuestions}
                        onChange={(e) => setEnableQuestions(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <Label htmlFor="enable_questions" className="font-semibold text-slate-800 cursor-pointer">
                        Zadaj konkretne pytania do wyceny
                    </Label>
                </div>

                {enableQuestions && (
                    <div className="space-y-3 pl-6 animate-in slide-in-from-top-2 duration-300">
                        <p className="text-sm text-slate-500">
                            Dodaj pytania, na które firma musi odpowiedzieć przed wysłaniem zapytania.
                        </p>

                        {questions.map((q, idx) => (
                            <div key={q.id} className="flex gap-2 items-center">
                                <span className="text-sm font-mono text-slate-400 w-6">{idx + 1}.</span>
                                <Input
                                    value={q.label}
                                    onChange={(e) => updateQuestion(q.id, e.target.value)}
                                    placeholder="np. Jak duża jest firma? / Jaki jest budżet?"
                                    className="flex-1"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeQuestion(q.id)}
                                    className="text-slate-400 hover:text-red-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                </Button>
                            </div>
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addQuestion}
                            className="mt-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                        >
                            + Dodaj kolejne pytanie
                        </Button>
                    </div>
                )}
            </div>

            <Button type="submit" disabled={pending} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {pending ? "Zapisywanie..." : (isEditing ? "Zapisz Zmiany" : "Utwórz Usługę")}
            </Button>
        </form>
    );
}
