
export type NotificationRoutePayload = Record<string, unknown> & {
    redirect_path?: unknown;
    target_url?: unknown;
    href?: unknown;
    conversation_id?: unknown;
    application_id?: unknown;
    service_order_id?: unknown;
    order_id?: unknown;
    offer_id?: unknown;
    contract_id?: unknown;
};

type NotificationPayload = NotificationRoutePayload;

function getPayloadString(payload: NotificationRoutePayload, key: keyof NotificationRoutePayload) {
    const value = payload[key];
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getSafeAppPath(value: string | null) {
    if (!value) {
        return null;
    }

    return value === "/app" || value.startsWith("/app/") ? value : null;
}

export function getNotificationHref(n: { payload?: NotificationRoutePayload | null }): string {
    const payload = n.payload ?? {};
    const directPath = getSafeAppPath(
        getPayloadString(payload, "redirect_path")
        ?? getPayloadString(payload, "target_url")
        ?? getPayloadString(payload, "href"),
    );

    if (directPath) {
        return directPath;
    }

    const conversationId = getPayloadString(payload, "conversation_id");
    if (conversationId) {
        return `/app/chat/${encodeURIComponent(conversationId)}`;
    }

    const applicationId = getPayloadString(payload, "application_id");
    if (applicationId) {
        return `/app/deliverables/${encodeURIComponent(applicationId)}`;
    }

    const serviceOrderId = getPayloadString(payload, "service_order_id")
        ?? getPayloadString(payload, "order_id");
    if (serviceOrderId) {
        return `/app/deliverables/${encodeURIComponent(serviceOrderId)}`;
    }

    const offerId = getPayloadString(payload, "offer_id");
    if (offerId) {
        return `/app/offers/${encodeURIComponent(offerId)}`;
    }

    const contractId = getPayloadString(payload, "contract_id");
    if (contractId) {
        return `/app/notifications?contract=${encodeURIComponent(contractId)}`;
    }

    return "/app/notifications";
}

export function getNotificationTitle(n: { typ: string; payload?: NotificationPayload | null, content?: string | null }): string {
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

        // ── Depozyt / finansowanie ───────────────────────────────────────
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

        // ── Spory / Zgłoszenia ───────────────────────────────────────────
        case "problem_reported":
            return `Zgłoszenie problemu od: ${p.reported_by === "firma" ? "firmy" : "studenta"}`;

        default:
            return typeof p.snippet === "string"
                ? p.snippet
                : typeof p.message === "string"
                    ? p.message
                    : "Nowe powiadomienie";
    }
}
