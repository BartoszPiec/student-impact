
const { createClient } = require('@supabase/supabase-js');

// Since we can't easily run TS server actions from a script, we'll use a direct JS script with fetch or supabase-js if available in node. 
// However, the `run_command` environment might not have node deps installed.
// The best way for an agent is to create a temporary page/route that executes this on load, OR use `run_command` with a SQL file (if I could write to migrations).
// Given I cannot easily write a migration, I will create a temporary route `/seed-benchmark` that I can ping with `read_url_content`.

import { createClient as createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SeedBenchmarkPage() {
    const supabase = await createServerClient();

    // 1. Get Admin User (We assume the current user accessing this page is logged in, I'll visit it as admin)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div>Not logged in</div>;

    const title = "Benchmark Konkurencji + Porównanie Cen";
    const category = "Marketing";
    const price = 890;
    const delivery_time_days = 4;

    // Markdown Construction
    const description = `
**Hook:** Zobacz dokładnie, jak konkurencja sprzedaje, ile bierze i co komunikuje. Dostajesz tabelę porównawczą, statystyki cen i plan działań, który realnie pomoże ulepszyć Twoją ofertę.

### Co otrzymujesz w pakiecie?
*   **Benchmark 8 konkurentów** (z linkami do źródeł)
*   **Tabela porównania cen** + przeliczenia (np. cena/ml, cena/szt., cena pakietu)
*   **Statystyki cenowe**: min/max, średnia, mediana, rozpiętość
*   **Porównanie komunikacji/USP** (co obiecują i jak to uzasadniają)
*   **Wnioski + rekomendacje wdrożeniowe**: Quick wins / 30 dni / 90 dni
*   **Finalne pliki**: arkusz (Excel/Sheets) + PDF raportu + lista źródeł

### Jak to działa?
1.  **Dzień 1 - Brief i cele**: Doprecyzowujemy cel benchmarku. Otrzymujesz potwierdzone kryteria.
2.  **Dzień 1 - Dobór konkurencji**: Proponujemy listę 8 konkurentów do Twojej akceptacji.
3.  **Dzień 1–2 - Zbieranie danych**: Wypełniamy arkusz: ceny, oferta, kanały, USP.
4.  **Dzień 3 - Statystyki i wnioski**: Liczymy statystyki cen i wyciągamy wnioski.
5.  **Dzień 4 - Finał**: Tworzymy plan działań i finalizujemy raport (PDF + arkusz).

### Dostosuj zamówienie (Wymagane informacje)
*Przy składaniu zamówienia prosimy o podanie:*
*   Branża / rynek (PL / miasto / kraj)
*   B2B czy B2C?
*   Twoja oferta (link lub opis)
*   Co porównujemy? (produkt / usługa / pakiet)
*   Jedna kategoria cenowa do analizy
*   Priorytet celu (ceny / pozycjonowanie / oferta / komunikacja)

### Opcje dodatkowe (Upselle)
*Skontaktuj się z nami na czacie po zamówieniu, aby dokupić:*
*   +4 konkurentów (łącznie 12) → +350 PLN
*   +2 dodatkowe kategorie cenowe → +250 PLN
*   +analiza social (ostatnie 30 dni) → +290 PLN
*   +gotowe teksty: USP + 5 haseł + 3 CTA → +190 PLN
`.trim();

    const locked_content = `
### Instrukcja Realizacji Benchmarks

**Cel:** przygotować benchmark 8 konkurentów + porównanie cen i statystyki + rekomendacje.
**Zasady:** tylko dane publiczne, każde twierdzenie musi mieć źródło (link).

### Checklista Jakości:
- [ ] Lista 8 konkurentów zaakceptowana przez klienta
- [ ] Każda cena ma link do źródła
- [ ] Jednostki ujednolicone (np. cena/ml, cena/szt.)
- [ ] Statystyki policzone: min/max, średnia, mediana
- [ ] Min. 8 wniosków + min. 6 rekomendacji (Quick/30/90)
- [ ] Final: PDF + arkusz + lista źródeł
- [ ] 1 runda poprawek po feedbacku klienta

**Przykład raportu PDF:** [Link do przykładu] (Wstaw link tutaj podczas edycji, jeśli masz)
`.trim();

    // Fallback: Append locked content to description since column is missing
    const fullDescription = description + "\n\n--- [MATERIAŁY DLA WYKONAWCY] ---\n" + locked_content;

    const { error } = await supabase.from('service_packages').insert({
        // company_id: user.id, // REMOVED: Column does not exist
        title,
        description: fullDescription, // Merged content
        category,
        price,
        delivery_time_days,
        // locked_content, // REMOVED: Column does not exist yet
        type: 'platform_service',
        status: 'active'
    });

    if (error) return <div className="p-10 text-red-500 font-bold">Błąd: {error.message}</div>;

    redirect("/app/admin/system-services");
    return null;
}
