# Post Baseline Decision Plan

Date: 2026-03-27
Owner: Codex
Status: planned

## Goal

Wybrac jeden najlepszy kierunek po domknieciu operability baseline
dla glownych tabel admina.

Baseline considered closed for:
- users
- contracts
- disputes
- vault
- payouts
- pit
- finance/invoices

## What Is Already Stable

- investigation web admina jest spojne i prowadzi do `users/[id]` oraz `contracts/[id]`
- glówne tabele maja juz przynajmniej podstawowe search/filter/sort
- security i finance parity nie sa aktualnie blockerami repo

## Decision Axes For Claude

Claude ma porownac trzy kierunki:

1. New drill-down
- np. `offers/[id]` jako kolejny discovery-first detail view
- tylko jesli daje realny nowy kontekst, a nie cienka strone

2. New workflow
- np. payout batch workflow, invoice PDF packaging follow-up,
  legal/document operability, contract-adjacent triage
- tylko jesli daje realny dzienny utility

3. Different product area
- np. analytics follow-up, marketplace moderation, settings-adjacent discovery,
  albo inny obszar spoza obecnej mapy contracts/finance

## Guardrails

- bez migracji, jesli nie sa konieczne
- nie otwierac z powrotem domknietych cleanupow bez nowego powodu
- nie robic thin detail pages bez nowej wartosci
- nie wciskac finance consolidation, jesli nadal jest tylko porzadkiem URL

## Preferred Answer Shape

Claude ma:
- wskazac jeden najlepszy kolejny batch
- uzasadnic, dlaczego pozostale dwa kierunki maja nizszy ROI
- wskazac pierwszy konkretny target implementacyjny

## Candidate Hints

Mozliwe kandydatury do oceny:
- `/app/admin/offers/[id]`
- invoice PDF packaging / export completion
- payout batch workflow beyond the current table
- legal or vault follow-up
- finance consolidation trigger check
