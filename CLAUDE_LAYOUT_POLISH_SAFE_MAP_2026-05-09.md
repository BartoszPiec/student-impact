# Claude Layout Polish Safe Map - 2026-05-09

## Status
Projekt jest gotowy do ostroznej rundy premium UI polish. Nie zmieniac logiki flow, status machine, platnosci, escrow, auth, RLS, dokumentow ani milestone transitions.

## Zakres bezpieczny do UI polish

### Panel aplikacji studenta
- `app/app/applications/page.tsx`
  - Bezpieczne: layout naglowka, tabs, empty states, spacing, nazwy sekcji.
  - Ostroznie: mapowanie statusow w `resolveApplicationStage`.
- `app/app/applications/ApplicationList.tsx`
  - Bezpieczne: wyglad kart aplikacji, badges, CTA, filtry prezentacyjne, responsywnosc.
  - Ostroznie: formularze `action={...}` i warunki pokazywania CTA.
- `app/app/applications/withdraw-button.tsx`
  - Bezpieczne tylko style przycisku/dialogu.

### Panel uslug/zlecen studenta
- `app/app/services/dashboard/page.tsx`
  - Bezpieczne: header, tlo, spacing, container.
  - Nie zmieniac zapytan Supabase ani filtrowania po `student_id`.
- `app/app/services/dashboard/dashboard-client.tsx`
  - Bezpieczne: search/filter bar, sekcje bucketow, karty zlecen, empty state.
  - Ostroznie: `getServiceOrderBucket`, status filter, linki do szczegolow.
- `app/app/services/dashboard/service-order-status.ts`
  - Tylko copy/kolory labeli. Nie zmieniac mapowania statusow bez review.
- `app/app/services/dashboard/[id]/page.tsx`
  - Bezpieczne: layout szczegolow zamowienia, sekcje danych, czytelnosc historii wyceny.
  - Nie zmieniac dostepu do rozmowy, snapshot parsing ani action components.
- `app/app/services/dashboard/order-detail-actions.tsx`
  - Bezpieczne tylko style CTA.

### Widok wiadomosci
- `app/app/chat/_components/ChatListSidebarClient.tsx`
  - Bezpieczne: sidebar, wyszukiwarka, tabs Wszystkie/Nieprzeczytane, empty state, badges.
  - Ostroznie: realtime subscription, `router.refresh`, unread calculation.
- `app/app/chat/[id]/page.tsx`
  - Bezpieczne: header rozmowy, komunikat archiwalnego ogloszenia, layout kolumn.
  - Nie zmieniac auth/participant guard ani sposobu pobierania conversation/messages.
- `app/app/chat/[id]/ChatList.tsx`
  - Bezpieczne: wyglad listy, dymki, menu wiadomosci, flag badge.
  - Ostroznie: mark-as-read/unread, realtime channel, status proposal resolution.
- `app/app/chat/[id]/ChatInput.tsx`
  - Bezpieczne: input bar, attachment preview, popover/dialog styling.
  - Nie zmieniac upload/send action semantics.
- `app/app/chat/[id]/ChatHeaderActions.tsx`
  - Bezpieczne: przycisk oznaczania jako nieprzeczytane.
- `app/app/chat/_components/TextBubble.tsx`
- `app/app/chat/_components/FileBubble.tsx`
- `app/app/chat/_components/SystemEventRow.tsx`
- `app/app/chat/_components/InquiryCard.tsx`
  - Bezpieczne: prezentacja dymkow i zdarzen.

### Negocjacje/propozycje
- `app/app/chat/_components/RateCard.tsx`
- `app/app/chat/_components/DeadlineCard.tsx`
  - Bezpieczne: wyglad kart, kolory, CTA spacing, stany accepted/rejected/pending.
  - Nie zmieniac warunku `isInteractive` ani wywolan akcji.
- `app/app/deliverables/[id]/tabs/negotiation/DraftViewer.tsx`
- `app/app/deliverables/[id]/tabs/negotiation/DraftEditor.tsx`
  - Bezpieczne: wyglad listy etapow, diff cards, budzet bar, przyciski.
  - Nie zmieniac RPC, walidacji budzetu, drag/drop logiki ani submit/save flow.
- `app/app/deliverables/[id]/tabs/negotiation/MilestoneNegotiationOrchestrator.tsx`
  - Raczej nie dotykac poza klasami layoutu; kontroluje tryby negocjacji.

### Profil studenta widoczny dla firmy
- `app/app/students/[id]/page.tsx`
  - Bezpieczne: struktura profilu, sidebar, karty kompetencji, bio, edukacja, referencje.
  - Nie zmieniac zapytan Supabase ani normalizacji projektow/kontraktow.
- `app/app/students/[id]/student-projects-list.tsx`
  - Bezpieczne: karty projektow, expanded/collapsed layout.

### Widok firmy / moje ogloszenia / gorne przyciski
- `app/app/company/offers/page.tsx`
  - Bezpieczne: header, alert po utworzeniu, wrapper.
  - Nie zmieniac agregacji statsMap.
- `app/app/company/offers/offers-tabs.tsx`
  - Bezpieczne: opis/list wrapper.
- `app/app/company/offers/jobs-tab.tsx`
  - Bezpieczne: summary tiles, filtry, sekcje, empty states.
  - Ostroznie: `filters`, `visibleItems`, grupowanie po stage/state.
- `app/app/company/offers/offer-card.tsx`
  - Bezpieczne: premium karta, badges, CTA visual hierarchy.
  - Nie zmieniac `resolveOfferCardModel` bez review produktowo-logicznego.
- `app/app/company/offers/services-tab.tsx`
  - Prawdopodobnie legacy/nieuzywany w aktualnym `OffersTabs`; nie priorytet.

### Widok zamowienia uslugi systemowej
- `app/app/company/orders/[id]/page.tsx`
  - Bezpieczne: layout briefu, wybrana usluga, wykonawca, candidate cards.
  - Nie zmieniac wyboru studenta, findConversation, snapshot parsing.
- `app/app/company/orders/[id]/company-order-detail-actions.tsx`
  - Bezpieczne tylko style CTA.
- `app/app/company/orders/page.tsx`
- `app/app/company/orders/company-orders-client.tsx`
  - Bezpieczne: lista zamowien firmy, filtry, karty.
- `app/app/orders/create/[packageId]/order-form.tsx`
  - Bezpieczne: layout formularza zamawiania.
  - Nie zmieniac walidacji linkow/normalizacji bez osobnego zadania.

### Status / etapy / umowy / escrow
- `app/app/deliverables/[id]/page.tsx`
  - Bezpieczne: header, tabs, layout shell.
  - Nie zmieniac auto-heal contract RPC ani auth guardow.
- `app/app/deliverables/[id]/tabs/StatusTab.tsx`
  - Bezpieczne: stepper, karty etapow, spacing, badges, sekcje informacyjne.
  - Nie zmieniac `canEnterEscrow`, `contractsAccepted`, `hasAgreedMilestones`, `isEscrowReady`, action handlers.
- `app/app/deliverables/[id]/tabs/ContractDocumentsCard.tsx`
  - Bezpieczne: wyglad dokumentow, CTA, statusy wizualne.
  - Nie zmieniac akcji generate/accept/reopen ani widocznosci dokumentow.
- `app/app/deliverables/[id]/tabs/ChatTab.tsx`
- `app/app/deliverables/[id]/tabs/FilesTab.tsx`
- `app/app/deliverables/[id]/tabs/SecretsTab.tsx`
  - Bezpieczne: polish layoutowy, nie zmieniac uprawnien i upload/download flow.

## Pliki ryzykowne - Claude nie powinien ruszac w rundzie layoutowej

### Server actions i status/payment transitions
- `app/app/chat/_actions.ts`
- `app/app/applications/_actions.ts`
- `app/app/company/applications/_actions.ts`
- `app/app/services/_actions.ts`
- `app/app/deliverables/_actions.ts`
- `app/app/company/packages/_actions.ts`
- `app/app/company/offers/_actions.ts`
- `app/app/orders/create/[packageId]/_actions.ts`
- `app/app/cancel/[id]/_actions.ts`
- `app/app/offers/[id]/_actions.ts`
- `app/app/offers/[id]/saved-actions.ts`

### Payment / Stripe / cron / ledger
- `app/api/stripe/create-checkout/route.ts`
- `app/api/stripe/verify-payment/route.ts`
- `app/api/stripe/webhook/route.ts`
- `app/api/cron/auto-accept/route.ts`
- `app/api/cron/process-stripe-events/route.ts`
- `lib/stripe/stripe-event-processor.ts`
- `lib/stripe.ts`

### Supabase admin/server primitives
- `lib/supabase/server.ts`
- `lib/supabase/client.ts`
- `lib/supabase/admin.ts`
- `proxy.ts`
- `supabase/migrations/*`
- `supabase/release*.sql`

### Documents/legal/security
- `lib/pdf/*`
- `app/api/documents/download/route.ts`
- `app/app/finances/*`
- `app/app/company/documents/*`
- `hooks/use-student-documents.ts`
- `hooks/use-company-documents.ts`

### Business service helpers
- `lib/services/service-order-conversations.ts`
- `lib/services/service-order-snapshots.ts`
- `lib/services/private-proposals.ts`
- `lib/services/package-customization.ts`
- `lib/services/logo-student-selection.ts`
- `lib/services/system-services.ts`

## Proponowana kolejnosc prac
1. Wspolne wrappery i header consistency: `PremiumPageHeader`, `PageContainer`, strony `jobs/services/applications/company offers`.
2. Student applications: tabs, cards, status copy, CTA hierarchy.
3. Student service dashboard: buckets, order cards, system order detail.
4. Company offers/orders: summary tiles, top buttons, cards.
5. Chat UI: sidebar, dymki, proposal cards, menu actions.
6. Student profile: premium layout, spacing, cards.
7. Deliverables status shell: stepper/card polish tylko po snapshot review, bez zmiany warunkow flow.

## Zasady design consistency dla Claude
- Nie zmieniac logiki warunkow, tylko klasy Tailwind/uklad JSX.
- Preferowac `Button`, `Badge`, `Card`, `Tabs`, `Input`, `Select`, `DropdownMenu` z shadcn.
- Przyciski z kolorowym tlem musza miec bialy tekst, chyba ze sa `outline/ghost`.
- Nie dodawac nowych gradient-orb dekoracji; obecne ograniczac, jesli przeszkadzaja w czytelnosci.
- Karty operacyjne: `rounded-2xl`/`rounded-3xl`, subtelny border, bez zagniezdzania kart w kartach.
- Statusy: zachowac semantyke kolorow: amber=decyzja/oczekiwanie, red=blokada/odrzucenie, emerald=zaakceptowane/zakonczone, indigo/blue=aktywny proces.
- Mobile first: tabs i CTA musza zawijac sie bez overlapu, listy nie moga wymuszac poziomego scrolla poza kontrolowanym filtrem.
- Nie uzywac hero-scale typografii wewnatrz kart/list.
- Po zmianie kilku TSX uruchomic screenshot QA w browserze dla desktop i mobile na najwazniejszych trasach.

## Minimalne trasy QA po polish
- Student: `/app/applications`
- Student: `/app/services/dashboard`
- Student: `/app/services/dashboard/[id]`
- Student/Firma: `/app/chat/[id]`
- Firma: `/app/company/offers`
- Firma: `/app/company/orders/[id]`
- Firma: `/app/students/[id]`
- Realizacja: `/app/deliverables/[id]`

## Kryteria stop
Przerwac polish i eskalowac, jesli zmiana wymaga:
- edycji `_actions.ts`,
- edycji migracji lub SQL,
- zmiany statusow albo mapowania flow,
- zmiany warunkow wejscia do escrow,
- zmiany widocznosci dokumentow per rola,
- zmiany Stripe/Supabase auth/storage.
