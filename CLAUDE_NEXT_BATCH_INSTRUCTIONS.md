# Claude Next Batch Instructions

This file defines Claude's next planning task after the current finance rollout.

## Context

Closed:
- Step 0
- Batch S1
- Batch C1
- Batch C2
- Batch C3
- Phase A admin panels

Current implemented finance surfaces:
- `/app/admin/finance/ledger`
- `/app/admin/finance/invoices`
- `/app/admin/finance/periods`

Current question:
- what should the next batch be after this finance read-only milestone?

## Read First

1. `SPRINT_LIVE_BOARD.md`
2. `AGENT_NOTEBOOK.md`
3. `CHAT_REPORT_TEMPLATES.md`
4. `NEXT_BATCH_DECISION_PLAN.md`
5. this file

## Claude's Role

Claude should act as:
- decision auditor
- repo-vs-strategy checker
- ROI comparer
- risk spotter

Claude should not propose broad implementation diffs yet.

## What Claude Should Compare

Prepare one short evidence-based report comparing:

1. Finance consolidation now
   - should `payouts`, `pit`, `exports` move under `/app/admin/finance/*` now
   - what exact compat / action / redirect risks still exist
   - whether there is enough payoff to justify doing this before new capability work

2. Phase C analytics
   - whether the repo and DB already support a meaningful analytics expansion
   - whether current analytics are mostly dashboard polish or need deeper event/data work first
   - what the safest first analytics expansion would be

3. Settings discovery
   - whether a real admin settings module is data-ready now
   - whether likely settings candidates already exist in schema/app logic
   - whether starting settings now would create speculation instead of delivery

## Decision Format

Claude should end with exactly one primary recommendation:
- `GO FINANCE CONSOLIDATION`
- `GO PHASE C ANALYTICS`
- `GO SETTINGS DISCOVERY FIRST`

And also include:
- why the other two are not the best immediate move
- the first concrete implementation target for the chosen path

## Ready-To-Send Prompt

```text
Pracujemy dalej tylko z Codexem. Antigravity pozostaje wylaczone.

Przeczytaj:
1. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\SPRINT_LIVE_BOARD.md
2. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\AGENT_NOTEBOOK.md
3. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\CHAT_REPORT_TEMPLATES.md
4. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\NEXT_BATCH_DECISION_PLAN.md
5. C:\Users\Bartosz i Natalia\Desktop\Student-impact-antygraviti\CLAUDE_NEXT_BATCH_INSTRUCTIONS.md

Zadanie:
Przygotuj krotki evidence-based decision audit dla nastepnego batcha.

Porownaj:
- finance consolidation teraz vs pozostawienie jej jako trigger-based
- Phase C analytics jako nastepny realny batch
- settings discovery jako alternatywe

Odpowiedz:
- co ma najwyzszy ROI teraz
- jakie sa realne ryzyka dla pozostalych opcji
- jaki powinien byc pierwszy konkretny target implementacyjny

Na koncu wybierz dokladnie jedno:
- GO FINANCE CONSOLIDATION
- GO PHASE C ANALYTICS
- GO SETTINGS DISCOVERY FIRST

Raport ma byc krotki, konkretny i zgodny z template.
```
