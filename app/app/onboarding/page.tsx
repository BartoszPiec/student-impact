"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchCeidgData } from "./_actions";
import { Sparkles, ArrowRight, Building, User, Briefcase, GraduationCap, MapPin, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState<string | null>(null);

    // Form states
    const [nip, setNip] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");

    const [publicName, setPublicName] = useState("");
    const [kierunek, setKierunek] = useState("");
    const [rok, setRok] = useState("");
    const [bio, setBio] = useState("");

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace("/auth");
                return;
            }
            setUser(user);

            // Fetch role
            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("user_id", user.id)
                .single();

            if (profile) {
                setRole(profile.role);
                // Pre-fill existing data if any
                if (profile.role === "company") {
                    const { data: cp } = await supabase.from("company_profiles").select("*").eq("user_id", user.id).single();
                    if (cp) {
                        setCompanyName(cp.nazwa || "");
                        setNip(cp.nip || "");
                        setAddress(cp.address || "");
                        setCity(cp.city || "");
                    }
                } else if (profile.role === "student") {
                    const { data: sp } = await supabase.from("student_profiles").select("*").eq("user_id", user.id).single();
                    if (sp) {
                        setPublicName(sp.public_name || "");
                        setKierunek(sp.kierunek || "");
                        setRok(sp.rok ? String(sp.rok) : "");
                        setBio(sp.bio || "");
                    }
                }
            }
            setLoading(false);
        }
        load();
    }, [router, supabase]);

    const fetchGusData = async () => {
        if (!nip) return;

        setLoading(true);
        try {
            const res = await fetchCeidgData(nip);
            if (res.error) {
                alert(res.error);
                return;
            }
            if (res.data) {
                setCompanyName(res.data.name || "");

                if (res.data.address) {
                    setCity(res.data.address.city || "");
                    setAddress(res.data.address.street || "");
                }
            }
        } catch (e) {
            alert("Błąd pobierania danych.");
        } finally {
            setLoading(false);
        }
    };

    const overrideNip = (e: any) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        setNip(val);
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (role === "company") {
                const { error } = await supabase
                    .from("company_profiles")
                    .update({
                        nazwa: companyName,
                        nip: nip || null,
                        address: address || null,
                        city: city || null
                    })
                    .eq("user_id", user.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("student_profiles")
                    .update({
                        public_name: publicName,
                        kierunek,
                        rok: parseInt(rok) || 1,
                        bio: bio || null
                    })
                    .eq("user_id", user.id);
                if (error) throw error;
            }
            router.push("/app");
            router.refresh();
        } catch (err: any) {
            alert("Błąd zapisu: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
            <div className="animate-pulse flex flex-col items-center">
                <Sparkles className="w-8 h-8 text-indigo-500 mb-4 animate-spin-slow" />
                Ładowanie...
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden bg-slate-900">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/0 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-gradient-to-tl from-emerald-500/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-xl animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-8 space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/20 mb-4 text-white">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Witaj w Student Impact! 👋</h1>
                    <p className="text-indigo-200/80 text-lg">
                        Uzupełnij profil, abyśmy mogli dopasować najlepsze oferty.
                    </p>
                </div>

                <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/20 text-white overflow-hidden rounded-[2rem]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
                    <CardContent className="p-8">
                        <form onSubmit={handleSave} className="space-y-6">

                            {role === "company" && (
                                <div className="space-y-6">
                                    <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex gap-4 items-start">
                                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300">
                                            <Search className="h-5 h-5" />
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <Label className="text-indigo-200">Pobierz dane z GUS (Opcjonalnie)</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Wpisz NIP..."
                                                    value={nip}
                                                    onChange={overrideNip}
                                                    className="bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all rounded-xl"
                                                />
                                                <Button type="button" onClick={fetchGusData} disabled={loading} className="bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl">
                                                    Pobierz
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-white/80 font-medium ml-1">Nazwa Firmy *</Label>
                                        <div className="relative">
                                            <Building className="absolute left-3 top-3 h-5 w-5 text-indigo-300/50" />
                                            <Input
                                                value={companyName}
                                                onChange={(e) => setCompanyName(e.target.value)}
                                                required
                                                className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl h-11"
                                                placeholder="Pełna nazwa firmy"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-white/80 font-medium ml-1">Miasto</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-3 h-5 w-5 text-indigo-300/50" />
                                                <Input value={city} onChange={(e) => setCity(e.target.value)} className="pl-10 bg-black/20 border-white/10 text-white focus:border-indigo-500 rounded-xl h-11" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-white/80 font-medium ml-1">Ulica i nr</Label>
                                            <Input value={address} onChange={(e) => setAddress(e.target.value)} className="bg-black/20 border-white/10 text-white focus:border-indigo-500 rounded-xl h-11" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {role === "student" && (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-white/80 font-medium ml-1">Godność (widoczne w profilu) *</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-5 w-5 text-indigo-300/50" />
                                            <Input
                                                value={publicName}
                                                onChange={(e) => setPublicName(e.target.value)}
                                                placeholder="Imię i Nazwisko"
                                                required
                                                className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl h-11 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-white/80 font-medium ml-1">Kierunek studiów *</Label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-3 h-5 w-5 text-indigo-300/50" />
                                            <Input
                                                value={kierunek}
                                                onChange={(e) => setKierunek(e.target.value)}
                                                placeholder="np. Informatyka"
                                                required
                                                className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl h-11 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-white/80 font-medium ml-1">Rok studiów *</Label>
                                        <div className="relative">
                                            <GraduationCap className="absolute left-3 top-3 h-5 w-5 text-indigo-300/50 z-10" />
                                            <Select value={rok} onValueChange={setRok} required>
                                                <SelectTrigger className="pl-10 w-full bg-black/20 border-white/10 text-white rounded-xl h-11 hover:bg-white/10 transition-colors">
                                                    <SelectValue placeholder="Wybierz rok..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                                    <SelectItem value="1">1 rok (Licencjat/Inż)</SelectItem>
                                                    <SelectItem value="2">2 rok (Licencjat/Inż)</SelectItem>
                                                    <SelectItem value="3">3 rok (Licencjat/Inż)</SelectItem>
                                                    <SelectItem value="4">4 rok (inż / 1 mgr)</SelectItem>
                                                    <SelectItem value="5">5 rok (2 mgr)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-white/80 font-medium ml-1">Bio (Opcjonalnie)</Label>
                                        <Textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            placeholder="Napisz krótko o sobie..."
                                            className="bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500 rounded-xl min-h-[100px]"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="pt-4">
                                <Button type="submit" className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02]" disabled={saving}>
                                    {saving ? "Zapisywanie..." : (
                                        <span className="flex items-center gap-2">
                                            Rozpocznij <ArrowRight className="w-4 h-4" />
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
