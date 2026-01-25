
export function getNotificationTitle(n: { typ: string; payload: any, content?: string | null }) {
    if (n.content) return n.content; // Fallback to content if set (legacy)

    const p = n.payload || {};

    switch (n.typ) {
        case "OFFER":
        case "new_offer":
            return `Nowa oferta: ${p.title || "Bez tytułu"}`;

        case "APPLICATION":
        case "new_application":
            return `Nowe zgłoszenie: ${p.offer_title || "Oferta"}`;

        case "MESSAGE":
        case "new_message":
        case "message_new":
            return `Nowa wiadomość: ${p.offer_title || "Oferta"}`;

        case "negotiation_proposed":
            return `Nowa propozycja stawki: ${p.offer_title || "Oferta"}`;

        case "counter_offer":
        case "application_countered":
            return `Kontroferta: ${p.offer_title || "Oferta"}`;

        case "application_accepted":
            return `Zaakceptowano zgłoszenie: ${p.offer_title || "Oferta"}`;

        case "application_rejected":
            return `Odrzucono zgłoszenie: ${p.offer_title || "Oferta"}`;

        case "counter_accepted":
        case "counter_rejected":
            return `Decyzja ws. negocjacji: ${p.offer_title || "Oferta"}`;

        case "JOB_COMPLETED":
            return `Zlecenie wykonane: ${p.offer_title || "Oferta"}`;

        case "job_approved":
            return `Zatwierdzono wykonanie: ${p.offer_title || "Oferta"}`;

        case "milestone_delivered":
            return `Otrzymano pracę: ${p.title || "Kamień milowy"}`;

        case "milestone_accepted":
            return `Zlecenie zaakceptowane: ${p.title || "Kamień milowy"}`;

        case "milestone_rejected":
            return `Zlecenie odrzucone: ${p.title || "Kamień milowy"}`;

        default:
            return p.message || "Nowe powiadomienie";
    }
}
