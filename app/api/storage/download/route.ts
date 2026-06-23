import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  assertCanAccessStorageRef,
  createPrivateSignedUrl,
  parseStorageRef,
} from "@/lib/security/storage";
import { sanitizeDownloadName } from "@/lib/security/upload-policy";

export const dynamic = "force-dynamic";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(req: NextRequest) {
  const rawRef = req.nextUrl.searchParams.get("ref");
  if (!rawRef) {
    return jsonError("Brak referencji pliku.", 400);
  }

  const parsed = parseStorageRef(rawRef);
  if (!parsed) {
    return jsonError("Nieprawidłowa referencja pliku.", 400);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  try {
    const ref = await assertCanAccessStorageRef(user.id, parsed.ref);
    const fileName = sanitizeDownloadName(ref.path.split("/").pop() ?? "plik");
    const signedUrl = await createPrivateSignedUrl(ref, {
      expiresInSeconds: 300,
      download: fileName,
    });

    return NextResponse.redirect(signedUrl, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return jsonError("Brak dostepu do pliku.", 403);
  }
}
