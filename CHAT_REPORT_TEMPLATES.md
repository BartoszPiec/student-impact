# Chat Report Templates

Use these templates in other chats so the sprint stays organized.

## Reporting Rules

- one report = one scope
- always include evidence
- always name exact files, routes, migrations or objects
- if something is only inferred, mark it as `INFERENCE`
- if no change was made, say that explicitly
- end with a clear `DECISION REQUESTED` or `NEXT ACTION`

## 1. Audit Report Template

Use for Claude-style audits.

```md
TITLE: [short title]

STATUS: COMPLETE | IN PROGRESS | BLOCKED
SCOPE: [exact feature / area]
CLASSIFICATION: UX | SECURITY | DATA | FINANCE | ARCHITECTURE
OWNER: Claude | Antigravity | Codex
DATE: YYYY-MM-DD

SUMMARY
- [2-4 lines max]

FINDINGS
1. [severity] [short finding]
   Evidence: [file or route]
   Impact: [what breaks / why it matters]
   Recommendation: [specific fix]

2. [severity] [short finding]
   Evidence: [file or route]
   Impact: [what breaks / why it matters]
   Recommendation: [specific fix]

OPEN QUESTIONS
- [only if truly blocking]

DECISION REQUESTED
- [what Codex / Bartosz should decide next]
```

## 2. Implementation Status Template

Use for Codex batch updates.

```md
TITLE: [batch name]

STATUS: PASS | PASS WITH DEBT | FAIL | BLOCKED
SCOPE: [exact implemented area]
CLASSIFICATION: IMPLEMENTATION
OWNER: Codex
DATE: YYYY-MM-DD

CHANGED
- [what was changed]
- [what was intentionally not changed]

TOUCHED FILES
- [path]
- [path]

VERIFICATION
- [build / lint / manual path]

RESIDUAL RISK
- [short and concrete]

NEXT ACTION
- [who should do what next]
```

## 3. DB / Ops Report Template

Use for Antigravity-style migration, Stripe or environment work.

```md
TITLE: [db or ops task]

STATUS: PASS | PASS WITH WARNING | FAIL | BLOCKED
SCOPE: [migration / RPC / webhook / env]
CLASSIFICATION: DB | OPS | STRIPE | ACCOUNTING
OWNER: Antigravity
DATE: YYYY-MM-DD

ACTION TAKEN
- [apply / verify / compare / backfill]

OBJECTS TOUCHED
- migration: [name]
- function: [name]
- table/index/policy: [name]

EVIDENCE
- [query result summary]
- [runtime result summary]
- [deploy/log summary]

RISK
- [what still may be wrong]

NEXT ACTION
- [what Codex or Bartosz should do next]
```

## 4. Plan Template

Use before bigger features or refactors.

```md
TITLE: [planned change]

STATUS: PROPOSED
SCOPE: [exact scope]
CLASSIFICATION: PLAN
OWNER: Claude | Antigravity
DATE: YYYY-MM-DD

GOAL
- [business or technical goal]

CHANGES
1. [step]
2. [step]
3. [step]

FILES / TABLES / ROUTES
- [path or object]
- [path or object]

RISKS
- [risk]
- [risk]

VALIDATION
- [how success will be checked]

DECISION REQUESTED
- approve | revise | reject
```

## 5. Sprint Closeout Template

Use at the end of a sprint or large batch.

```md
TITLE: Sprint Closeout

STATUS: READY TO CLOSE | PARTIAL CLOSE | NOT READY
DATE: YYYY-MM-DD
BRANCH: [branch]
COMMIT: [sha]

CLOSED
- [done item]
- [done item]

OPEN
1. [operational item]
2. [operational item]

DO NOT REOPEN
- [closed topic]
- [closed topic]

BASELINE FOR NEXT CHAT
- [short facts only]
- [current source of truth]
- [what to start with]
```

## Recommended Ownership Split

- Claude: audits, plans, verification, repo-vs-spec comparisons
- Antigravity: DB apply, Stripe/accounting validation, runtime drift checks
- Codex: implementation, integration, final prioritization, build checks
