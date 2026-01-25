"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatDate(iso?: string) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("pl-PL", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

export function OfferCard({
    offer,
    applicationStatus
}: {
    offer: any;
    applicationStatus?: { status: string; created_at: string | null } | null
}) {
    return (
        <Card className="hover:shadow-md transition-shadow duration-300 border-slate-200 bg-white group">
            <CardContent className="p-5">
                <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                    {/* Left Side: Title, Status, Date */}
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/app/offers/${offer.id}`} className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1 text-lg">
                                {offer.tytul}
                            </Link>

                            {offer.typ && <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 uppercase text-[10px] tracking-wide font-semibold">{offer.typ}</Badge>}

                            {applicationStatus && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 border-none">
                                    ✓ Aplikowano
                                </Badge>
                            )}
                        </div>

                        <div className="flex flex-col gap-1 text-sm text-slate-500">
                            <p className="line-clamp-2 text-slate-600 mb-1">{offer.opis}</p>
                            <p className="text-xs">
                                Utworzono: {formatDate(offer.created_at)}
                                {offer.czas && <span> • {offer.czas}</span>}
                            </p>
                        </div>
                    </div>

                    {/* Right Side: Price & Actions */}
                    <div className="flex flex-col items-end gap-3 min-w-[150px]">
                        <div className="font-bold text-lg text-slate-900 text-right">
                            {offer.is_platform_service ? (
                                `${offer.stawka} PLN`
                            ) : (
                                (offer.salary_range_min && offer.salary_range_min > 0) ? (
                                    <span>
                                        {offer.salary_range_min} {offer.salary_range_max ? `- ${offer.salary_range_max}` : "+"} PLN
                                    </span>
                                ) : (offer.stawka ? `${offer.stawka} PLN` : "—")
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button asChild variant="outline" size="sm" className="h-8">
                                <Link href={`/app/offers/${offer.id}`}>Szczegóły</Link>
                            </Button>

                            {!applicationStatus && (
                                <Button asChild size="sm" className="h-8 bg-violet-600 hover:bg-violet-700 text-white shadow-sm border-0">
                                    <Link href={`/app/offers/${offer.id}`}>Aplikuj</Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
