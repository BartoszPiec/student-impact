"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Copy, Trash2, Key, ShieldCheck, Check } from "lucide-react";
import { addSecret, deleteSecret } from "@/app/app/deliverables/_actions";

function SecretItem({ secret, onDelete }: { secret: any, onDelete?: () => void }) {
    const [visible, setVisible] = useState(false);

    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(secret.secret_value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border rounded-xl gap-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3 text-slate-700">
                <div className="p-2 bg-amber-50 text-amber-600 rounded">
                    <Key className="w-5 h-5" />
                </div>
                <div>
                    <div className="font-medium">{secret.title}</div>
                    <div className="text-xs text-muted-foreground">Dodano {new Date(secret.created_at).toLocaleDateString()}</div>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1.5 border">
                <div className="px-3 font-mono text-sm max-w-[200px] truncate select-all text-slate-800">
                    {visible ? secret.secret_value : "••••••••••••"}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setVisible(!visible)}>
                    {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <div className="relative">
                    <Button variant="ghost" size="icon" className="h-8 w-8 transition-all" onClick={copyToClipboard}>
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    {copied && (
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded shadow animate-in fade-in zoom-in duration-200">
                            Skopiowano!
                        </span>
                    )}
                </div>
            </div>

            {onDelete && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={onDelete}>
                    <Trash2 className="w-4 h-4" />
                </Button>
            )}
        </div>
    )
}

export function SecretsTab({
    applicationId,
    secrets,
    isCompany
}: any) {
    const [isAdding, setIsAdding] = useState(false);

    return (
        <div className="space-y-6">
            <Card className="border-amber-100 bg-amber-50/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-900">
                        <ShieldCheck className="w-5 h-5" /> Sejf Dostępów
                    </CardTitle>
                    <CardDescription className="text-amber-800">
                        Bezpieczne miejsce na przekazywanie haseł, tokenów API i danych dostępowych.
                        Dane są widoczne tylko dla Ciebie i drugiej strony umowy.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                    {secrets.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-sm">
                            Sejf jest pusty. Dodaj pierwszy dostęp poniżej.
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {secrets.map((s: any) => (
                                <SecretItem
                                    key={s.id}
                                    secret={s}
                                    onDelete={() => deleteSecret(s.id, applicationId)}
                                />
                            ))}
                        </div>
                    )}

                    {!isAdding ? (
                        <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full border-dashed border-amber-300 text-amber-700 hover:bg-amber-100 mt-4">
                            + Dodaj nowe dane dostępowe
                        </Button>
                    ) : (
                        <form action={async (formData) => {
                            await addSecret(applicationId, formData);
                            setIsAdding(false);
                        }} className="bg-white p-4 rounded-xl border mt-4 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <Label>Nazwa (np. "Login do Instagrama")</Label>
                                <Input name="title" required placeholder="Wpisz nazwę..." />
                            </div>
                            <div className="space-y-2">
                                <Label>Wartość (Hasło / Login / Token)</Label>
                                <Input name="secretValue" required placeholder="Wpisz tajną treść..." type="text" />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Anuluj</Button>
                                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">Zapisz w sejfie</Button>
                            </div>
                        </form>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
