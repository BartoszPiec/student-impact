TITLE: QA Run - Marketplace to Documents

STATUS: PASS | PASS WITH BLOCKERS | FAIL | BLOCKED
SCOPE: company offer creation -> public offer -> application -> contract/workspace -> documents
CLASSIFICATION: QA | VERIFICATION
OWNER: Codex + Claude
DATE: YYYY-MM-DD
ENVIRONMENT: local/dev | preview | staging

## Gate 0

| Check | Result | Evidence |
|---|---|---|
| Offer Brief v2 migration applied | PASS / FAIL / BLOCKED | |
| Build passes | PASS / FAIL / BLOCKED | |
| Company account login works | PASS / FAIL / BLOCKED | |
| Student account login works | PASS / FAIL / BLOCKED | |
| `deliverables` storage reachable | PASS / FAIL / BLOCKED | |

## Scenario Results

| Scenario | Result | Route | Last Passing Step | Evidence |
|---|---|---|---|---|
| 1. Create Offer UX and Save | PASS / FAIL / BLOCKED | | | |
| 2. Time Branch and Warnings | PASS / FAIL / BLOCKED | | | |
| 3. Public Offer Detail | PASS / FAIL / BLOCKED | | | |
| 4. Application and Acceptance | PASS / FAIL / BLOCKED | | | |
| 5. Contract Documents | PASS / FAIL / BLOCKED | | | |
| 6. Company Invoice | PASS / FAIL / BLOCKED BY PAYMENT TRIGGER | | | |
| 7. Student Receipt | PASS / FAIL / BLOCKED | | | |

## Findings

1. [severity] [short finding]
   Evidence: [route, screenshot, runtime error or code truth]
   Impact: [what is blocked or degraded]
   Recommendation: [specific next fix]

2. [severity] [short finding]
   Evidence: [route, screenshot, runtime error or code truth]
   Impact: [what is blocked or degraded]
   Recommendation: [specific next fix]

## Decision Requested

- [what Codex or Bartosz should decide next]
