# Final Funded QA Checklist

## Goal
Run one final browser verification of the funded marketplace path before opening the next sprint.

This run is specifically about the first fully funded escrow path for service orders and the adjacent application flow safety check.

## Preconditions
- Production is on commit `952febe` or newer.
- A dedicated QA company account is available and can open company-side deliverables.
- A QA student account is available and can open the same service order from the student side.
- At least one accepted service order exists and points to `/app/deliverables/[id]`.
- Test Stripe checkout is available, or the environment clearly states why payment cannot be completed.

## Must-Pass Scenarios

### 1. Company opens funded-path entry
- Open `/app/company/orders/[id]`.
- Confirm `Panel realizacji` is visible for the accepted service order.
- Enter `/app/deliverables/[id]`.
- Confirm the payment CTA is visible for the company.

Pass condition:
- Company can reach the payment modal without auth, routing, or visibility issues.

### 2. Checkout starts correctly
- Click the escrow funding CTA.
- Confirm the flow no longer shows `Nieprawidlowe powiazanie aplikacji z kontraktem`.
- Confirm the flow reaches Stripe checkout or a valid redirect step beyond the old blocker.

Pass condition:
- Checkout creation succeeds for the service order path.

### 3. Funded return path
- Complete a test payment if the environment allows it.
- Return to `/app/deliverables/[id]`.
- Confirm the escrow wall no longer blocks the flow.
- Confirm the page refreshes into the funded state.

Pass condition:
- The app leaves the waiting-for-payment state after funding.

### 4. Deliverables status after funding
- Check the status header and milestone timeline.
- Confirm the state advances beyond escrow.
- Confirm company and student see a consistent funded status.

Pass condition:
- Timeline and status clearly reflect funded escrow.

### 5. Company invoice visibility
- Check company-facing document surfaces.
- Check admin invoice and admin document surfaces if available.
- Confirm `invoice_company` appears where expected after payment.

Pass condition:
- The company invoice is visible in the expected post-payment surfaces.

### 6. Application-flow regression check
- Open one application-based `/app/deliverables/[id]`.
- Confirm checkout and funded-state logic did not regress there.

Pass condition:
- No regression for the original application contract path.

## Allowed Outcomes

### PASS
- Checkout starts
- funded state appears
- invoice surfaces update
- no regression on application flow

### PASS WITH QA GAP
- code and deploy are correct
- browser confirms up to the last accessible step
- the only missing proof is lack of company session or unavailable test payment

### BLOCKED
- the flow stops because of missing access, missing test payment, or environment constraints
- the report must say exactly where the flow stops

### FAIL
- the flow still hits a real product bug after the deployed escrow fix

## Final Go / No-Go Rule
Do not start the next sprint until this final funded QA run is either:
- `PASS`, or
- `PASS WITH QA GAP` where the only remaining gap is explicitly non-product and accepted by the team.
