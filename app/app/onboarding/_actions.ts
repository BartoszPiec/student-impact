"use server";

import { vatWhiteListClient } from "@/lib/gus/whitelist-client";

export async function fetchCeidgData(nip: string) {
    if (!nip) return { error: "Podaj numer NIP" };

    const cleanNip = nip.replace(/[^0-9]/g, "");

    if (cleanNip.length !== 10) {
        return { error: "NIP musi składać się z 10 cyfr" };
    }

    try {
        // Używamy Białej Listy VAT (obsługuje Sp. z o.o.)
        const data = await vatWhiteListClient.getCompanyByNip(cleanNip);

        if (!data) {
            return { error: "Nie znaleziono firmy na Białej Liście VAT (lub nie jest płatnikiem VAT)." };
        }

        // Mapujemy dane
        return {
            data: {
                name: data.name,
                address: {
                    street: data.address,
                    city: data.city,
                    postCode: data.postCode
                }
            }
        };
    } catch (err: any) {
        return { error: err.message };
    }
}
