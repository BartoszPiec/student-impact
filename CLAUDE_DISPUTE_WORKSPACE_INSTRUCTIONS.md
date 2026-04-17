# Claude Dispute Workspace Instructions

This file defines Claude's next audit task after the dispute workspace handoff batch.

## Context

Already stabilized:
- Step 0
- Batch S1
- admin cleanup batches
- Phase A admin rollout
- Phase B finance rollout
- Phase C analytics exposure
- marketplace operability batch
- commission inline edit batch
- vault operability batch
- disputes triage batch

Current question:
- after row-level workspace access lands in `/app/admin/disputes`, what is the next highest-ROI admin workflow step?

## Read First

1. `SPRINT_LIVE_BOARD.md`
2. `AGENT_NOTEBOOK.md`
3. `CHAT_REPORT_TEMPLATES.md`
4. `DISPUTE_WORKSPACE_BATCH_PLAN.md`
5. this file

## Claude's Role

Claude should act as:
- admin workflow auditor
- repo-vs-UX checker
- ROI comparer
- regression risk spotter

Claude should not propose migrations unless there is a real blocker.

## What Claude Should Audit

Prepare one short evidence-based report covering:

1. disputes after workspace handoff
   - whether the page still lacks one critical signal or action
   - whether row context is now sufficient for daily admin use

2. finance consolidation readiness
   - whether anything changed that makes consolidation worth doing now
   - whether `revalidatePath` risk is still active

3. next best admin workflow target
   - whether ROI now sits in disputes follow-up
   - or in finance workflows
   - or somewhere else already visible in repo

## Decision Format

Claude should end with one concrete target:
- `TARGET: DISPUTES FOLLOW-UP`
- `TARGET: FINANCE CONSOLIDATION`
- `TARGET: OTHER ADMIN WORKFLOW`

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
4. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\DISPUTE_WORKSPACE_BATCH_PLAN.md
5. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\CLAUDE_DISPUTE_WORKSPACE_INSTRUCTIONS.md

Zadanie:
Przygotuj krotki evidence-based audit po batchu dispute workspace handoff.

Sprawdz:
- czy `/app/admin/disputes` nadal brakuje jednej krytycznej rzeczy po dodaniu wejscia do workspace
- czy finance consolidation nadal jest nizszym ROI
- jaki jest teraz jeden najlepszy kolejny target admin workflow

Na koncu wybierz dokladnie jedno:
- TARGET: DISPUTES FOLLOW-UP
- TARGET: FINANCE CONSOLIDATION
- TARGET: OTHER ADMIN WORKFLOW

Raport ma byc krotki, konkretny i zgodny z template.
```
