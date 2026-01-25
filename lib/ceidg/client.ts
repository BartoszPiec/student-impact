import { env } from "process";

export interface CeidgCompanyData {
    name: string;
    nip: string;
    regon?: string;
    status?: "active" | "suspended" | "terminated";
    address?: {
        street?: string;
        city?: string;
        postCode?: string;
    };
}

/**
 * Klient do komunikacji z API CEIDG (Hurtownia Danych).
 * Dokumentacja: https://dane.biznes.gov.pl/api/ceidg/v2/
 */
export class CeidgClient {
    private apiKey: string | undefined;
    private baseUrl = "https://dane.biznes.gov.pl/api/ceidg/v2";

    constructor() {
        this.apiKey = process.env.CEIDG_API_KEY || "eyJraWQiOiJjZWlkZyIsImFsZyI6IkhTNTEyIn0.eyJnaXZlbl9uYW1lIjoiQmFydG9zeiIsInBlc2VsIjoiOTkwOTEwMDA2OTkiLCJpYXQiOjE3NjcxOTUxOTIsImZhbWlseV9uYW1lIjoiUGllYyIsImNsaWVudF9pZCI6IlVTRVItOTkwOTEwMDA2OTktQkFSVE9TWi1QSUVDIn0.B2L9-vi67GJx7foLiSJ5BxpflLiUpif8cmw_WyzEsmvghgsA3e29JS96npbZABTqZtBuGlVPxOqSgaI7_PJpwA";
    }

    async getCompanyByNip(nip: string): Promise<CeidgCompanyData | null> {
        // 1. Tryb symulacji (jeśli brak klucza lub środowisko testowe)
        if (!this.apiKey || process.env.NEXT_PUBLIC_SIMULATE_CEIDG === "true") {
            console.log("[CEIDG] Running in simulation mode for NIP:", nip);
            return this.simulateResponse(nip);
        }

        try {
            // 2. Połączenie z prawdziwym API
            const url = `${this.baseUrl}/firmy?nip=${nip}`;
            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    Accept: "application/json",
                },
                next: { revalidate: 3600 }, // cache na 1h
            });

            if (!res.ok) {
                console.error("[CEIDG] API Error:", res.status, res.statusText);
                if (res.status === 404) {
                    throw new Error(`Nie znaleziono firmy o NIP ${nip} w CEIDG (Sprawdź czy to nie spółka KRS?).`);
                }
                if (res.status === 401 || res.status === 403) {
                    throw new Error(`Błąd autoryzacji API (${res.status}). Klucz API może być niepoprawny lub wygasł.`);
                }
                const text = await res.text(); // Try to get more info from body
                throw new Error(`Błąd API CEIDG (${res.status}): ${text || res.statusText}`);
            }

            const data = await res.json();
            const firm = data.firmy?.[0];

            if (!firm) {
                throw new Error("API zwróciło pustą listę firm.");
            }

            return {
                name: firm.nazwa,
                nip: firm.nip,
                regon: firm.regon,
                status: firm.status === "AKTYWNY" ? "active" : "suspended",
                address: {
                    city: firm.adresDzialalnosci?.miasto,
                    street: firm.adresDzialalnosci?.ulica,
                    postCode: firm.adresDzialalnosci?.kodPocztowy,
                },
            };

        } catch (err) {
            console.error("[CEIDG] Real API validation failed", err);
            // Re-throw error to be visible in UI instead of falling back to fake data
            throw err;
        }
    }

    private simulateResponse(nip: string): CeidgCompanyData {
        // Symulacja danych na potrzeby demo
        return {
            name: `Firma Testowa (NIP: ${nip})`,
            nip: nip,
            status: "active",
            address: {
                city: "Warszawa",
                street: "Złota 44",
                postCode: "00-001",
            },
        };
    }
}

export const ceidgClient = new CeidgClient();
