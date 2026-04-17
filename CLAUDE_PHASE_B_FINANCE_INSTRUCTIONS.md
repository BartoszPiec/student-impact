# Claude Phase B Finance Instructions

This file defines Claude's role for the next finance batch.

## Context

Closed:
- Step 0
- Batch S1
- Batch C1
- Batch C2
- Batch C3 shell work
- Phase A admin panels
- production dependency/security cleanup

Current target:
- Phase B - Finance Module Structure

Read first:
1. `SPRINT_LIVE_BOARD.md`
2. `AGENT_NOTEBOOK.md`
3. `CHAT_REPORT_TEMPLATES.md`
4. `PHASE_B_FINANCE_PLAN.md`
5. this file

## Claude's Role

Claude should help as:
- verifier
- repo-vs-plan checker
- data-shape auditor
- risk spotter

Claude should avoid broad implementation unless Codex assigns a bounded write scope.

## What Claude Should Check

Prepare one short evidence-based report covering:

1. ledger panel feasibility
   - confirm `accounting_book_lines_v1` is sufficient for the first panel
   - identify the safest minimal query shape
   - flag any likely nulls or naming mismatches in the view

2. next finance surfaces
   - confirm whether `invoices` is the best second panel
   - evaluate whether `periods` should be driven by `month_bucket`, `tax_period`, or both

3. navigation / IA risks
   - confirm whether additive `/app/admin/finance/*` is better than moving existing payout/pit/export routes now
   - flag any compatibility risk if finance subtree grows

4. implementation sequencing
   - recommend the next 2 finance panels after ledger

## Constraints

- Antigravity remains excluded
- no new migrations unless a confirmed blocker appears
- prefer read-first finance surfaces
- separate confirmed DB/view facts from inference

## Expected Output

Use the audit or plan template from `CHAT_REPORT_TEMPLATES.md`.

The report should include:
- confirmed ledger query shape
- recommended finance route order
- second-panel recommendation
- risks of over-grouping or moving existing URLs too early
- clear `NEXT ACTION`

## Ready-To-Send Prompt

```text
Pracujemy dalej tylko z Codexem. Antigravity pozostaje wylaczone.

Przeczytaj:
1. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\SPRINT_LIVE_BOARD.md
2. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\AGENT_NOTEBOOK.md
3. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\CHAT_REPORT_TEMPLATES.md
4. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\PHASE_B_FINANCE_PLAN.md
5. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\CLAUDE_PHASE_B_FINANCE_INSTRUCTIONS.md

Zadanie:
Przygotuj evidence-based finance audit dla Phase B kickoff.

Sprawdz:
- czy `accounting_book_lines_v1` wystarcza jako pierwszy panel ledger
- jaki jest minimalny safe query shape dla ledger
- czy `invoices` powinno byc drugim panelem
- czy `periods` powinno bazowac na `month_bucket`, `tax_period` czy obu
- czy additive `/app/admin/finance/*` jest lepsze niz przenoszenie istniejacych payout/pit/export routes juz teraz

Raport ma byc krotki, konkretny i zgodny z template.
```
