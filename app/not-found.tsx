import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="p-6 bg-indigo-50 rounded-full">
                        <FileQuestion className="w-16 h-16 text-indigo-400" />
                    </div>
                </div>

                <h1 className="text-6xl font-black text-slate-200 mb-2">404</h1>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">Strona nie istnieje</h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                    Przepraszamy, nie możemy znaleźć strony, której szukasz.
                    Mogła zostać przeniesiona lub usunięta.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Link href="/">Wróć do strony głównej</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link href="/app">Panel aplikacji</Link>
                    </Button>
                </div>

                <p className="text-xs text-slate-400 mt-8">
                    Student2Work · Platforma dla studentów i firm
                </p>
            </div>
        </main>
    );
}
