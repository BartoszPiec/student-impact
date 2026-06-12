"use client";

import { useMemo, useState } from "react";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  REVIEW_CATEGORIES,
  calculateOverallReviewRating,
  type DetailedReviewInput,
  type ReviewCategoryKey,
} from "@/lib/reviews";

type CategoryFormState = Record<ReviewCategoryKey, { enabled: boolean; rating: number }>;

function createInitialState(): CategoryFormState {
  return {
    timeliness: { enabled: true, rating: 5 },
    communication: { enabled: true, rating: 5 },
    professionalism: { enabled: true, rating: 5 },
    project_documentation: { enabled: true, rating: 5 },
    decision_making: { enabled: true, rating: 5 },
  };
}

export function DetailedReviewForm({
  onSubmit,
  submitLabel = "Wystaw opinie",
}: {
  onSubmit: (input: DetailedReviewInput) => Promise<void>;
  submitLabel?: string;
}) {
  const [comment, setComment] = useState("");
  const [categories, setCategories] = useState<CategoryFormState>(createInitialState);

  const normalizedCategories = useMemo(() => {
    return Object.fromEntries(
      REVIEW_CATEGORIES.map((category) => [
        category.key,
        categories[category.key].enabled ? categories[category.key].rating : null,
      ]),
    ) as DetailedReviewInput["categories"];
  }, [categories]);

  const enabledCount = REVIEW_CATEGORIES.filter((category) => categories[category.key].enabled).length;
  const overallRating = calculateOverallReviewRating(normalizedCategories);

  return (
    <form
      action={async () => {
        if (enabledCount === 0) {
          return;
        }

        await onSubmit({
          comment,
          categories: normalizedCategories,
        });
      }}
      className="space-y-5"
    >
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
        <div className="text-xs font-bold uppercase tracking-wide text-indigo-500">Ocena koncowa</div>
        <div className="mt-1 flex items-center gap-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${star <= overallRating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
              />
            ))}
          </div>
          <span className="text-lg font-bold text-slate-900">{overallRating}/5</span>
          <span className="text-sm text-slate-500">na podstawie aktywnych kategorii</span>
        </div>
      </div>

      <div className="space-y-3">
        {REVIEW_CATEGORIES.map((category) => {
          const state = categories[category.key];

          return (
            <div key={category.key} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-semibold text-slate-900">{category.label}</div>
                  <p className="text-sm text-slate-500">{category.description}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-medium text-slate-500">
                    {state.enabled ? "Oceniam" : "Nie dotyczy"}
                  </span>
                  <Switch
                    checked={state.enabled}
                    onCheckedChange={(checked) =>
                      setCategories((prev) => ({
                        ...prev,
                        [category.key]: {
                          ...prev[category.key],
                          enabled: checked,
                        },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    disabled={!state.enabled}
                    onClick={() =>
                      setCategories((prev) => ({
                        ...prev,
                        [category.key]: {
                          ...prev[category.key],
                          rating: star,
                        },
                      }))
                    }
                    className={`transition-transform ${state.enabled ? "hover:scale-110" : "cursor-not-allowed opacity-40"}`}
                  >
                    <Star
                      className={`h-5 w-5 ${
                        state.enabled && star <= state.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200"
                      }`}
                    />
                  </button>
                ))}
                {state.enabled ? (
                  <span className="ml-2 text-sm font-semibold text-slate-700">{state.rating}/5</span>
                ) : (
                  <span className="ml-2 text-sm text-slate-400">Kategoria wylaczona</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">Dodatkowe komentarze</label>
        <Textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Dodaj kontekst do oceny, wskaz mocne strony lub rzeczy do poprawy."
          className="min-h-[110px]"
        />
        <p className="text-xs text-slate-500">
          Jesli dana kategoria nie dotyczy tego zlecenia, wylacz ja przełącznikiem.
        </p>
      </div>

      {enabledCount === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Wybierz przynajmniej jedna kategorie oceny.
        </div>
      )}

      <Button
        type="submit"
        disabled={enabledCount === 0}
        variant="outline"
        className="w-full border-indigo-200 text-indigo-700 hover:!bg-indigo-600 hover:!text-white hover:border-indigo-600 transition-all shadow-sm"
      >
        {submitLabel}
      </Button>
    </form>
  );
}
