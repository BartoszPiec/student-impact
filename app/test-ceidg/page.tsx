"use client";

import { useState } from "react";
import { checkNipAction } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function TestCeidgPage() {
    const [nip, setNip] = useState("");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        const formData = new FormData();
        formData.append("nip", nip);

        const res = await checkNipAction(formData);
        setResult(res);
        setLoading(false);
    }

    return (
        <div className="p-8 max-w-xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Test Integracji CEIDG</h1>
            <p className="text-slate-500">
                Wpisz NIP firmy, aby sprawdzić czy API zwraca poprawne dane.
            </p>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                    className="flex-1"
                    placeholder="np. 5261040828"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                />
                <Button disabled={loading}>
                    {loading ? "Sprawdzanie..." : "Sprawdź"}
                </Button>
            </form>

            {result && (
                <div className="bg-slate-100 p-4 rounded-lg overflow-auto border">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
