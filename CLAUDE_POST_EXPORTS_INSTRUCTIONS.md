# Claude Post Exports Instructions

This file defines Claude's next audit task after the exports follow-up batch.

## Context

Already stabilized:
- Step 0
- Batch S1
- admin cleanup and shell batches
- Phase A admin rollout
- Phase B finance rollout
- Phase C analytics exposure
- disputes triage and workspace handoff
- payouts operability batch
- PIT follow-up batch
- exports follow-up batch

Current question:
- what is now the single best next batch after finance surface alignment?

## Read First

1. `SPRINT_LIVE_BOARD.md`
2. `AGENT_NOTEBOOK.md`
3. `CHAT_REPORT_TEMPLATES.md`
4. `POST_EXPORTS_DECISION_PLAN.md`
5. this file

## Claude's Role

Claude should act as:
- ROI auditor
- workflow comparer
- architecture risk spotter
- repo-vs-UX checker

Claude should not propose migrations unless there is a real blocker.

## What Claude Should Audit

Prepare one short evidence-based report covering:

1. finance consolidation readiness
   - whether exports follow-up changed the case for consolidation
   - whether `revalidatePath` risk is still the main blocker

2. remaining finance workflow ROI
   - whether one finance-adjacent improvement still beats consolidation

3. non-finance ROI
   - whether the next best batch has now moved back to `vault`, `disputes`, or another admin surface

## Decision Format

Claude should end with one concrete target:
- `TARGET: FINANCE CONSOLIDATION`
- `TARGET: FINANCE WORKFLOW FOLLOW-UP`
- `TARGET: NON-FINANCE ADMIN ROI`

And include:
- why the other two are lower ROI right now
- the smallest practical batch that Codex should implement next

## Ready-To-Send Prompt

```text
Pracujemy dalej tylko z Codexem. Antigravity pozostaje wylaczone.

Przeczytaj:
1. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\SPRINT_LIVE_BOARD.md
2. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\AGENT_NOTEBOOK.md
3. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\CHAT_REPORT_TEMPLATES.md
4. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\POST_EXPORTS_DECISION_PLAN.md
5. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\CLAUDE_POST_EXPORTS_INSTRUCTIONS.md

Zadanie:
Przygotuj krotki evidence-based audit po batchu exports follow-up.

Sprawdz:
- czy finance consolidation ma teraz sens po wyrownaniu payouts, pit i exports
- czy nadal istnieje mocniejszy finance workflow follow-up niz sama konsolidacja
- czy kolejny najlepszy batch nie przeniosl sie juz poza finance

Na koncu wybierz dokladnie jedno:
- TARGET: FINANCE CONSOLIDATION
- TARGET: FINANCE WORKFLOW FOLLOW-UP
- TARGET: NON-FINANCE ADMIN ROI

Raport ma byc krotki, konkretny i zgodny z template.
```
