"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Nieautoryzowany");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Brak uprawnień administratora");
  }
}

export async function getContractDocuments(contractId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  // 1. List files in the contract's directory
  // Path pattern: contracts/{contractId}/
  const { data: files, error: listError } = await supabase.storage
    .from("deliverables")
    .list(`contracts/${contractId}/`);

  if (listError) {
    console.error("Error listing contract files:", listError);
    throw new Error("Nie udało się pobrać listy plików.");
  }

  if (!files || files.length === 0) {
    return [];
  }

  // 2. Generate signed URLs for all PDFs
  const pdfFiles = files.filter(f => f.name.endsWith(".pdf"));
  
  const signedUrls = await Promise.all(
    pdfFiles.map(async (file) => {
      const filePath = `contracts/${contractId}/${file.name}`;
      const { data, error } = await supabase.storage
        .from("deliverables")
        .createSignedUrl(filePath, 60 * 60 * 24); // 24 hours expiry

      return {
        name: file.name,
        url: data?.signedUrl || null,
        error: error?.message || null
      };
    })
  );

  return signedUrls.filter(item => item.url !== null);
}
