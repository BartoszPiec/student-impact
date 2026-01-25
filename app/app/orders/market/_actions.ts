"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function acceptOrder(orderId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // 1. Sprawdź czy student
    // ... (można pominąć, RLS i tak zablokuje jeśli nie ma uprawnień, ale dla UX warto sprawdzić)

    // 2. Próba przypisania (Atomic update)
    // Używamy warunku: student_id is null, aby uniknąć race condition (kto pierwszy ten lepszy)
    const { data, error } = await supabase
        .from("service_orders")
        .update({
            student_id: user.id,
            status: "in_progress",
            updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .is("student_id", null) // KLUCZOWE: tylko jeśli nikt nie wziął
        .select()
        .single();

    if (error || !data) {
        throw new Error("Ktoś Cię ubiegł! Zlecenie już nie jest dostępne.");
    }

    revalidatePath("/app/orders/market");
    redirect(`/app/orders/${orderId}`);
}
