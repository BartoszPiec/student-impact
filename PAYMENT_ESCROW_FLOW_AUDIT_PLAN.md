# Payment / Escrow Flow Audit Plan

## Objective
Audit the real post-acceptance finance path that starts after a company accepts an offer or service quote and ends at funded escrow, company invoice creation, and the first unlock of realization.

This is the next highest-value area because the rest of the product now reaches the escrow wall correctly.

## Scope

### Included
- checkout creation
- Stripe verification route
- Stripe webhook handling
- post-payment status transitions
- escrow-related UI states
- `invoice_company` generation
- visibility of company invoice in:
  - company documents
  - admin invoices
  - legal/admin document surfaces
- prerequisites for student-side milestone flow after funding

### Excluded
- subscriptions
- Stripe Connect expansion
- payouts redesign
- private proposals
- general pricing redesign

## Source of Truth Assumption
- payment state should be driven by Stripe events and verified server-side
- document visibility should continue to be driven by `contract_documents`
- company invoice should be treated as a post-payment artifact, not as a pre-payment placeholder

## Audit Questions

### A. Checkout creation
- Which route or server action creates the Stripe checkout?
- Is the flow the same for application contracts and service-order contracts?
- What identifiers are passed into checkout metadata?
- Is there a mismatch between contract id, application id, service order id, or offer id?

### B. Payment verification
- What does `/api/stripe/verify-payment` do in the current product?
- Is it authoritative or only a UX helper?
- Can the UI show funded state before the webhook lands?

### C. Webhook path
- What exact event unlocks the escrow wall?
- Which DB tables are updated by the webhook?
- Does the webhook create `invoice_company` directly, indirectly, or not at all?
- Does the webhook insert `contract_documents` for company invoices?

### D. UI status transitions
- Which pages should change after funding?
- Does `/app/deliverables/[id]` stop showing `Wymagane Zasilenie Escrow`?
- Does status timeline move from waiting to active?
- Are company and student views consistent after payment?

### E. Invoice lifecycle
- When exactly is `invoice_company` created?
- Where is it stored?
- Is the storage path inserted into both `invoices` and `contract_documents`?
- Which surfaces should expose it immediately after payment?

### F. Failure modes
- What happens if checkout succeeds but webhook is late?
- What happens if webhook fails after payment?
- Is there admin visibility for “payment succeeded but product state not advanced”?

## Desired Output

### From Codex
- repo-grounded map of the code path
- exact trigger points
- most likely blocker if the flow does not progress
- minimal safe implementation batch

### From Claude
- browser evidence of the current funded or blocked path
- exact point where the user flow stops
- distinction between:
  - missing infra access
  - broken product logic
  - delayed async processing

## Acceptance Criteria For The Audit
- we know the exact happy path from accepted -> checkout -> funded escrow
- we know the exact trigger for `invoice_company`
- we know whether the current blocker is:
  - missing payment event
  - broken webhook logic
  - stale UI polling
  - missing document generation
- we can define a minimal implementation batch without guessing

## Recommended Next Batch After Audit
Implement only the smallest batch that gets us from:
- `accepted` / `awaiting_funding`
to
- funded escrow
- visible company invoice
- realization flow unlocked
