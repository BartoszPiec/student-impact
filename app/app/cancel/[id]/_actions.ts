"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function cancelCooperation(applicationId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) throw new Error("Powód anulowania jest wymagany.");

  // 1) anuluj przez RPC (ustawia status + cancelled_at + cancel_reason)
  const { error } = await supabase.rpc("cancel_application", {
    p_application_id: applicationId,
    p_reason: reason,
  });
  if (error) throw new Error(`cancel_application failed: ${error.message}`);

  // 2) dopisz wiadomość do czatu (polish) – nie blokuj anulowania jeśli coś pójdzie nie tak
  try {
    // pobierz app + offer (do ustalenia stron i stworzenia rozmowy)
    const { data: appRow } = await supabase
      .from("applications")
      .select("id, student_id, offer_id, message")
      .eq("id", applicationId)
      .maybeSingle();

    if (appRow) {
      const { data: offer } = await supabase
        .from("offers")
        .select("id, company_id")
        .eq("id", appRow.offer_id)
        .maybeSingle();

      const companyId = offer?.company_id ?? null;
      const studentId = appRow.student_id ?? null;

      if (companyId && studentId) {
        // znajdź lub utwórz rozmowę
        const { data: existingConv } = await supabase
          .from("conversations")
          .select("id")
          .eq("application_id", applicationId)
          .maybeSingle();

        let conversationId = existingConv?.id ?? null;

        if (!conversationId) {
          const { data: created, error: createErr } = await supabase
            .from("conversations")
            .insert({
              application_id: applicationId,
              company_id: companyId,
              student_id: studentId,
              offer_id: appRow.offer_id,
            })
            .select("id")
            .single();

          if (createErr) throw createErr;
          conversationId = created.id;

          // jeśli było message przy aplikacji – wrzuć jako pierwszą wiadomość (żeby historia była pełna)
          const first = String((appRow as any).message ?? "").trim();
          if (first) {
            await supabase.from("messages").insert({
              conversation_id: conversationId,
              sender_id: studentId,
              body: first,
            });
          }
        }

        const who = user.id === companyId ? "firma" : "student";
        const systemBody = `🛑 Zlecenie anulowane przez ${who}.\nPowód: ${reason}`;

        await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: user.id, // zapisujemy jako nadawcę anulującego (bez zmian w schemacie)
          body: systemBody,
        });
      }
    }
  } catch {
    // ignorujemy – anulowanie ma działać nawet jeśli log czatu się nie uda
  }

  // revalidate
  revalidatePath(`/app/deliverables/${applicationId}`);
  revalidatePath(`/app/chat`);
  revalidatePath(`/app/chat/${applicationId}`);
  revalidatePath(`/app/notifications`);
  revalidatePath(`/app/applications`);
  revalidatePath(`/app/company/applications`);
  revalidatePath(`/app/company/offers`);
  revalidatePath(`/app`);

  redirect(`/app/deliverables/${applicationId}`);
}
