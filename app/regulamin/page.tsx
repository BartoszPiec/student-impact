import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "Regulamin | Student2Work",
    description: "Regulamin platformy Student2Work — zasady korzystania z serwisu.",
};

export default function RegulamiPage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-3xl mx-auto px-4 py-16">
                <div className="mb-8">
                    <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                        ← Wróć do strony głównej
                    </Link>
                </div>

                <h1 className="text-3xl font-bold text-slate-900 mb-2">Regulamin serwisu Student2Work</h1>
                <p className="text-slate-500 mb-10">Ostatnia aktualizacja: 24 marca 2026 r.</p>

                <div className="prose prose-slate max-w-none space-y-8">

                    <section>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">§1. Postanowienia ogólne</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Niniejszy Regulamin określa zasady korzystania z platformy Student2Work, dostępnej pod adresem student2work.pl,
                            prowadzonej przez operatora serwisu. Platforma umożliwia studentom i firmom nawiązywanie współpracy
                            w ramach projektów i zleceń.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">§2. Definicje</h2>
                        <ul className="list-disc pl-6 space-y-2 text-slate-600">
                            <li><strong>Platforma</strong> — serwis internetowy Student2Work</li>
                            <li><strong>Użytkownik</strong> — każda osoba korzystająca z platformy po rejestracji</li>
                            <li><strong>Student</strong> — Użytkownik zarejestrowany jako osoba poszukująca zleceń</li>
                            <li><strong>Firma</strong> — Użytkownik zarejestrowany jako podmiot zlecający pracę</li>
                            <li><strong>Zlecenie</strong> — zadanie opublikowane przez Firmę dla Studentów</li>
                            <li><strong>Depozyt (Escrow)</strong> — zabezpieczenie środków finansowych przez platformę do czasu akceptacji pracy</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">§3. Rejestracja i konto</h2>
                        <ol className="list-decimal pl-6 space-y-2 text-slate-600">
                            <li>Korzystanie z platformy wymaga rejestracji i utworzenia konta.</li>
                            <li>Użytkownik jest zobowiązany do podania prawdziwych danych podczas rejestracji.</li>
                            <li>Każdy Użytkownik może posiadać jedno aktywne konto.</li>
                            <li>Platforma zastrzega sobie prawo do zawieszenia lub usunięcia konta naruszającego Regulamin.</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">§4. Zasady realizacji zleceń</h2>
                        <ol className="list-decimal pl-6 space-y-2 text-slate-600">
                            <li>Zlecenia są realizowane zgodnie z warunkami uzgodnionymi między Firmą a Studentem.</li>
                            <li>Wynagrodzenie jest zabezpieczane w systemie depozytowym (Escrow) przed rozpoczęciem pracy.</li>
                            <li>Środki są zwalniane na rzecz Studenta po akceptacji wykonanej pracy przez Firmę.</li>
                            <li>W przypadku sporu, platforma może pełnić rolę mediatora.</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">§5. Płatności</h2>
                        <ol className="list-decimal pl-6 space-y-2 text-slate-600">
                            <li>Płatności obsługiwane są przez operatora płatności Stripe.</li>
                            <li>Platforma pobiera prowizję zgodnie z aktualnym cennikiem.</li>
                            <li>Wszystkie ceny podane są w PLN.</li>
                            <li>Zwroty realizowane są zgodnie z polityką zwrotów platformy.</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">§6. Prawa i obowiązki Użytkowników</h2>
                        <p className="text-slate-600 leading-relaxed mb-2">Użytkownik zobowiązuje się do:</p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-600">
                            <li>Przestrzegania obowiązującego prawa i niniejszego Regulaminu</li>
                            <li>Nieudostępniania danych logowania osobom trzecim</li>
                            <li>Rzetelnego wykonywania i zlecania prac</li>
                            <li>Nieumieszczania treści naruszających prawa osób trzecich</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">§7. Odpowiedzialność</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Platforma Student2Work nie ponosi odpowiedzialności za treści zamieszczane przez Użytkowników
                            ani za prawidłowość wykonania zleceń. Operator platformy dołoży wszelkich starań, aby zapewnić
                            ciągłość i bezpieczeństwo działania serwisu.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">§8. Ochrona danych osobowych</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Zasady przetwarzania danych osobowych opisane są w{" "}
                            <Link href="/polityka-prywatnosci" className="text-indigo-600 hover:underline">
                                Polityce Prywatności
                            </Link>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">§9. Zmiany Regulaminu</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Operator zastrzega sobie prawo do zmiany Regulaminu. O zmianach Użytkownicy będą informowani
                            drogą mailową z 14-dniowym wyprzedzeniem.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">§10. Postanowienia końcowe</h2>
                        <p className="text-slate-600 leading-relaxed">
                            W sprawach nieuregulowanych Regulaminem zastosowanie mają przepisy prawa polskiego.
                            Sądem właściwym do rozstrzygania sporów jest sąd właściwy dla siedziby operatora platformy.
                        </p>
                    </section>

                </div>

                <div className="mt-12 pt-8 border-t border-slate-200">
                    <Button asChild variant="outline">
                        <Link href="/">Wróć do strony głównej</Link>
                    </Button>
                </div>
            </div>
        </main>
    );
}
