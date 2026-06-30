import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Polityka Prywatności | Student2Work",
  description: "Polityka prywatności platformy Student2Work - zasady przetwarzania danych osobowych.",
};

export default function PolitykaPrywatnosci() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-8">
          <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            ← Wróć do strony głównej
          </Link>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-slate-900">Polityka Prywatności</h1>
        <p className="mb-10 text-slate-500">Ostatnia aktualizacja: 16 kwietnia 2026 r.</p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-800">1. Administrator danych</h2>
            <p className="leading-relaxed text-slate-600">
              Administratorem Twoich danych osobowych jest operator platformy Student2Work. W sprawach dotyczących ochrony
              danych osobowych możesz skontaktować się z nami pod adresem e-mail podanym w stopce serwisu.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-800">2. Jakie dane zbieramy</h2>
            <ul className="list-disc space-y-2 pl-6 text-slate-600">
              <li>
                <strong>Dane rejestracyjne:</strong> adres e-mail, imię i nazwisko
              </li>
              <li>
                <strong>Dane profilowe:</strong> kierunek studiów, rok studiów, opis, zdjęcie profilowe (opcjonalne)
              </li>
              <li>
                <strong>Dane transakcyjne:</strong> informacje o zleceniach i płatnościach (obsługiwanych przez Stripe)
              </li>
              <li>
                <strong>Dane komunikacyjne:</strong> wiadomości wysyłane w ramach platformy
              </li>
              <li>
                <strong>Dane techniczne:</strong> logi systemowe, zdarzenia błędów, pseudonimizowany identyfikator użytkownika
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-800">3. Cel i podstawa przetwarzania</h2>
            <ul className="list-disc space-y-2 pl-6 text-slate-600">
              <li>
                <strong>Świadczenie usług</strong> (art. 6 ust. 1 lit. b RODO) - realizacja umowy o świadczenie usług drogą
                elektroniczną
              </li>
              <li>
                <strong>Obowiązki prawne</strong> (art. 6 ust. 1 lit. c RODO) - wystawianie faktur, przechowywanie dokumentacji
              </li>
              <li>
                <strong>Uzasadniony interes</strong> (art. 6 ust. 1 lit. f RODO) - bezpieczeństwo platformy i diagnostyka
                błędów
              </li>
              <li>
                <strong>Zgoda</strong> (art. 6 ust. 1 lit. a RODO) - komunikacja marketingowa (tylko jeśli wyrazisz zgodę)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-800">4. Udostępnianie danych</h2>
            <p className="mb-2 leading-relaxed text-slate-600">
              Twoje dane mogą być przekazywane następującym podmiotom przetwarzającym:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-slate-600">
              <li>
                <strong>Stripe Inc.</strong> - operator płatności (USA, standardowe klauzule umowne UE)
              </li>
              <li>
                <strong>Supabase Inc.</strong> - dostawca infrastruktury bazodanowej i przechowywania plików
              </li>
              <li>
                <strong>Functional Software, Inc. (Sentry)</strong> - monitoring błędów i diagnostyka techniczna aplikacji.
                DPA:{" "}
                <a
                  href="https://sentry.io/legal/dpa/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 underline hover:text-indigo-700"
                >
                  https://sentry.io/legal/dpa/
                </a>
              </li>
              <li>
                <strong>Vercel Inc.</strong> - hosting aplikacji
              </li>
            </ul>
            <p className="mt-2 leading-relaxed text-slate-600">Nie sprzedajemy Twoich danych osobowych podmiotom trzecim.</p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-800">5. Okres przechowywania danych</h2>
            <ul className="list-disc space-y-2 pl-6 text-slate-600">
              <li>Dane konta - przez okres aktywności konta + 2 lata po jego usunięciu</li>
              <li>Dane transakcyjne - 5 lat (wymogi podatkowe)</li>
              <li>Logi techniczne - 90 dni</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-800">6. Twoje prawa</h2>
            <p className="mb-2 leading-relaxed text-slate-600">Przysługują Ci następujące prawa:</p>
            <ul className="list-disc space-y-2 pl-6 text-slate-600">
              <li>
                <strong>Dostęp</strong> do swoich danych osobowych
              </li>
              <li>
                <strong>Sprostowanie</strong> nieprawidłowych danych
              </li>
              <li>
                <strong>Usunięcie</strong> danych (prawo do bycia zapomnianym)
              </li>
              <li>
                <strong>Ograniczenie</strong> przetwarzania
              </li>
              <li>
                <strong>Przenoszenie</strong> danych
              </li>
              <li>
                <strong>Sprzeciw</strong> wobec przetwarzania opartego na uzasadnionym interesie
              </li>
              <li>
                <strong>Wycofanie zgody</strong> na marketing w dowolnym momencie
              </li>
            </ul>
            <p className="mt-2 leading-relaxed text-slate-600">
              Masz również prawo wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych (UODO).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-800">7. Pliki cookies</h2>
            <p className="leading-relaxed text-slate-600">
              Platforma używa plików cookies niezbędnych do działania sesji użytkownika (cookies techniczne). Nie używamy
              cookies reklamowych ani śledzących bez Twojej zgody.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-800">8. Bezpieczeństwo danych</h2>
            <p className="leading-relaxed text-slate-600">
              Stosujemy odpowiednie środki techniczne i organizacyjne w celu ochrony Twoich danych, w tym szyfrowanie
              transmisji (HTTPS), Row Level Security w bazie danych oraz kontrolę dostępu opartą na rolach.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-800">9. Kontakt</h2>
            <p className="leading-relaxed text-slate-600">
              W sprawach dotyczących prywatności skontaktuj się z nami poprzez formularz kontaktowy dostępny na stronie lub
              pod adresem e-mail operatora platformy.
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap gap-3 border-t border-slate-200 pt-8">
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
