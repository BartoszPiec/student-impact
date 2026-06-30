# Claude Phase A Instructions

This file defines Claude's role for the next implementation batch.

## Context

Closed:
- Step 0
- Batch S1
- Batch C1
- Batch C2
- Batch C3 shell prerequisite

Current implementation target:
- Phase A - Admin Panels: Users, Contracts, Disputes

Canonical reference files:
1. `SPRINT_LIVE_BOARD.md`
2. `SPRINT_COMMAND_CENTER_2026-03-26.md`
3. `CHAT_REPORT_TEMPLATES.md`
4. `PHASE_A_IMPLEMENTATION_PLAN.md`
5. this file

## Claude's Role

Claude should support Codex as:
- verifier
- scope auditor
- repo-vs-plan checker
- risk spotter

Claude should not take over broad implementation unless Codex explicitly assigns a bounded write scope.

## What Claude Should Verify

Claude should prepare one short evidence-based report covering:

1. `users` panel feasibility
   - confirm which `profiles` fields are safe and present enough for Phase A
   - flag any field that is too inconsistent to rely on

2. `contracts` panel feasibility
   - confirm the minimal safe query shape for Phase A
   - identify joins that are optional vs risky

3. `disputes` panel feasibility
   - confirm that `contracts.status IN ('disputed', 'cancelled')` is enough for Phase A
   - flag any hidden incompatibility if discovered

4. reuse opportunities
   - identify whether existing admin pages offer a reusable table pattern worth copying
   - keep recommendations practical, not theoretical

## Constraints

- Antigravity remains excluded
- no new migrations unless a confirmed blocker appears
- do not reopen closed security work
- separate confirmed schema facts from inference
- prefer minimal-risk Phase A delivery over idealized architecture

## Expected Output

Use the audit or plan template from `CHAT_REPORT_TEMPLATES.md`.

The report should include:
- confirmed fields for `profiles`
- confirmed fields for `contracts`
- recommendation for the minimal Phase A query shape
- risks of over-joining
- recommendation on whether to share table UI now or after Phase A
- clear `DECISION REQUESTED` or `NEXT ACTION`

## Ready-To-Send Prompt

```text
Pracujemy dalej tylko z Codexem. Antigravity pozostaje wyłączone.

Przeczytaj:
1. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\SPRINT_LIVE_BOARD.md
2. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\SPRINT_COMMAND_CENTER_2026-03-26.md
3. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\CHAT_REPORT_TEMPLATES.md
4. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\PHASE_A_IMPLEMENTATION_PLAN.md
5. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\CLAUDE_PHASE_A_INSTRUCTIONS.md

Zadanie:
Przygotuj evidence-based feasibility audit dla Phase A:
- /app/admin/users
- /app/admin/contracts
- /app/admin/disputes

Sprawdź:
- które pola w profiles są realnie bezpieczne do pokazania w Phase A
- jaki jest minimalny safe query shape dla contracts
- czy disputes jako filtered contracts view jest wystarczające bez migracji
- czy warto robić shared table UI już teraz czy dopiero po Phase A

Raport ma być krótki, konkretny i zgodny z template.
```
