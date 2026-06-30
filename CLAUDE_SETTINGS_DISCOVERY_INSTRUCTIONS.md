# Claude Settings Discovery Instructions

This file defines Claude's next planning task for admin settings discovery.

## Context

Closed:
- Step 0
- Batch S1
- Phase A admin rollout
- Phase B finance read-only rollout
- Phase C analytics step 1

Current state:
- finance consolidation remains trigger-based
- marketplace operability just improved
- settings is still schema-unclear

## Read First

1. `SPRINT_LIVE_BOARD.md`
2. `AGENT_NOTEBOOK.md`
3. `CHAT_REPORT_TEMPLATES.md`
4. `SETTINGS_DISCOVERY_PLAN.md`
5. this file

## Claude's Role

Claude should act as:
- settings feasibility auditor
- repo-vs-schema checker
- config boundary mapper
- risk spotter

Claude should not propose UI before the model is grounded.

## What Claude Should Audit

Prepare one short evidence-based report covering:

1. commission settings readiness
   - what is hardcoded
   - what already lives in DB
   - whether there is a credible small settings MVP here

2. notification settings readiness
   - what is code-only
   - whether there is any natural config boundary already present

3. finance/legal policy controls
   - which things should stay code-only or migration-only
   - which things might be safe as admin settings

4. platform toggles
   - whether any existing toggles are real product settings candidates

## Decision Format

Claude should end with exactly one:
- `GO SETTINGS MVP`
- `DEFER SETTINGS`

If `GO SETTINGS MVP`, include:
- the smallest viable scope
- the first source-of-truth model to create

If `DEFER SETTINGS`, include:
- what missing schema or product decision blocks it
- the better next batch to run instead

## Ready-To-Send Prompt

```text
Pracujemy dalej tylko z Codexem. Antigravity pozostaje wylaczone.

Przeczytaj:
1. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\SPRINT_LIVE_BOARD.md
2. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\AGENT_NOTEBOOK.md
3. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\CHAT_REPORT_TEMPLATES.md
4. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\SETTINGS_DISCOVERY_PLAN.md
5. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\CLAUDE_SETTINGS_DISCOVERY_INSTRUCTIONS.md

Zadanie:
Przygotuj krotki evidence-based settings discovery audit.

Sprawdz:
- czy commission settings sa gotowe do malego MVP
- czy notification controls maja naturalna granice konfiguracyjna
- co w finance/legal powinno zostac code-only
- czy istnieja sensowne platform toggles nadajace sie do admin settings

Na koncu wybierz dokladnie jedno:
- GO SETTINGS MVP
- DEFER SETTINGS

Jesli defer:
- napisz co blokuje
- i jaki batch powinien wejsc zamiast settings

Raport ma byc krotki, konkretny i zgodny z template.
```
