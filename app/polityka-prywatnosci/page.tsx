import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "Polityka Prywatności | Student2Work",
    description: "Polityka prywatności platformy Student2Work — zasady przetwarzania danych osobowych.",
};

export default function PolitykaPrywatnosci() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-3xl mx-auto px-4 py-16">
                <div className="mb-8">
                    <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                        ← Wróć do strony głównej
                    </Link>
                </div>

                <h1 className="text-3xl font-bold text-slate-900 mb-2">Polityka Prywatności</h1>
                <p className="text-slate-500 mb-10">Ostatnia aktualizacja: 24 marca 2026 r.</p>

                <div className="prose prose-slate max-w-none space-y-8">

                    <section>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">1. Administrator danych</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Administratorem Twoich danych osobowych jest operator platformy Student2Work.
                            W sprawach dotyczących ochrony danych osobowych możesz skontaktować się z nami
                            pod adresem e-mail podanym w stopce serwisu.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">2. Jakie dane zbieramy</h2>
                        <ul className="list-disc pl-6 space-y-2 text-slate-600">
                            <li><strong>Dane rejestracyjne:</strong> adres e-mail, imię i nazwisko</li>
                            <li><strong>Dane profilowe:</strong> kierunek studiów, rok studiów, opis, zdjęcie profilowe (opcjonalne)</li>
                            <li><strong>Dane transakcyjne:</strong> informacje o zleceniach, płatnościach (obsługiwanych przez Stripe)</li>
                            <li><strong>Dane komunikacyjne:</strong> wiadomości wysyłane w ramach platformy</li>
                            <li><strong>Dane techniczne:</strong> adres IP, informacje o przeglądarce, logi serwera</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">3. Cel i podstawa przetwarzania</h2>
                        <ul className="list-disc pl-6 space-y-2 text-slate-600">
                            <li><strong>Świadczenie usług</strong> (art. 6 ust. 1 lit. b RODO) — realizacja umowy o świadczenie usług drogą elektroniczną</li>
                            <li><strong>Obowiązki prawne</strong> (art. 6 ust. 1 lit. c RODO) — wystawianie faktur, przechowywanie dokumentacji</li>
                            <li><strong>Uzasadniony interes</strong> (art. 6 ust. 1 lit. f RODO) — bezpieczeństwo platformy, zapobieganie nadużyciom</li>
                            <li><strong>Zgoda</strong> (art. 6 ust. 1 lit. a RODO) — komunikacja marketingowa (tylko jeśli wyraziłeś zgodę)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">4. Udostępnianie danych</h2>
                        <p className="text-slate-600 leading-relaxed mb-2">
                            Twoje dane mogą być przekazywane następującym podmiotom:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-600">
                            <li><strong>Stripe Inc.</strong> — operator płatności (USA, zabezpieczony klauzulami standardowymi UE)</li>
                            <li><strong>Supabase Inc.</strong> — dostawca infrastruktury bazodanowej i przechowywania plików</li>
                            <li><strong>Resend Inc.</strong> — dostawca usług e-mail</li>
                            <li><strong>Vercel Inc.</strong> — hosting aplikacji</li>
                        </ul>
                        <p className="text-slate-600 leading-relaxed mt-2">
                            Nie sprzedajemy Twoich danych osobowych podmiotom trzecim.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">5. Okres przechowywania danych</h2>
                        <ul className="list-disc pl-6 space-y-2 text-slate-600">
                            <li>Dane konta — przez okres aktywności konta + 2 lata po jego usunięciu</li>
                            <li>Dane transakcyjne — 5 lat (wymogi podatkowe)</li>
                            <li>Logi techniczne — 90 dni</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">6. Twoje prawa</h2>
                        <p className="text-slate-600 leading-relaxed mb-2">Przysługują Ci następujące prawa:</p>
                        <ul className="list-disc pl-6 space-y-2 text-slate-600">
                            <li><strong>Dostęp</strong> do swoich danych osobowych</li>
                            <li><strong>Sprostowanie</strong> nieprawidłowych danych</li>
                            <li><strong>Usunięcie</strong> danych (prawo do bycia zapomnianym)</li>
                            <li><strong>Ograniczenie</strong> przetwarzania</li>
                            <li><strong>Przenoszenie</strong> danych</li>
                            <li><strong>Sprzeciw</strong> wobec przetwarzania opartego na uzasadnionym interesie</li>
                            <li><strong>Wycofanie zgody</strong> na marketing w dowolnym momencie</li>
                        </ul>
                        <p className="text-slate-600 leading-relaxed mt-2">
                            Masz również prawo wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych (UODO).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">7. Pliki cookies</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Platforma używa plików cookies niezbędnych do działania sesji użytkownika (cookies techniczne).
                            Nie używamy cookies reklamowych ani śledzących bez Twojej zgody.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">8. Bezpieczeństwo danych</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Stosujemy odpowiednie środki techniczne i organizacyjne w celu ochrony Twoich danych,
                            w tym szyfrowanie transmisji (HTTPS), Row Level Security w bazie danych,
                            oraz kontrolę dostępu opartą na rolach.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">9. Kontakt</h2>
                        <p className="text-slate-600 leading-relaxed">
                            W sprawach dotyczących prywatności skontaktuj się z nami poprzez formularz kontaktowy
                            dostępny na stronie lub pod adresem e-mail operatora platformy.
                        </p>
                    </section>

                </div>

                <div className="mt-12 pt-8 border-t border-slate-200 flex gap-3 flex-wrap">
                    <Button asChild variant="outline">
                        <Link href="/">Wróć do strony głównej</Link>
                    </Button>
                    <Button asChild variant="ghost">
                        <Link href="/regulamin">Regulamin serwisu</Link>
                    </Button>
                </div>
            </div>
        </main>
    );
}
