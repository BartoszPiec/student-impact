import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const COMPANY_DOCUMENT_TYPES = new Set(["contract_a", "invoice_company"]);
const STUDENT_DOCUMENT_TYPES = new Set(["contract_b", "invoice_student"]);

type DocumentAccessRow = {
  id: string;
  contract_id: string;
  document_type: string;
  storage_path: string | null;
  file_name: string | null;
  contracts:
    | {
        company_id: string | null;
        student_id: string | null;
      }
    | Array<{
        company_id: string | null;
        student_id: string | null;
      }>
    | null;
};

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function GET(request: NextRequest) {
  const documentId = request.nextUrl.searchParams.get("documentId");
  if (!documentId) {
    return NextResponse.json({ error: "Brak documentId." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  const admin = createAdminClient();
  const { data: document, error: documentError } = await admin
    .from("contract_documents")
    .select(`
      id,
      contract_id,
      document_type,
      storage_path,
      file_name,
      contracts!inner(
        company_id,
        student_id
      )
    `)
    .eq("id", documentId)
    .maybeSingle();

  if (documentError || !document) {
    return NextResponse.json({ error: "Nie znaleziono dokumentu." }, { status: 404 });
  }

  const typedDocument = document as DocumentAccessRow;
  const contract = unwrapRelation(typedDocument.contracts);
  const isCompanyOwner = contract?.company_id === user.id;
  const isStudentOwner = contract?.student_id === user.id;

  const documentType = typedDocument.document_type;
  const hasRoleAccess =
    (isCompanyOwner && COMPANY_DOCUMENT_TYPES.has(documentType)) ||
    (isStudentOwner && STUDENT_DOCUMENT_TYPES.has(documentType));

  if (!hasRoleAccess || !typedDocument.storage_path) {
    return NextResponse.json({ error: "Brak dostepu do dokumentu." }, { status: 403 });
  }

  const { data: signedUrlData, error: signedUrlError } = await admin.storage
    .from("deliverables")
    .createSignedUrl(typedDocument.storage_path, 60 * 60, {
      download: typedDocument.file_name || undefined,
    });

  if (signedUrlError || !signedUrlData?.signedUrl) {
    return NextResponse.json({ error: "Nie udalo sie wygenerowac linku do pobrania." }, { status: 500 });
  }

  return NextResponse.redirect(signedUrlData.signedUrl);
}
