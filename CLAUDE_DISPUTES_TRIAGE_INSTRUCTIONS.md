# Claude Disputes Triage Instructions

This file defines Claude's next audit task for the disputes admin surface.

## Context

Already stabilized:
- Step 0
- Batch S1
- admin shell cleanup
- Phase A admin rollout
- Phase B finance rollout
- Phase C analytics exposure
- marketplace operability batch
- commission inline edit batch
- vault operability batch

Current question:
- what is the next high-ROI triage improvement for `/app/admin/disputes`?

## Read First

1. `SPRINT_LIVE_BOARD.md`
2. `AGENT_NOTEBOOK.md`
3. `CHAT_REPORT_TEMPLATES.md`
4. `DISPUTES_TRIAGE_PLAN.md`
5. this file

## Claude's Role

Claude should act as:
- triage usability auditor
- repo-vs-data checker
- ROI comparer
- regression risk spotter

Claude should not propose migrations unless there is a real blocker.

## What Claude Should Audit

Prepare one short evidence-based report covering:

1. current usefulness of `/app/admin/disputes`
   - what is still missing for real admin triage
   - what makes the page still too generic today

2. already available data signals
   - whether current queryable fields are enough for better dispute ordering or badges
   - whether there are safe joins already present in repo patterns

3. implementation shape
   - whether the next batch should extend `ContractsTable`
   - or introduce a dedicated disputes table / wrapper

## Decision Format

Claude should end with one concrete target:
- `TARGET: EXTEND CONTRACTS TABLE`
- `TARGET: DEDICATED DISPUTES TABLE`
- `TARGET: DISPUTE SUMMARY FIRST`

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
4. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\DISPUTES_TRIAGE_PLAN.md
5. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\CLAUDE_DISPUTES_TRIAGE_INSTRUCTIONS.md

Zadanie:
Przygotuj krotki evidence-based audit dla nastepnego batcha `/app/admin/disputes`.

Sprawdz:
- jakie realne sygnaly triage sporow juz istnieja w repo i DB
- czy obecny panel jest zbyt generyczny jako zwykla lista kontraktow
- czy lepiej rozszerzyc shared `ContractsTable`, czy zrobic dedykowany widok sporow

Na koncu wybierz dokladnie jedno:
- TARGET: EXTEND CONTRACTS TABLE
- TARGET: DEDICATED DISPUTES TABLE
- TARGET: DISPUTE SUMMARY FIRST

Raport ma byc krotki, konkretny i zgodny z template.
```
