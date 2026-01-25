"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReviewForm({
    applicationId,
    action
}: {
    applicationId: string,
    action: (appId: string, rating: number, comment: string) => Promise<void>
}) {
    const [rating, setRating] = useState(5);

    return (
        <form action={async (formData) => {
            await action(applicationId, rating, String(formData.get("comment")));
        }} className="space-y-4">

            <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl transition-transform hover:scale-110 ${star <= rating ? 'text-amber-500' : 'text-slate-200'}`}
                    >
                        ★
                    </button>
                ))}
            </div>

            <Textarea
                name="comment"
                placeholder="Napisz kilka słów o współpracy..."
                required
                className="min-h-[80px]"
            />

            <Button type="submit" variant="outline" className="w-full border-indigo-200 text-indigo-700 hover:!bg-indigo-600 hover:!text-white hover:border-indigo-600 transition-all shadow-sm">
                Wystaw opinię
            </Button>
        </form>
    );
}
