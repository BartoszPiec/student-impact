"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, GraduationCap, Calendar } from "lucide-react";
import { addEducationEntry, deleteEducationEntry } from "./_actions";

export default function EducationSection({ entries }: { entries: any[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [isCurrent, setIsCurrent] = useState(false);

    return (
        <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/40 bg-white overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 py-6">
                <div className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-lg font-black text-slate-800">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        Edukacja
                    </CardTitle>
                    {!isAdding && (
                        <Button variant="outline" size="sm" onClick={() => setIsAdding(true)} className="rounded-xl border-slate-200 hover:bg-slate-50 font-bold text-slate-600">
                            <Plus className="w-4 h-4 mr-2" /> Dodaj
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-8">

                {/* LISTA ISTNIEJĄCYCH WPISÓW */}
                <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-2">
                    {entries.length === 0 && !isAdding && (
                        <div className="pl-6 text-sm text-slate-400 font-medium italic">Brak wpisów o edukacji. Dodaj swoją szkołę.</div>
                    )}

                    {entries.map((edu) => (
                        <div key={edu.id} className="relative pl-8 group">
                            {/* Dot on timeline */}
                            <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-white bg-indigo-200 group-hover:bg-indigo-500 transition-colors shadow-sm"></div>

                            <div className="flex justify-between items-start bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all duration-300">
                                <div>
                                    <div className="font-bold text-slate-900 text-lg">{edu.school_name}</div>
                                    <div className="text-sm font-medium text-slate-600 mt-1">
                                        <span className="text-indigo-600 font-bold">{edu.field_of_study}</span>
                                        {edu.degree && <span className="text-slate-400"> • {edu.degree}</span>}
                                    </div>

                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide mt-3">
                                        <Calendar className="w-3 h-3" />
                                        {edu.start_year} — {edu.is_current ? <span className="text-emerald-500">obecnie</span> : edu.end_year}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                    onClick={async () => await deleteEducationEntry(edu.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* FORMULARZ DODAWANIA */}
                {isAdding && (
                    <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/30 p-6 animate-in fade-in slide-in-from-top-4">
                        <h4 className="text-sm font-black text-indigo-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Dodaj nową uczelnię
                        </h4>
                        <form
                            action={async (formData) => {
                                await addEducationEntry(formData);
                                setIsAdding(false);
                                setIsCurrent(false);
                            }}
                            className="space-y-4"
                        >
                            <div>
                                <Label htmlFor="school_name" className="text-xs font-bold uppercase text-slate-500 tracking-wide mb-1.5 block">Nazwa uczelni</Label>
                                <Input name="school_name" id="school_name" placeholder="np. Politechnika Warszawska" required className="bg-white border-slate-200 rounded-xl" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="field_of_study" className="text-xs font-bold uppercase text-slate-500 tracking-wide mb-1.5 block">Kierunek</Label>
                                    <Input name="field_of_study" id="field_of_study" placeholder="np. Informatyka" required className="bg-white border-slate-200 rounded-xl" />
                                </div>
                                <div>
                                    <Label htmlFor="degree" className="text-xs font-bold uppercase text-slate-500 tracking-wide mb-1.5 block">Stopień</Label>
                                    <Input name="degree" id="degree" placeholder="np. Inżynier" className="bg-white border-slate-200 rounded-xl" />
                                </div>
                            </div>

                            <div className="flex gap-6 items-end py-2">
                                <div className="w-24">
                                    <Label htmlFor="start_year" className="text-xs font-bold uppercase text-slate-500 tracking-wide mb-1.5 block">Od</Label>
                                    <Input name="start_year" id="start_year" type="number" placeholder="2020" className="bg-white border-slate-200 rounded-xl text-center" />
                                </div>

                                {!isCurrent && (
                                    <div className="w-24">
                                        <Label htmlFor="end_year" className="text-xs font-bold uppercase text-slate-500 tracking-wide mb-1.5 block">Do</Label>
                                        <Input name="end_year" id="end_year" type="number" placeholder="2024" className="bg-white border-slate-200 rounded-xl text-center" />
                                    </div>
                                )}

                                <div className="flex items-center space-x-2 pb-3 pl-2">
                                    <Checkbox
                                        id="is_current"
                                        name="is_current"
                                        checked={isCurrent}
                                        onCheckedChange={(c) => setIsCurrent(!!c)}
                                        className="rounded-md border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                    />
                                    <Label htmlFor="is_current" className="cursor-pointer font-medium text-slate-700">W trakcie</Label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 justify-end border-t border-indigo-100">
                                <Button variant="ghost" type="button" onClick={() => setIsAdding(false)} className="rounded-xl font-bold text-slate-500 hover:text-slate-700">Anuluj</Button>
                                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 px-6">Zapisz</Button>
                            </div>
                        </form>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
