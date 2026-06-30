"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createServiceAction, updateServiceAction } from "../_actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ImageUpload from "@/components/image-upload";
import { JOB_CATEGORY_GROUPS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type ServiceQuestionDraft = {
  id: string;
  label: string;
};

type ServiceFormInitialData = {
  id?: string;
  title?: string;
  description?: string | null;
  price?: number | null;
  price_max?: number | null;
  delivery_time_days?: number | null;
  requirements?: string | null;
  gallery_urls?: string[] | null;
  categories?: string[] | null;
  portfolio_items?: string[] | null;
  form_schema?: Array<{ id?: string; label?: string | null }> | null;
};

interface ServiceFormProps {
  initialData?: ServiceFormInitialData;
  isEditing?: boolean;
}

export default function ServiceForm({ initialData, isEditing = false }: ServiceFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>(initialData?.gallery_urls || []);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialData?.categories || []);
  const [questions, setQuestions] = useState<ServiceQuestionDraft[]>(
    initialData?.form_schema && Array.isArray(initialData.form_schema)
      ? initialData.form_schema
        .filter((question): question is { id: string; label?: string | null } => typeof question?.id === "string")
        .map((question) => ({ id: question.id, label: question.label ?? "" }))
      : [],
  );
  const [enableQuestions, setEnableQuestions] = useState(questions.length > 0);

  const inputClass =
    "h-12 rounded-2xl border-slate-200 bg-slate-50/80 px-4 text-sm font-semibold text-slate-900 shadow-inner shadow-slate-200/40 placeholder:text-slate-400 focus-visible:ring-lime-200";
  const textareaClass =
    "rounded-2xl border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold leading-6 text-slate-900 shadow-inner shadow-slate-200/40 placeholder:text-slate-400 focus-visible:ring-lime-200";
  const labelClass = "text-xs font-black uppercase tracking-normal text-slate-500";

  const getSubcategoryLabels = (categoryLabel: string): string[] =>
    JOB_CATEGORY_GROUPS.find((category) => category.label === categoryLabel)?.subcategories.map(
      (subcategory) => subcategory.label,
    ) ?? [];

  const isCategorySelected = (categoryLabel: string) => selectedCategories.includes(categoryLabel);
  const isSubcategorySelected = (subcategoryLabel: string) => selectedCategories.includes(subcategoryLabel);

  const toggleCategory = (categoryLabel: string) => {
    const subcategoryLabels = getSubcategoryLabels(categoryLabel);

    setSelectedCategories((prev) => {
      if (prev.includes(categoryLabel)) {
        return prev.filter(
          (item) => item !== categoryLabel && !subcategoryLabels.includes(item),
        );
      }

      return Array.from(new Set([...prev, categoryLabel]));
    });
  };

  const toggleSubcategory = (categoryLabel: string, subcategoryLabel: string) => {
    setSelectedCategories((prev) => {
      const base = prev.includes(categoryLabel) ? prev : [...prev, categoryLabel];

      if (prev.includes(subcategoryLabel)) {
        return base.filter((item) => item !== subcategoryLabel);
      }

      return Array.from(new Set([...base, subcategoryLabel]));
    });
  };

  const addQuestion = () => {
    const newId = Math.random().toString(36).substring(2, 9).toUpperCase();
    setQuestions((prev) => [...prev, { id: newId, label: "" }]);
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((question) => question.id !== id));
  };

  const updateQuestion = (id: string, label: string) => {
    setQuestions((prev) =>
      prev.map((question) => question.id === id ? { ...question, label } : question),
    );
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const portfolioRaw = formData.get("portfolio_items") as string;
    const portfolio_items = portfolioRaw
      ? portfolioRaw.split(",").map((item) => item.trim()).filter(Boolean)
      : [];

    const form_schema = enableQuestions
      ? questions.filter((question) => question.label.trim().length > 0).map((question) => ({
        id: question.id,
        label: question.label,
        type: "text",
        options: [],
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
      form_schema,
    };

    startTransition(async () => {
      try {
        if (isEditing && initialData?.id) {
          await updateServiceAction(initialData.id, data);
        } else {
          await createServiceAction(data);
        }
        router.push(`/app/services/my?saved=${isEditing ? "updated" : "created"}`);
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Nie udało się zapisać usługi.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title" className={labelClass}>Tytuł usługi</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={initialData?.title ?? ""}
          placeholder="np. Projekt logo, tłumaczenie CV"
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <Label className={labelClass}>Kategorie</Label>
        <div className="space-y-3 pt-2">
          {JOB_CATEGORY_GROUPS.map((category) => {
            const subcategories = getSubcategoryLabels(category.label);
            const selected = isCategorySelected(category.label);

            return (
              <div
                key={category.slug}
                className={cn(
                  "rounded-2xl border transition-colors",
                  selected ? "border-lime-300 bg-lime-50" : "border-slate-200 bg-white",
                )}
              >
                <button
                  type="button"
                  className={cn(
                    "flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition-colors",
                    selected
                      ? "text-[#0b1b47]"
                      : "text-slate-700 hover:bg-lime-50 hover:text-[#10245f]",
                  )}
                  onClick={() => toggleCategory(category.label)}
                  aria-pressed={selected}
                >
                  <span className="break-words">{category.label}</span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-1 text-[10px] uppercase tracking-normal",
                      selected ? "border-lime-300 bg-lime-200 text-[#0b1b47]" : "border-slate-200 text-slate-400",
                    )}
                  >
                    {selected ? "Wybrano" : "Wybierz"}
                  </span>
                </button>

                {selected && subcategories.length > 0 && (
                  <div className="space-y-2 border-t border-lime-100 px-4 pb-4 pt-2">
                    <p className="text-xs font-semibold text-slate-500">
                      Doprecyzuj podkategorię, jeśli pasuje do usługi.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {subcategories.map((subcategory) => (
                        <button
                          key={subcategory}
                          type="button"
                          className={cn(
                            "max-w-full select-none rounded-full border px-3 py-2 text-xs font-bold transition-all",
                            isSubcategorySelected(subcategory)
                              ? "border-[#10245f] bg-[#10245f] text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-lime-200 hover:bg-lime-100 hover:text-[#10245f]",
                          )}
                          onClick={() => toggleSubcategory(category.label, subcategory)}
                          aria-pressed={isSubcategorySelected(subcategory)}
                        >
                          {subcategory}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {selectedCategories.length === 0 && (
          <p className="pt-1 text-xs font-semibold text-amber-600">
            Wybierz przynajmniej jedną kategorię, aby dać się znaleźć.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className={labelClass}>Opis</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={initialData?.description ?? ""}
          placeholder="Opisz dokładnie, co oferujesz w ramach tego pakietu..."
          className={textareaClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
        <Label htmlFor="price" className="text-xs font-black uppercase tracking-normal text-slate-500">Cena min. / szacowana</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={initialData?.price ?? undefined}
            placeholder="od..."
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price_max" className="text-xs font-black uppercase tracking-normal text-slate-500">Cena max. opcjonalnie</Label>
          <Input
            id="price_max"
            name="price_max"
            type="number"
            min="0"
            step="0.01"
            defaultValue={initialData?.price_max ?? undefined}
            placeholder="do..."
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="delivery_time_days" className="text-xs font-black uppercase tracking-normal text-slate-500">Czas realizacji</Label>
          <Input
            id="delivery_time_days"
            name="delivery_time_days"
            type="number"
            min="1"
            required
            defaultValue={initialData?.delivery_time_days ?? 3}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="portfolio_items" className={labelClass}>Realizacje opcjonalne</Label>
        <p className="text-xs font-semibold text-slate-500">Dodaj linki do swoich prac, oddzielając je przecinkami.</p>
        <Textarea
          id="portfolio_items"
          name="portfolio_items"
          rows={3}
          className={cn(textareaClass, "font-mono")}
          defaultValue={initialData?.portfolio_items?.join(", ")}
          placeholder="https://behance.net/..., https://dribbble.com/..."
        />
      </div>

      <div className="space-y-2">
        <Label className={labelClass}>Galeria / portfolio</Label>
        <div className="max-w-full overflow-hidden rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/80 p-4 sm:p-6">
          <ImageUpload
            value={galleryUrls}
            onChange={setGalleryUrls}
            folder="portfolio"
          />
        </div>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          Wgraj zdjęcia swoich realizacji, aby zachęcić klientów.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="requirements" className={labelClass}>Wymagania od klienta</Label>
        <p className="text-xs font-semibold text-slate-500">
          Opisz, czego potrzebujesz, aby zacząć pracę, np. logo, teksty albo dostęp do kont.
        </p>
        <Textarea
          id="requirements"
          name="requirements"
          rows={4}
          defaultValue={initialData?.requirements ?? ""}
          placeholder="Aby zrealizować zlecenie, będziemy potrzebować..."
          className={cn(textareaClass, "border-lime-100 bg-lime-50/40 focus-visible:ring-lime-200")}
        />
      </div>

      <div className="space-y-4 rounded-[1.5rem] border border-slate-100 bg-slate-50/60 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="enable_questions"
            checked={enableQuestions}
            onChange={(e) => setEnableQuestions(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-[#10245f] focus:ring-lime-200"
          />
          <Label htmlFor="enable_questions" className="cursor-pointer font-black text-[#10245f]">
            Zadaj konkretne pytania do wyceny
          </Label>
        </div>

        {enableQuestions && (
          <div className="animate-in space-y-3 pl-0 duration-300 slide-in-from-top-2 sm:pl-6">
            <p className="text-sm font-medium text-slate-500">
              Dodaj pytania, na które firma musi odpowiedzieć przed wysłaniem zapytania.
            </p>

            {questions.map((question, idx) => (
              <div key={question.id} className="flex items-center gap-2">
                <span className="w-6 text-sm font-mono text-slate-400">{idx + 1}.</span>
                <Input
                  value={question.label}
                  onChange={(e) => updateQuestion(question.id, e.target.value)}
                  placeholder="np. Jak duża jest firma? / Jaki jest budżet?"
                  className={cn(inputClass, "flex-1")}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeQuestion(question.id)}
                  className="rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addQuestion}
              className="mt-2 rounded-xl border-slate-200 bg-white font-bold text-[#10245f] hover:border-lime-200 hover:bg-lime-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              Dodaj kolejne pytanie
            </Button>
          </div>
        )}
      </div>

      <Button type="submit" disabled={pending} className="h-12 w-full rounded-2xl bg-[#10245f] text-sm font-black text-white shadow-sm transition hover:bg-[#0b1b47]">
        {pending ? "Zapisywanie..." : (isEditing ? "Zapisz zmiany" : "Utwórz usługę")}
      </Button>
    </form>
  );
}
