import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

interface ReviewCardProps {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    reviewerId: string;
    reviewerName: string;
    reviewerLink?: string;
}

export function Stars({ rating }: { rating: number }) {
    const r = Math.max(1, Math.min(5, Math.trunc(rating)));
    return (
        <div className="flex items-center gap-0.5" aria-label={`Ocena ${r} na 5`}>
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < r ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                />
            ))}
        </div>
    );
}

export function CompanyAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
    const initial = (name || "U").charAt(0).toUpperCase();
    const colors = [
        "bg-red-500", "bg-blue-500", "bg-green-600", "bg-yellow-600",
        "bg-purple-600", "bg-pink-600", "bg-indigo-600", "bg-cyan-600"
    ];
    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;

    const sizeClasses = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-base";

    return (
        <div className={`shrink-0 rounded-full flex items-center justify-center text-white font-bold ${colors[colorIndex]} shadow-sm ${sizeClasses}`}>
            {initial}
        </div>
    );
}

function formatDate(ts?: string | null) {
    if (!ts) return "";
    try {
        return new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" }).format(new Date(ts));
    } catch (e) {
        return "";
    }
}

export function ReviewCard({
    rating,
    comment,
    createdAt,
    reviewerId,
    reviewerName,
    reviewerLink
}: ReviewCardProps) {
    return (
        <Card className="border border-slate-100 shadow-lg shadow-indigo-100/20 hover:shadow-xl hover:shadow-indigo-100/40 transition-all duration-300 rounded-3xl overflow-hidden bg-white hover:-translate-y-1">
            <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                    <CompanyAvatar name={reviewerName} />
                    <div className="flex-1 min-w-0">
                        {reviewerLink ? (
                            <Link href={reviewerLink} className="block group">
                                <h4 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors truncate">
                                    {reviewerName}
                                </h4>
                            </Link>
                        ) : (
                            <h4 className="font-bold text-slate-900 truncate">
                                {reviewerName}
                            </h4>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                            <Stars rating={rating} />
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                • {formatDate(createdAt)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <div className="text-sm text-slate-700 leading-relaxed italic">
                        "{comment || "Brak komentarza do oceny."}"
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
