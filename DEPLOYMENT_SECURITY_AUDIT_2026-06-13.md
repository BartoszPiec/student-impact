# Deployment security audit - 2026-06-13

## Executive summary

Audyt nie wykazal, zeby realne klucze Stripe/Supabase/Sentry byly sledzone w git. Sledzony jest tylko `.env.example`, a lokalne `.env.local`, `.env.sentry-build-plugin` oraz `.vercel/*` sa ignorowane przez `.gitignore`. Vercel pokazuje sekrety jako `Encrypted`.

Produkcja nie jest jednak gotowa do deploymentu: obecna konfiguracja produkcyjna nie spelnia checkow dla live Stripe, webhooka Stripe, DNS domeny, Upstash rate limiting i Sentry DSN. To sa blokery przed wpuszczeniem uzytkownikow.

## Scope

- Skan sekretow w tracked/untracked files bez ujawniania wartosci.
- Sprawdzenie historii git pod katem `.env*` i plikow z sekretami.
- Przeglad granic server/client dla `SUPABASE_SERVICE_ROLE_KEY` i `STRIPE_SECRET_KEY`.
- Przeglad Next/Vercel env, naglowkow, CSRF/origin guardow, rate limitingu, Stripe webhookow, Supabase RLS readiness.
- Komendy weryfikacyjne:
  - `git ls-files | rg ...`
  - `git log --all -- .env.local app/.env.local .env.sentry-build-plugin .vercel/env.preview.local .vercel/env.production.local`
  - `npx vercel env ls`
  - `npm run check:production -- --env-file=.vercel/env.production.local`

## Findings

### F-01 - Production deployment is blocked by environment/config drift

Severity: Critical

Location:
- `scripts/validate-deploy-env.mjs:15`
- runtime check: `npm run check:production -- --env-file=.vercel/env.production.local`

Evidence:
- Production validation requires Supabase, Stripe, cron, Upstash, Sentry and HTTPS app URL in `scripts/validate-deploy-env.mjs:16-25`.
- Production validation requires live Stripe keys in `scripts/validate-deploy-env.mjs:27-34`.
- The production readiness run failed on:
  - missing `UPSTASH_REDIS_REST_URL`
  - missing `UPSTASH_REDIS_REST_TOKEN`
  - missing `SENTRY_DSN`
  - Stripe secret key not in live mode
  - Stripe publishable key not in live mode
  - DNS `student2work.pl` not pointing to Vercel `76.76.21.21`
  - no enabled Stripe webhook for `https://student2work.pl/api/stripe/webhook`

Impact:
Production deploy should not be promoted yet. If bypassed, real payments/webhooks/rate limiting/observability would be unreliable or misconfigured.

Fix:
Before production deploy, set live production values in Vercel, point DNS to Vercel, create the live Stripe webhook for `https://student2work.pl/api/stripe/webhook`, and re-run `npm run check:production -- --env-file=.vercel/env.production.local`.

False positive notes:
The check used locally pulled `.vercel/env.production.local`; Vercel CLI also showed env names as encrypted, but the currently pulled production config still fails readiness.

### F-02 - Rate limiting fails open when Upstash is absent

Severity: High

Location:
- `lib/rate-limit.ts:17`
- `lib/rate-limit.ts:21`
- `lib/rate-limit.ts:79`

Evidence:
If `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` is missing, `redis` is `null`, limiters are `null`, and `enforceRateLimit()` returns `fallbackResult` with `success: true`.

Impact:
Without Upstash, `/auth`, `/app`, checkout, CEIDG, application, chat and notification throttles are not enforced. This matters before public users because login/signup/payment-adjacent endpoints become brute-force and abuse-prone.

Fix:
Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Production and Preview Vercel env. Current production `prebuild` already blocks missing production Upstash, which is correct.

Mitigation:
Keep Vercel Firewall / WAF rate limits enabled for `/auth`, `/api/stripe/*`, `/api/auth/*`, and `/app/*`.

### F-03 - Stripe secret module needed an explicit server-only boundary

Severity: Medium

Location:
- `lib/stripe.ts:1`

Evidence:
`lib/stripe.ts` reads `STRIPE_SECRET_KEY` and initializes the Stripe SDK. It was only imported by server routes/actions during this audit, but the module itself did not previously prevent future client imports.

Impact:
A future accidental import into a `"use client"` component could fail late or risk bundling boundary mistakes.

Fix:
Fixed in this audit by adding `import "server-only";` to `lib/stripe.ts`.

### F-04 - Local QA artifacts contained sensitive test data and were not ignored

Severity: Medium

Location:
- `.fable-qa/`
- `QA_LIVE_COLLAB.md`
- `.gitignore`

Evidence:
`git status` showed `.fable-qa/` and `QA_LIVE_COLLAB.md` as untracked. Pattern scan found email/password-like test data markers in those artifacts.

Impact:
They could be accidentally added in a later commit, leaking reusable test account credentials or operational notes.

Fix:
Fixed in this audit by adding `.fable-qa/` and `QA_LIVE_COLLAB.md` to `.gitignore`.

### F-05 - Production CSP still allows inline scripts

Severity: Medium

Location:
- `next.config.ts:41`

Evidence:
Production CSP includes `script-src 'self' 'unsafe-inline' ...`.

Impact:
This weakens CSP as an XSS defense-in-depth layer. React escaping still protects normal rendering, and no direct `dangerouslySetInnerHTML` sink was found in the app scan, but inline scripts reduce browser-side blast-radius protection if an injection appears later.

Fix:
Plan migration to nonce/hash-based CSP. This is not a quick safe patch because Next/Sentry/Stripe/Turnstile compatibility must be tested on preview.

### F-06 - Stripe webhook must be registered for the exact deployed production URL

Severity: High

Location:
- `app/api/stripe/webhook/route.ts:40`
- `scripts/production-readiness-check.mjs:128`

Evidence:
The route requires `STRIPE_WEBHOOK_SECRET` and verifies raw-body Stripe signatures. Readiness failed because Stripe has no enabled endpoint for `https://student2work.pl/api/stripe/webhook`.

Impact:
Payment lifecycle events will not reliably update DB state in production, even though the route code verifies signatures correctly.

Fix:
Create a live Stripe webhook endpoint for `https://student2work.pl/api/stripe/webhook` with required events:
- `checkout.session.completed`
- `checkout.session.expired`
- `account.updated`
- `charge.refunded`
- `refund.created`

Then set the matching live `STRIPE_WEBHOOK_SECRET` in Vercel Production.

## Keys and secret exposure status

Passed:
- No tracked `.env.local`, `.env.sentry-build-plugin`, `.vercel/env.*`, `.pem`, `.key`, credentials or secret files were found.
- Git history check for `.env.local`, `app/.env.local`, `.env.sentry-build-plugin`, `.vercel/env.preview.local`, `.vercel/env.production.local` returned no commits.
- `git ls-files` only shows `.env.example` for env files.
- `git check-ignore` confirms `.env.local`, `app/.env.local`, `.env.sentry-build-plugin`, and `.vercel/env.*` are ignored.
- `SUPABASE_SERVICE_ROLE_KEY` is only used server-side through `lib/supabase/admin.ts`, which has `import "server-only";`.
- Client components only reference `NEXT_PUBLIC_TURNSTILE_SITE_KEY` directly via `process.env`; this is intentionally public.
- Vercel CLI lists secret values as `Encrypted`, not plaintext.

Expected public keys:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` or non-public build env fallback `STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

Not safe to expose:
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CRON_SECRET`
- `SENTRY_AUTH_TOKEN`
- `RESEND_API_KEY`
- `TURNSTILE_SECRET_KEY`
- `UPSTASH_REDIS_REST_TOKEN`

## Deployment go/no-go

Current status: NO-GO for production.

Required before production:
1. Add production `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
2. Add production `SENTRY_DSN`.
3. Switch Stripe production env to live secret and live publishable keys.
4. Create live Stripe webhook for `https://student2work.pl/api/stripe/webhook` and update `STRIPE_WEBHOOK_SECRET`.
5. Point `student2work.pl` DNS to Vercel.
6. Re-run `npm run check:production -- --env-file=.vercel/env.production.local` and require 0 failures.
7. Re-run MVP E2E against the production preview/target after env changes.

