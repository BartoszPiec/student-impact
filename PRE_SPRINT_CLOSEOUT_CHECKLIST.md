# Pre-Sprint Closeout Checklist

## Goal
Before opening the next sprint, close the remaining blockers that affect the real end-to-end marketplace path. The product is already stable in documents, service negotiation, and deliverables. The biggest open area is now payment and escrow.

## Closed Foundations
- Documents sprint is functionally complete.
- Offer Brief v2 and create-offer UX are in place.
- Student service cockpit works.
- Quote snapshots work.
- Company order management works.
- Service-order deliverables work in production.

## Must-Close Before Next Sprint

### 1. Payment / Escrow Flow
Owner: Codex + Claude

Why this is first:
- The live user journey now reaches `accepted` and `Panel realizacji`.
- The next real blocker is `Wymagane Zasilenie Escrow`.
- Without this, the pipeline stops before delivery, invoice generation, and payout logic can be exercised.

What must be verified:
- company checkout creation
- Stripe verification / webhook path
- post-payment status transition
- contract state after payment
- `invoice_company` generation and visibility
- unlock path toward milestone acceptance and `invoice_student`

Exit criteria:
- a company can fund escrow in test mode or staging
- the app leaves the waiting-for-payment wall
- company invoice is visible where expected
- the status timeline reflects the funded state correctly

### 2. QA Hygiene
Owner: Bartosz / Ops

Why this matters:
- Browser QA is now part of the release process.
- We should not reset random passwords during verification.

Must-close items:
- define dedicated QA accounts for company and student
- store credentials in a secure project-owned location
- keep the QA playbook as a mandatory regression gate for release-sensitive areas

Exit criteria:
- Claude can run browser verification without account recovery or ad-hoc resets

## Nice-to-Close, Not Sprint Blockers

### Deliverables UX debt
- application-flow text `Firma nanosi poprawki do propozycji...` is contextually weak
- `Wygeneruj umowy` before escrow may be confusing

### Service marketplace UX debt
- legacy orders still render `requirements` blob fallback
- conversation lookup still uses `package_id + company_id + student_id` instead of `service_order_id`
- some old CTA visibility can still be tightened in later polish

These should not block the next sprint if payment/escrow is working.

## Recommended Order
1. Payment / Escrow audit
2. Payment / Escrow implementation batch
3. Final funded QA run on the company + student path
4. Minor UX closeout if still needed
5. Start next sprint

## Final Go / No-Go Rule
Do not start the next major feature sprint until:
- payment / escrow path is understood
- at least one funded test flow is verified or the only remaining gap is explicitly a non-product QA access gap
- the current marketplace path no longer stops at escrow
