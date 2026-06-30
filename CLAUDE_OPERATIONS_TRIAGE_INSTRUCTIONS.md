# Claude Operations Triage Instructions

This file defines Claude's next audit task for operational admin surfaces.

## Context

Closed or stabilized:
- Step 0
- Batch S1
- Phase A admin rollout
- Phase B finance read-only rollout
- Phase C analytics step 1
- marketplace operability batch
- commission inline edit batch

Current question:
- what is the highest-ROI operational admin improvement now?

## Read First

1. `SPRINT_LIVE_BOARD.md`
2. `AGENT_NOTEBOOK.md`
3. `CHAT_REPORT_TEMPLATES.md`
4. `OPERATIONS_TRIAGE_PLAN.md`
5. this file

## Claude's Role

Claude should act as:
- operability auditor
- repo-vs-UX checker
- ROI comparer
- risk spotter

Claude should not propose migrations unless there is a real blocker.

## What Claude Should Audit

Prepare one short evidence-based report covering:

1. disputes panel usefulness
   - what is missing today for real admin triage
   - whether current repo fields already support a better version

2. vault panel usefulness
   - whether search, filtering, sorting, or clearer cues are the best next move
   - whether current actions already cover the legal/audit use case

3. shared pattern question
   - whether `disputes` and `vault` should share new operability primitives now
   - or whether one targeted improvement is better

## Decision Format

Claude should end with one concrete target:
- `TARGET: DISPUTES OPERABILITY`
- `TARGET: VAULT OPERABILITY`
- `TARGET: SHARED OPERATIONS PATTERN`

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
4. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\OPERATIONS_TRIAGE_PLAN.md
5. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\CLAUDE_OPERATIONS_TRIAGE_INSTRUCTIONS.md

Zadanie:
Przygotuj krotki evidence-based operability audit dla nastepnego batcha admin.

Sprawdz:
- czy najwiekszy ROI jest teraz w /app/admin/disputes
- czy najwiekszy ROI jest teraz w /app/admin/vault
- czy warto budowac shared pattern dla obu, czy jeszcze nie

Na koncu wybierz dokladnie jedno:
- TARGET: DISPUTES OPERABILITY
- TARGET: VAULT OPERABILITY
- TARGET: SHARED OPERATIONS PATTERN

Raport ma byc krotki, konkretny i zgodny z template.
```
