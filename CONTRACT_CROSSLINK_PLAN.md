# Contract Cross-Link Batch Plan

Date: 2026-03-27
Owner: Codex
Status: planned

## Goal

Domknac pierwszy etap admin drill-down przez doprowadzenie do jednego kanonicznego
widoku kontraktu z pozostalych paneli operacyjnych.

Target route:
- `/app/admin/contracts/[id]`

Primary candidate entrypoints:
- `/app/admin/vault`
- `/app/admin/disputes`

## Why This Batch

- `contract detail v1` juz istnieje i ma pelny read-first kontekst
- `vault` i `disputes` nadal zatrzymuja admina na poziomie listy lub workspace handoff
- cross-linki daja szybki wzrost operacyjnej spojnosci bez nowych migracji

## Batch Questions For Claude

Claude ma odpowiedziec na trzy rzeczy:

1. Ktory entrypoint ma wyzszy ROI jako pierwszy:
- `vault -> contract detail`
- `disputes -> contract detail`
- oba naraz

2. Jaki pattern UI jest bezpieczniejszy:
- osobny row action `Szczegoly`
- link na contract ID
- oba

3. Czy istnieje jakikolwiek brakujacy kontekst w `contract detail v1`,
   ktory powinien byc uzupelniony zanim zaczniemy podpinac kolejne linki

## Expected Safe Scope

Bez migracji.
Bez nowych RPC.
Bez zmiany URL.

Mozliwy zakres implementacyjny:
- `components/admin/vault-table.tsx`
- `components/admin/disputes-table.tsx`
- ewentualnie drobny polish w `/app/admin/contracts/[id]`

## Guardrails

- nie budowac osobnego kontraktowego workflow mutation center
- nie dodawac tabow ani client-heavy shell do contract detail
- trzymac `contract detail` jako kanoniczny read-first widok
- nie dotykac finance URL consolidation w tym batchu

## Preferred Outcome

Jesli nic nie blokuje:
- `vault` i `disputes` powinny wskazywac do tego samego contract detail route
- pattern powinien byc spojny z istniejacym link-through z contracts list i users detail
