"use server";

import { ceidgClient } from "@/lib/ceidg/client";

export async function checkNipAction(formData: FormData) {
    const nip = formData.get("nip") as string;
    if (!nip) return { error: "Podaj NIP" };

    try {
        const data = await ceidgClient.getCompanyByNip(nip);
        return { data };
    } catch (err: any) {
        return { error: err.message };
    }
}
