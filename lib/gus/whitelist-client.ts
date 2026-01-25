export interface CompanyData {
    name: string;
    nip: string;
    address: string;
    city?: string;
    postCode?: string;
    street?: string;
}

export class VatWhiteListClient {
    private baseUrl = "https://wl-api.mf.gov.pl/api/search/nip";

    async getCompanyByNip(nip: string): Promise<CompanyData | null> {
        // API Białej Listy wymaga daty w zapytaniu (format YYYY-MM-DD)
        const now = new Date();
        const date = now.toISOString().split('T')[0]; // Format YYYY-MM-DD

        const cleanNip = nip.replace(/[^0-9]/g, "");

        // URL: /api/search/nip/{nip}?date={date}
        const url = `${this.baseUrl}/${cleanNip}?date=${date}`;

        try {
            console.log(`[VAT] Fetching data for NIP: ${cleanNip}`);
            const res = await fetch(url, {
                headers: {
                    "Accept": "application/json",
                    "User-Agent": "Student2Work-App/1.0"
                },
                next: { revalidate: 3600 }
            });

            if (!res.ok) {
                console.error("[VAT] API Error:", res.status, res.statusText);
                if (res.status === 404) return null;
                if (res.status === 429) throw new Error("Przekroczono limit zapytań do Białej Listy VAT. Spróbuj później.");
                throw new Error(`Błąd API Białej Listy: ${res.status}`);
            }

            const json = await res.json();
            const subject = json?.result?.subject;

            if (!subject) return null;

            // Parsowanie adresu
            const rawAddress = subject.workingAddress || subject.residenceAddress || "";

            let city = "";
            let postCode = "";

            let street = rawAddress;

            const postCodeMatch = rawAddress.match(/[0-9]{2}-[0-9]{3}/);
            if (postCodeMatch) {
                postCode = postCodeMatch[0];
                const parts = rawAddress.split(postCode);

                // Część przed kodem to zazwyczaj ulica
                if (parts[0]) {
                    street = parts[0].replace(/,$/, '').replace(/ul\./i, '').trim(); // Usuwamy końcowy przecinek i 'ul.' jeśli chcemy czystą nazwę
                    if (street.length < 2) street = parts[0]; // Fallback jeśli wycięliśmy za dużo
                }

                // Część po kodzie to zazwyczaj miasto
                if (parts[1]) {
                    city = parts[1].trim();
                }
            }

            return {
                name: subject.name || subject.firstName + " " + subject.lastName,
                nip: subject.nip,
                address: rawAddress, // Oryginalny pełny
                city: city,
                postCode: postCode,
                street: street // Wyekstrahowana ulica
            };

        } catch (err) {
            console.error("[VAT] Connection failed", err);
            // Re-throw to inform user
            throw err;
        }
    }
}

export const vatWhiteListClient = new VatWhiteListClient();
