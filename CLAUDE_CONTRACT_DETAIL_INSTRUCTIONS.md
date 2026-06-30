# Claude Contract Detail Instructions

This file defines Claude's next audit task after the user detail drill-down batch.

## Context

Already stabilized:
- Step 0
- Batch S1
- admin shell cleanup
- Phase A admin rollout
- Phase B finance rollout
- Phase C analytics exposure
- disputes triage and workspace handoff
- finance operability batches
- exports follow-up
- `/app/admin/users/[id]` admin drill-down

Current question:
- what should the first contract detail drill-down include, and what is the safest highest-ROI v1?

## Read First

1. `SPRINT_LIVE_BOARD.md`
2. `AGENT_NOTEBOOK.md`
3. `CHAT_REPORT_TEMPLATES.md`
4. `CONTRACT_DETAIL_PLAN.md`
5. this file

## Claude's Role

Claude should act as:
- admin information architecture auditor
- repo-vs-data checker
- ROI comparer
- risk spotter

Claude should not propose migrations unless there is a real blocker.

## What Claude Should Audit

Prepare one short evidence-based report covering:

1. minimal contract detail scope
   - which existing tables and joins are enough for a useful v1
   - what should definitely be visible on the first screen

2. linking strategy
   - whether the first entrypoint should be contracts, disputes, vault, or all three

3. v1 screen shape
   - whether the best first version is tabs, stacked sections, or a mixed summary layout

## Decision Format

Claude should end with one concrete target:
- `TARGET: CONTRACT DETAIL V1`
- `TARGET: CONTRACT DETAIL VIA VAULT FIRST`
- `TARGET: DEFER CONTRACT DETAIL`

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
4. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\CONTRACT_DETAIL_PLAN.md
5. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\CLAUDE_CONTRACT_DETAIL_INSTRUCTIONS.md

Zadanie:
Przygotuj krotki evidence-based audit dla pierwszego contract detail drill-down.

Sprawdz:
- jaki jest minimalny safe v1 dla `/app/admin/contracts/[id]`
- z ktorych paneli powinien byc linkowany jako pierwszy
- czy v1 lepiej zrobic jako stacked sections, tabs czy mixed summary layout

Na koncu wybierz dokladnie jedno:
- TARGET: CONTRACT DETAIL V1
- TARGET: CONTRACT DETAIL VIA VAULT FIRST
- TARGET: DEFER CONTRACT DETAIL

Raport ma byc krotki, konkretny i zgodny z template.
```
