import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_PROJECT_REF = (() => {
  try {
    return new URL(SUPABASE_URL).host.split(".")[0] ?? "";
  } catch {
    return "";
  }
})();
const SUPABASE_ISSUER = `${SUPABASE_URL}/auth/v1`;
const JWKS = createRemoteJWKSet(new URL(`${SUPABASE_ISSUER}/.well-known/jwks.json`));

type AuthState = {
  isAuthed: boolean;
  userId: string | null;
};

function isJwtLike(value: string): boolean {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value);
}

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padLength = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + "=".repeat(padLength);
    return atob(padded);
  } catch {
    return null;
  }
}

function parseTokenFromSessionCookie(rawValue: string | null | undefined): string | null {
  if (!rawValue) return null;

  const decodedBase64 = rawValue.startsWith("base64-")
    ? decodeBase64Url(rawValue.slice("base64-".length))
    : null;

  const decodedUri = (() => {
    try {
      return decodeURIComponent(rawValue);
    } catch {
      return null;
    }
  })();

  const candidates = [rawValue, decodedBase64, decodedUri].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (isJwtLike(candidate)) {
      return candidate;
    }

    try {
      const parsed = JSON.parse(candidate) as unknown;

      if (Array.isArray(parsed) && typeof parsed[0] === "string" && isJwtLike(parsed[0])) {
        return parsed[0];
      }

      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "access_token" in parsed &&
        typeof (parsed as { access_token: unknown }).access_token === "string"
      ) {
        const token = (parsed as { access_token: string }).access_token;
        if (isJwtLike(token)) {
          return token;
        }
      }

      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "currentSession" in parsed &&
        typeof (parsed as { currentSession?: { access_token?: unknown } }).currentSession?.access_token === "string"
      ) {
        const token = (parsed as { currentSession: { access_token: string } }).currentSession.access_token;
        if (isJwtLike(token)) {
          return token;
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

function getCombinedCookieValue(cookies: Array<{ name: string; value: string }>, baseName: string): string | null {
  const root = cookies.find((cookie) => cookie.name === baseName);
  if (root) {
    return root.value;
  }

  const chunkPrefix = `${baseName}.`;
  const chunks = cookies
    .filter((cookie) => cookie.name.startsWith(chunkPrefix))
    .map((cookie) => {
      const indexRaw = cookie.name.slice(chunkPrefix.length);
      const index = Number.parseInt(indexRaw, 10);
      return Number.isFinite(index) ? { index, value: cookie.value } : null;
    })
    .filter((item): item is { index: number; value: string } => item !== null)
    .sort((a, b) => a.index - b.index);

  if (!chunks.length) {
    return null;
  }

  return chunks.map((chunk) => chunk.value).join("");
}

function getSupabaseAccessToken(request: NextRequest): string | null {
  const allCookies = request.cookies.getAll().map((cookie) => ({ name: cookie.name, value: cookie.value }));

  const directToken = request.cookies.get("sb-access-token")?.value;
  const parsedDirect = parseTokenFromSessionCookie(directToken);
  if (parsedDirect) {
    return parsedDirect;
  }

  if (SUPABASE_PROJECT_REF) {
    const projectCookieBase = `sb-${SUPABASE_PROJECT_REF}-auth-token`;
    const combined = getCombinedCookieValue(allCookies, projectCookieBase);
    const parsedCombined = parseTokenFromSessionCookie(combined);
    if (parsedCombined) {
      return parsedCombined;
    }
  }

  const authCookieBaseNames = Array.from(
    new Set(
      allCookies
        .filter((cookie) => /^sb-.*-auth-token(\.\d+)?$/i.test(cookie.name))
        .map((cookie) => cookie.name.replace(/\.\d+$/, "")),
    ),
  );

  for (const baseName of authCookieBaseNames) {
    const combined = getCombinedCookieValue(allCookies, baseName);
    const token = parseTokenFromSessionCookie(combined);
    if (token) {
      return token;
    }
  }

  return null;
}

async function verifyJwtLocal(token: string): Promise<AuthState> {
  try {
    const { payload } = await jwtVerify(token, JWKS, { issuer: SUPABASE_ISSUER });
    const claims = payload as JWTPayload;

    if (typeof claims.sub !== "string" || typeof claims.exp !== "number") {
      return { isAuthed: false, userId: null };
    }

    if (claims.exp * 1000 <= Date.now()) {
      return { isAuthed: false, userId: null };
    }

    return { isAuthed: true, userId: claims.sub };
  } catch {
    return { isAuthed: false, userId: null };
  }
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const path = request.nextUrl.pathname;
  const isApp = path.startsWith("/app");
  const isAuth = path.startsWith("/auth");
  const isAdminRoute = path.startsWith("/app/admin");
  const isOnboardingRoute = path.startsWith("/app/onboarding") || path.startsWith("/app/profile");

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let authState: AuthState = { isAuthed: false, userId: null };
  const token = getSupabaseAccessToken(request);

  if (token) {
    authState = await verifyJwtLocal(token);
  }

  const shouldFallbackAuthCheck =
    isAdminRoute ||
    (isApp && !authState.isAuthed) ||
    (isAuth && Boolean(token) && !authState.isAuthed);

  // Fallback network auth check only when needed:
  // - protected app routes with missing/invalid token
  // - admin routes (stronger check)
  // - auth routes only when token exists but local JWT verify failed
  if (shouldFallbackAuthCheck) {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      authState = { isAuthed: true, userId: data.user.id };
    } else {
      authState = { isAuthed: false, userId: null };
    }
  }

  Sentry.setUser(authState.isAuthed && authState.userId ? { id: authState.userId } : null);

  if (isApp && !authState.isAuthed) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  if (isAuth && authState.isAuthed) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  if (isApp && authState.isAuthed && authState.userId && !isOnboardingRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", authState.userId)
      .maybeSingle();

    const role = profile?.role ?? null;
    let hasDetails = false;

    if (role === "student") {
      const { data: studentProfile } = await supabase
        .from("student_profiles")
        .select("kierunek")
        .eq("user_id", authState.userId)
        .maybeSingle();
      hasDetails = Boolean(studentProfile?.kierunek);
    } else if (role === "company") {
      const { data: companyProfile } = await supabase
        .from("company_profiles")
        .select("nazwa")
        .eq("user_id", authState.userId)
        .maybeSingle();
      hasDetails = Boolean(companyProfile?.nazwa && companyProfile.nazwa !== "Firma Bez Nazwy");
    } else if (role === "admin") {
      hasDetails = true;
    }

    const needsOnboarding = role !== "admin" && !hasDetails;

    if (needsOnboarding) {
      const redirectResponse = NextResponse.redirect(new URL("/app/onboarding", request.url));
      redirectResponse.cookies.set("onboarding_complete", "0", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 30,
      });
      return redirectResponse;
    }

    response.cookies.set("onboarding_complete", "1", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/auth"],
};
