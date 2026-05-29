"use client";

import { useMemo, useState } from "react";
import { createSystemService, updateSystemService } from "../_actions";
import { normalizePackageVariants, type PackageVariant } from "@/lib/services/package-customization";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Zap, Loader2, UploadCloud, CheckCircle2, DollarSign, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type SystemServiceInitialData = {
  id?: string;
  title?: string | null;
  category?: string | null;
  description?: string | null;
  price?: number | null;
  delivery_time_days?: number | null;
  locked_content?: string | null;
  variants?: unknown;
};

type VariantDraft = {
  id: string;
  name: string;
  label: string;
  price: string;
  delivery_time_days: string;
  is_recommended: boolean;
  raw: Record<string, unknown>;
};

interface SystemServiceFormProps {
  initialData?: SystemServiceInitialData;
  offerId?: string;
}

function createDraftFromVariant(variant: PackageVariant): VariantDraft {
  return {
    id: variant.name.toLowerCase(),
    name: variant.name,
    label: variant.label,
    price: String(variant.price),
    delivery_time_days: variant.delivery_time_days ? String(variant.delivery_time_days) : "",
    is_recommended: Boolean(variant.is_recommended),
    raw: { ...variant },
  };
}

function createEmptyVariant(index: number): VariantDraft {
  const fallbackName = `variant_${index + 1}`;
  return {
    id: fallbackName,
    name: fallbackName,
    label: `Wariant ${index + 1}`,
    price: "",
    delivery_time_days: "",
    is_recommended: false,
    raw: {},
  };
}

function buildRawVariantMap(value: unknown) {
  const map = new Map<string, Record<string, unknown>>();
  if (!Array.isArray(value)) return map;

  value.forEach((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return;
    const variant = entry as Record<string, unknown>;
    const name = typeof variant.name === "string" ? variant.name.trim() : "";
    if (!name) return;
    map.set(name, { ...variant });
  });

  return map;
}

export default function SystemServiceForm({ initialData, offerId }: SystemServiceFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedInitialVariants = useMemo(
    () => normalizePackageVariants(initialData?.variants),
    [initialData?.variants],
  );
  const rawVariantMap = useMemo(
    () => buildRawVariantMap(initialData?.variants),
    [initialData?.variants],
  );

  const [isVariantMode, setIsVariantMode] = useState(parsedInitialVariants.length > 0);
  const [variants, setVariants] = useState<VariantDraft[]>(
    parsedInitialVariants.map((variant) => ({
      ...createDraftFromVariant(variant),
      raw: rawVariantMap.get(variant.name) ?? { ...variant },
    })),
  );

  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    tytul: initialData?.title || "",
    kategoria: initialData?.category || "IT - Rozwoj oprogramowania",
    opis: initialData?.description || "",
    stawka: initialData?.price ? String(initialData.price) : "",
    czas: initialData?.delivery_time_days ? String(initialData.delivery_time_days) : "",
    materialy_link: "",
    materialy_opis: initialData?.locked_content || "",
  });

  const variantSummary = useMemo(() => {
    if (!isVariantMode || variants.length === 0) return null;
    const prices = variants
      .map((variant) => Number(variant.price))
      .filter((price) => Number.isFinite(price) && price > 0);

    if (prices.length === 0) return null;

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return {
      minPrice,
      maxPrice,
      label: minPrice === maxPrice ? `${minPrice} PLN` : `${minPrice} - ${maxPrice} PLN`,
    };
  }, [isVariantMode, variants]);

  const inputClassName =
    "h-11 rounded-lg border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-0";
  const textareaClassName =
    "rounded-lg border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-0";

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateVariant = (variantId: string, field: keyof VariantDraft, value: string | boolean) => {
    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id !== variantId) return variant;
        return {
          ...variant,
          [field]: value,
        };
      }),
    );
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, createEmptyVariant(prev.length)]);
  };

  const removeVariant = (variantId: string) => {
    setVariants((prev) => prev.filter((variant) => variant.id !== variantId));
  };

  const markRecommended = (variantId: string) => {
    setVariants((prev) =>
      prev.map((variant) => ({
        ...variant,
        is_recommended: variant.id === variantId,
      })),
    );
  };

  const toggleVariantMode = (enabled: boolean) => {
    setIsVariantMode(enabled);
    if (enabled && variants.length === 0) {
      setVariants([createEmptyVariant(0)]);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const supabase = createClient();
      const filename = `params/${Date.now()}-${file.name.replace(/\s/g, "_")}`;

      const { data, error: uploadError } = await supabase.storage
        .from("offer_attachments")
        .upload(filename, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("offer_attachments").getPublicUrl(data.path);

      setUploadedFileUrl(publicUrl);
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Nieznany blad";
      setError(`Blad przesylania pliku: ${message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const buildVariantsPayload = () => {
    return variants
      .map((variant) => {
        const parsedPrice = Number(variant.price.replace(",", "."));
        const parsedDays = Number.parseInt(variant.delivery_time_days, 10);
        const name = variant.name.trim();
        const label = variant.label.trim() || name;

        if (!name || !label || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
          return null;
        }

        const payload: Record<string, unknown> = {
          ...variant.raw,
          name,
          label,
          price: Number(parsedPrice.toFixed(2)),
          is_recommended: variant.is_recommended,
        };

        if (Number.isFinite(parsedDays) && parsedDays > 0) {
          payload.delivery_time_days = parsedDays;
        } else {
          delete payload.delivery_time_days;
        }

        return payload;
      })
      .filter((variant): variant is Record<string, unknown> => Boolean(variant));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const fd = new FormData();
    fd.append("is_platform_service", "on");
    fd.append("typ", "micro");
    fd.append("tytul", formData.tytul);
    fd.append("kategoria", formData.kategoria);
    fd.append("opis", formData.opis);
    fd.append("czas", formData.czas);

    if (!isVariantMode) {
      fd.append("stawka", formData.stawka);
    } else {
      const variantsPayload = buildVariantsPayload();
      if (variantsPayload.length === 0) {
        setError("Warianty musza miec nazwe i poprawna cene.");
        setIsLoading(false);
        return;
      }

      if (!variantsPayload.some((variant) => Boolean(variant.is_recommended))) {
        variantsPayload[0].is_recommended = true;
      }

      fd.append("variants_json", JSON.stringify(variantsPayload));
    }

    let lockedContent = formData.materialy_opis.trim();
    if (formData.materialy_link.trim()) {
      lockedContent += `${lockedContent ? "\n\n" : ""}[LINK DO MATERIALOW]: ${formData.materialy_link.trim()}`;
    }
    if (uploadedFileUrl) {
      lockedContent += `${lockedContent ? "\n\n" : ""}[ZALACZONY PLIK]: ${uploadedFileUrl}`;
    }
    fd.append("obligations", lockedContent);

    try {
      if (offerId) {
        await updateSystemService(offerId, fd);
      } else {
        await createSystemService(fd);
        router.push("/app/admin/system-services");
      }
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Nieznany blad";
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-slate-900">
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-3">
        <p className="text-sm font-semibold text-indigo-900">Panel edycji uslugi systemowej</p>
        <p className="mt-1 text-sm text-indigo-700">
          W tym miejscu ustawiasz publiczny opis, cene (lub warianty) i materialy tylko dla wykonawcy.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Zap className="h-5 w-5 text-amber-500" /> Podstawowe informacje
              </h3>
            </div>
            <CardContent className="space-y-5 p-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Tytul uslugi</Label>
                <Input
                  className={cn(inputClassName, "h-12 text-base font-semibold")}
                  placeholder="np. Miesieczny pakiet social media"
                  required
                  value={formData.tytul}
                  onChange={(event) => handleChange("tytul", event.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Kategoria</Label>
                  <select
                    className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.kategoria}
                    onChange={(event) => handleChange("kategoria", event.target.value)}
                  >
                    <option value="IT - Rozwoj oprogramowania">IT - Rozwoj oprogramowania</option>
                    <option value="Grafika & Design">Grafika & Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Copywriting">Copywriting</option>
                    <option value="Inne">Inne</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Termin realizacji (dni)</Label>
                  <Input
                    className={inputClassName}
                    placeholder="np. 7"
                    value={formData.czas}
                    onChange={(event) => handleChange("czas", event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Opis publiczny</Label>
                <Textarea
                  className={cn(textareaClassName, "min-h-[320px] p-4 text-sm leading-7")}
                  placeholder="Opisz na czym polega usluga i co firma dostaje."
                  required
                  value={formData.opis}
                  onChange={(event) => handleChange("opis", event.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm">
            <div className="border-b border-indigo-100 bg-indigo-50/60 px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-bold text-slate-900">Warianty i ceny</h3>
                <label className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isVariantMode}
                    onChange={(event) => toggleVariantMode(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Tryb wariantowy
                </label>
              </div>
            </div>
            <CardContent className="space-y-4 p-6">
              {!isVariantMode ? (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Stawka (PLN)</Label>
                  <Input
                    type="number"
                    className={cn(inputClassName, "max-w-xs")}
                    placeholder="np. 699"
                    value={formData.stawka}
                    onChange={(event) => handleChange("stawka", event.target.value)}
                    required
                  />
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-600">
                    Ceny glowne beda liczone automatycznie na podstawie wariantow.
                  </p>

                  <div className="space-y-4">
                    {variants.map((variant, index) => (
                      <div key={variant.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Wariant {index + 1}
                        </div>
                        <div className="grid gap-3 lg:grid-cols-4">
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                              Nazwa techniczna
                            </Label>
                            <Input
                              className={inputClassName}
                              value={variant.name}
                              onChange={(event) => updateVariant(variant.id, "name", event.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                              Etykieta
                            </Label>
                            <Input
                              className={inputClassName}
                              value={variant.label}
                              onChange={(event) => updateVariant(variant.id, "label", event.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                              Cena (PLN)
                            </Label>
                            <Input
                              className={inputClassName}
                              type="number"
                              value={variant.price}
                              onChange={(event) => updateVariant(variant.id, "price", event.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                              Termin (dni)
                            </Label>
                            <Input
                              className={inputClassName}
                              type="number"
                              value={variant.delivery_time_days}
                              onChange={(event) => updateVariant(variant.id, "delivery_time_days", event.target.value)}
                            />
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                          <Button
                            type="button"
                            variant={variant.is_recommended ? "default" : "outline"}
                            className={cn(
                              "h-9 rounded-lg text-xs font-semibold",
                              variant.is_recommended && "bg-indigo-600 text-white hover:bg-indigo-700",
                            )}
                            onClick={() => markRecommended(variant.id)}
                          >
                            {variant.is_recommended ? "Wariant polecany" : "Ustaw jako polecany"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-9 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => removeVariant(variant.id)}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Usun
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <Button type="button" variant="outline" className="rounded-lg border-slate-300" onClick={addVariant}>
                      <Plus className="mr-2 h-4 w-4" /> Dodaj wariant
                    </Button>
                    <p className="text-sm font-semibold text-slate-700">
                      Zakres ceny: {variantSummary?.label ?? "uzupelnij ceny wariantow"}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/30 shadow-sm">
            <div className="border-b border-amber-200/60 bg-amber-100/50 px-6 py-4">
              <h3 className="text-base font-bold text-amber-900">Zablokowane materialy (tylko dla wykonawcy)</h3>
            </div>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-amber-900">Instrukcje / opis szczegolowy</Label>
                <Textarea
                  className={cn(textareaClassName, "min-h-[180px] p-4 text-sm leading-7")}
                  placeholder="Te informacje zobaczy tylko wybrany wykonawca."
                  value={formData.materialy_opis}
                  onChange={(event) => handleChange("materialy_opis", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-amber-900">Link do zasobow (opcjonalnie)</Label>
                <Input
                  className={inputClassName}
                  placeholder="https://drive.google.com/..."
                  value={formData.materialy_link}
                  onChange={(event) => handleChange("materialy_link", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-amber-900">Plik z materialami (opcjonalnie)</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <Label
                    htmlFor="file-upload"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100"
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                    {isUploading ? "Przesylanie..." : "Wgraj plik"}
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  {uploadedFileUrl && (
                    <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-700">
                      <CheckCircle2 className="h-4 w-4" /> Plik gotowy
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="sticky top-24 rounded-2xl border border-slate-200 bg-white shadow-lg">
            <div className="rounded-t-2xl border-b border-slate-200 bg-emerald-50 px-6 py-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <DollarSign className="h-5 w-5 text-emerald-600" /> Podsumowanie ceny
              </h3>
            </div>
            <CardContent className="space-y-4 p-6">
              {!isVariantMode ? (
                <div>
                  <div className="text-sm font-medium text-slate-500">Cena bazowa</div>
                  <div className="text-3xl font-black text-slate-900">
                    {formData.stawka || "0"} <span className="text-base font-bold text-slate-500">PLN</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-slate-500">Zakres z wariantow</div>
                  <div className="text-3xl font-black text-slate-900">{variantSummary?.label ?? "Brak cen"}</div>
                  <div className="text-xs text-slate-500">
                    Liczba wariantow: <span className="font-semibold text-slate-700">{variants.length}</span>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-200 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 w-full rounded-lg bg-emerald-600 text-base font-bold text-white hover:bg-emerald-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : offerId ? (
                    "Zapisz zmiany"
                  ) : (
                    "Publikuj usluge"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </form>
  );
}
