# Post Contract Cross-Link Audit Plan

Date: 2026-03-27
Owner: Codex
Status: planned

## Goal

Ocenić kolejny najlepszy admin workflow batch po tym, jak `contract detail`
stalo sie wspolnym targetem dla:
- contracts list
- users detail
- disputes
- vault

## What Changed

- `contracts`, `users/[id]`, `disputes` i `vault` wskazuja teraz do `/app/admin/contracts/[id]`
- contract detail jest kanonicznym read-first centrum kontekstu kontraktu

## Questions For Claude

1. Czy `contract detail` potrzebuje teraz drobnego polishu o najwyzszym ROI:
- context-aware back link
- drobne summary improvements
- lepsze next-step actions

2. Czy lepszym krokiem jest nastepny drill-down:
- `/app/admin/contracts/[id] -> /app/admin/users/[id]` juz istnieje
- pytanie brzmi, czy potrzebny jest kolejny kontraktowy follow-up, czy inny panel

3. Czy jest silniejszy ROI poza contract detail:
- dalsze finance consolidation
- contract-adjacent workflow follow-up
- inny admin operability batch

## Guardrails

- bez migracji, jesli nie sa konieczne
- bez sztucznego rozbudowywania contract detail w mutation center
- preferowac maly, konkretny batch o wysokiej wartosci operacyjnej

## Preferred Output

Claude ma wybrac jedna opcje:
- `TARGET: CONTRACT DETAIL POLISH`
- `TARGET: CONTRACT-ADJACENT WORKFLOW`
- `TARGET: DIFFERENT ADMIN ROI`
