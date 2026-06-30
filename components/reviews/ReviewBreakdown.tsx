import { Badge } from "@/components/ui/badge";
import { REVIEW_CATEGORIES, type ReviewCategoryRatings } from "@/lib/reviews";

export function ReviewBreakdown({
  ratings,
  compact = false,
}: {
  ratings: ReviewCategoryRatings;
  compact?: boolean;
}) {
  const activeRatings = REVIEW_CATEGORIES.filter((category) => {
    const value = ratings[category.key];
    return typeof value === "number" && value >= 1 && value <= 5;
  });

  if (activeRatings.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {activeRatings.map((category) => (
          <Badge
            key={category.key}
            variant="outline"
            className="rounded-full border-slate-200 bg-slate-50 text-slate-600"
          >
            {category.label}: {ratings[category.key]}/5
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {activeRatings.map((category) => (
        <div
          key={category.key}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
        >
          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            {category.label}
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-800">
            {ratings[category.key]}/5
          </div>
        </div>
      ))}
    </div>
  );
}
