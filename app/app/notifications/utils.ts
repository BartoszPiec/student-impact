
export function getNotificationTitle(n: { typ: string; payload?: any, content?: string | null }) {
    if (n.content) return n.content; // Fallback to content if set (legacy)

    const p = n.payload || {};

    switch (n.typ) {
        // ── Wiadomości ──────────────────────────────────────────────────
        case "MESSAGE":
        case "new_message":
        case "message_new":
            return p.offer_title
                ? `Nowa wiadomość: ${p.offer_title}`
                : "Nowa wiadomość";

        // ── Zgłoszenia / Aplikacje ───────────────────────────────────────
        case "OFFER":
        case "new_offer":
            return `Nowa oferta: ${p.title || "Bez tytułu"}`;

        case "APPLICATION":
        case "new_application":
        case "application_sent":
            return `Nowe zgłoszenie: ${p.offer_title || "Oferta"}`;

        case "application_new":
            return `Nowe zapytanie o usługę: ${p.offer_title || "Usługa"}`;

        case "application_accepted":
        case "application_accepted_auto":
            return `Zgłoszenie zaakceptowane: ${p.offer_title || "Oferta"}`;

        case "application_rejected":
            return `Zgłoszenie odrzucone: ${p.offer_title || "Oferta"}`;

        case "application_withdrawn":
            return `Kandydat wycofał zgłoszenie: ${p.offer_title || "Oferta"}`;

        case "offer_closed":
            return `Oferta zamknięta: ${p.offer_title || "Oferta"}`;

        // ── Negocjacje ───────────────────────────────────────────────────
        case "negotiation_proposed":
            return `Nowa propozycja stawki: ${p.offer_title || "Oferta"}`;

        case "counter_offer":
        case "application_countered":
            return `Kontroferta: ${p.offer_title || "Oferta"}`;

        case "counter_accepted":
            return `Kontroferta zaakceptowana: ${p.offer_title || "Oferta"}`;

        case "counter_rejected":
            return `Kontroferta odrzucona: ${p.offer_title || "Oferta"}`;

        // ── Warunki umowy ────────────────────────────────────────────────
        case "terms_proposed":
            return `Propozycja warunków umowy: ${p.offer_title || "Oferta"}`;

        case "terms_updated":
            return `Zaktualizowane warunki umowy: ${p.offer_title || "Oferta"}`;

        case "terms_agreed":
            return `Warunki uzgodnione: ${p.offer_title || "Oferta"}`;

        // ── Escrow / Finansowanie ────────────────────────────────────────
        case "escrow_funded":
        case "contract_funded":
            return `Środki w depozycie – zacznij pracę! ${p.offer_title ? `(${p.offer_title})` : ""}`;

        // ── Kamienie milowe ──────────────────────────────────────────────
        case "milestone_submitted":
        case "milestone_delivered":
            return `Praca przesłana do etapu: ${p.milestone_title || p.title || "Etap"}`;

        case "milestone_accepted":
            return `Etap zaakceptowany: ${p.milestone_title || p.title || "Etap"}`;

        case "milestone_rejected":
            return `Etap odrzucony: ${p.milestone_title || p.title || "Etap"}`;

        // ── Dostarczenie (legacy flow) ───────────────────────────────────
        case "deliverable_submitted":
        case "deliverable_new":
            return `Praca przesłana do oceny: ${p.offer_title || "Zlecenie"}`;

        case "deliverable_accepted":
        case "job_approved":
            return `Praca zaakceptowana: ${p.offer_title || "Zlecenie"}`;

        case "deliverable_rejected":
            return `Praca odrzucona – wymagane poprawki: ${p.offer_title || "Zlecenie"}`;

        // ── Oceny ────────────────────────────────────────────────────────
        case "review_received":
        case "review_submitted":
            return p.rating
                ? `Otrzymałeś ocenę ${p.rating}/5 za: ${p.offer_title || "zlecenie"}`
                : `Otrzymałeś nową ocenę`;

        // ── Zakończenie / Anulowanie ─────────────────────────────────────
        case "JOB_COMPLETED":
            return `Zlecenie ukończone: ${p.offer_title || "Oferta"}`;

        case "cooperation_cancelled":
            return `Zlecenie anulowane: ${p.offer_title || "Zlecenie"}`;

        default:
            return p.snippet || p.message || "Nowe powiadomienie";
    }
}
