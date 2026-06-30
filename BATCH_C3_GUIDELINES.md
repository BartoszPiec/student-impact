# Batch C3 Guidelines

This file defines the next sprint batch after:
- Step 0 - CLOSED
- Batch S1 - CLOSED
- Batch C1 - CLOSED
- Batch C2 - CLOSED

## Batch Name

Batch C3 - Canonical Admin Shell And Route Map

## Primary Goal

Create one canonical admin information architecture before adding new ZIP panels.

We should not add `users`, `contracts`, `disputes` or other new admin surfaces on top of a fuzzy route structure.
First we align:
- what the canonical admin landing page is
- what the canonical admin navigation tree is
- which current admin modules are first-class
- which modules should be grouped, renamed or staged

## Why This Batch Exists

The repo now has a cleaner admin base after Batch C2:
- orphaned admin dashboard removed
- shared admin auth helper added
- redundant page-level guards reduced
- helper usage is more consistent

That cleanup removed technical drift, but we still need product/IA alignment before panel expansion from the ZIP.

## Scope

In scope:
- admin entrypoint and landing-page decision
- admin route taxonomy
- canonical navigation structure
- panel naming consistency
- phase map for ZIP-driven admin expansion
- identification of routes that should stay, merge or move

Out of scope:
- broad UI redesign
- full implementation of new ZIP panels
- finance deep-dive beyond route placement
- analytics event pipeline implementation
- new database work unless required by route decisions

## Current Known Admin Surface

Current admin routes in repo:
- `app/app/admin/analytics`
- `app/app/admin/exports`
- `app/app/admin/offers`
- `app/app/admin/payouts`
- `app/app/admin/pit`
- `app/app/admin/system-services`
- `app/app/admin/vault`

ZIP target gaps already known:
- no `users`
- no `contracts`
- no `disputes`
- no `settings`
- no finance subtree from spec

## Canonical Questions To Answer

Claude should answer these with evidence:

1. What should be the canonical admin landing page right now?
   Likely candidates:
   - `/app/admin/analytics`
   - a future `/app/admin`
   - a lightweight index page that routes to modules

2. What should be the canonical first-level nav tree?
   For example:
   - overview / analytics
   - operations
   - finance
   - legal
   - marketplace
   - settings

3. Which current routes map into those groups?

4. Which ZIP panels should be Phase A additions on top of the current repo?

5. Which current pages need only route/shell work versus real data/model work?

## Expected Output From Claude

Claude should not broadly implement.

Claude should produce one evidence-based audit/plan that contains:
- recommended canonical admin landing route
- recommended top-level admin nav tree
- current-to-target route mapping
- which modules should be grouped under `finance`
- which ZIP panels are safe to add next without schema churn
- risks of route churn or broken links
- proposed implementation order for Codex

Use `CHAT_REPORT_TEMPLATES.md`.

Recommended template:
- Audit Report if mostly analytical
- Plan Template if proposing implementation sequence

## Constraints

- Antigravity remains excluded unless re-enabled later
- `SPRINT_LIVE_BOARD.md` is the source of truth
- do not reopen closed security topics unless a new regression is confirmed
- do not invent missing backend capabilities as if they already exist
- separate current repo reality from ZIP target state

## Codex Implementation Target After This Audit

Assuming the audit is clean, the next implementation batch should likely be:

1. Add canonical `/app/admin` shell or redirect behavior
2. Normalize admin navigation / route groups
3. Add first new ZIP panel set:
   - `users`
   - `contracts`
   - `disputes`

But this should only happen after C3 defines the route map.

## Ready-To-Send Prompt For Claude

```text
Pracujemy dalej tylko z Codexem. Antigravity pozostaje wyłączone.

Przeczytaj:
1. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\SPRINT_LIVE_BOARD.md
2. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\SPRINT_COMMAND_CENTER_2026-03-26.md
3. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\CHAT_REPORT_TEMPLATES.md
4. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\BATCH_C3_GUIDELINES.md

Zadanie:
Przygotuj evidence-based audit + plan dla Batch C3: Canonical Admin Shell And Route Map.

Odpowiedz na:
- jaka powinna być kanoniczna strona wejścia admina
- jaki powinien być top-level admin route tree
- jak obecne panele mapują się do docelowej struktury
- które panele z ZIP powinny wejść jako pierwsze po ustaleniu shell/route map
- jakie są ryzyka compat / broken links / duplicate logic

Raport ma być krótki, konkretny i zgodny z template.
```
