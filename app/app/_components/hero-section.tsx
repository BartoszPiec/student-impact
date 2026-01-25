"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function HeroSection() {
    return (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1b4b] via-[#2e1065] to-[#4c1d95] text-white shadow-2xl">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150"></div>

            <div className="relative z-10 px-6 py-16 md:py-24 text-center max-w-4xl mx-auto space-y-6">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
                    Rozwiń swoją <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-pink-400">karierę</span> <br className="hidden md:block" />
                    już na studiach
                </h1>

                <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto leading-relaxed">
                    Student2Work łączy Cię z firmami szukającymi młodych talentów.
                    Zdobywaj doświadczenie, realizuj projekty i zarabiaj pierwsze pieniądze.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/10">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-200" />
                        <Input
                            placeholder="Czego szukasz? (np. Logo, Social Media)"
                            className="pl-10 h-12 bg-transparent border-none text-white placeholder:text-indigo-200 focus-visible:ring-0 focus-visible:ring-offset-0 text-base shadow-none"
                        />
                    </div>
                    <Button size="lg" className="w-full sm:w-auto h-12 px-8 bg-white text-indigo-900 hover:bg-indigo-50 font-bold shadow-lg transition-transform active:scale-95">
                        Szukaj
                    </Button>
                </div>

                <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-indigo-200 pt-4">
                    <span>Popularne:</span>
                    <button className="hover:text-white transition-colors underline decoration-indigo-400/50 underline-offset-4">Grafika</button>
                    <button className="hover:text-white transition-colors underline decoration-indigo-400/50 underline-offset-4">Marketing</button>
                    <button className="hover:text-white transition-colors underline decoration-indigo-400/50 underline-offset-4">Programowanie</button>
                    <button className="hover:text-white transition-colors underline decoration-indigo-400/50 underline-offset-4">Copywriting</button>
                </div>
            </div>
        </section>
    );
}
