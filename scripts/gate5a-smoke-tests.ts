import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

type AccountingItem = {
  direction: string;
  amount_minor: number | string;
  accounts?: {
    code?: string | null;
    name?: string | null;
  } | null;
};

type AccountingEntry = {
  description?: string | null;
  idempotency_key?: string | null;
  items?: AccountingItem[] | null;
};

async function checkAccounting(referenceId: string, description: string) {
  console.log(`Checking accounting entries for ${description} (ref: ${referenceId})...`);
  const { data: entries, error } = await supabase
    .from('accounting_entries')
    .select('*, items:accounting_ledger_items(*, accounts:accounting_accounts(code, name))')
    .eq('reference_id', referenceId);
  
  if (error) {
    console.error(`  [FAIL] Could not fetch accounting entries: ${error.message}`);
    return false;
  }
  
  if (!entries || entries.length === 0) {
    console.log(`  [WARN] No accounting entries found for this reference.`);
    return false;
  }

  console.log(`  [PASS] Found ${entries.length} entry/entries.`);
  (entries as AccountingEntry[]).forEach((entry) => {
    console.log(`    Entry: ${entry.description} (${entry.idempotency_key})`);
    entry.items?.forEach((item) => {
      console.log(`      ${item.direction.toUpperCase()} | Account ${item.accounts?.code} (${item.accounts?.name}) | Amount: ${item.amount_minor}`);
    });
  });
  return true;
}

async function runSmokeTests() {
  console.log("==================================================");
  console.log("       GATE 5A FINANCIAL SMOKE TESTS              ");
  console.log("==================================================");

  // 1. Storage Bucket Check
  console.log("\n[TEST 1] Storage Bucket: deliverables");
  const { data: bucket, error: bucketErr } = await supabase.storage.getBucket('deliverables');
  if (bucketErr) {
    console.error("  [FAIL] Bucket 'deliverables' access error:", bucketErr.message);
  } else {
    console.log(`  [PASS] Bucket exists. Max size: ${bucket.file_size_limit} bytes (~100MB).`);
    console.log(`  [INFO] Allowed MIME types: ${bucket.allowed_mime_types?.length || 0}`);
  }

  const testContractId = '7fb648b5-696a-451c-83b0-34da970645b1';
  console.log(`\nUsing Test Contract: ${testContractId}`);

  // 2. Test 5: Milestone Release (review_delivery_v3)
  console.log("\n[TEST 5] Milestone Release (review_delivery_v3)");
  const { data: milestone } = await supabase
    .from('milestones')
    .select('id, title, amount')
    .eq('contract_id', testContractId)
    .in('status', ['funded', 'in_progress'])
    .limit(1)
    .maybeSingle();

  if (milestone) {
    console.log(`  Found milestone: ${milestone.title} (${milestone.id})`);
    const { data: res, error: rpcErr } = await supabase.rpc('review_delivery_v3', {
      p_milestone_id: milestone.id,
      p_decision: 'accepted',
      p_feedback: 'Smoke test acceptance'
    });

    if (rpcErr) {
      console.error("  [FAIL] review_delivery_v3 error:", rpcErr.message);
    } else {
      console.log("  [PASS] RPC call successful.", res);
      await checkAccounting(milestone.id, "Milestone Release");
    }
  } else {
    console.log("  [INFO] No funded milestone found (might already be released).");
  }

  // 3. Test 6: Payout Path
  console.log("\n[TEST 6] Student Payout (process_payout_paid_v1)");
  const { data: payout } = await supabase
    .from('payouts')
    .select('id, amount_net')
    .eq('contract_id', testContractId)
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle();

  if (payout) {
    console.log(`  Found pending payout: ${payout.id} (Net: ${payout.amount_net})`);
    const { error: rpcErr } = await supabase.rpc('process_payout_paid_v1', {
      p_payout_id: payout.id,
      p_admin_id: '5295f161-acde-4e40-aedd-17381dd01f80' // Using ANTI (admin) ID
    });

    if (rpcErr) {
      console.error("  [FAIL] process_payout_paid_v1 error:", rpcErr.message);
    } else {
      console.log("  [PASS] RPC call successful.");
      await checkAccounting(payout.id, "Payout Paid");
    }
  } else {
    console.log("  [INFO] No pending payout found.");
  }

  // 4. Test 7 & 8: Refund Flows
  console.log("\n[TEST 7 & 8] Stripe Refund (process_stripe_refund_v4)");
  const { data: payment, error: pError } = await supabase
    .from('payments')
    .select('stripe_payment_intent_id, amount_total')
    .eq('contract_id', testContractId)
    .eq('status', 'completed')
    .limit(1)
    .maybeSingle();

  if (pError) console.error("  [FAIL] Error fetching payment:", pError.message);

  if (payment?.stripe_payment_intent_id) {
    console.log(`  Found completed payment: ${payment.stripe_payment_intent_id}`);
    const refundId = 're_smoke_' + Math.floor(Date.now() / 1000);
    const { error: rpcErr } = await supabase.rpc('process_stripe_refund_v4', {
      p_payment_intent_id: payment.stripe_payment_intent_id,
      p_charge_id: 'ch_smoke',
      p_refund_id: refundId,
      p_refund_amount_delta_pln: 1.00,
      p_currency: 'pln',
      p_reason: 'requested_by_customer'
    });

    if (rpcErr) {
      console.error("  [FAIL] process_stripe_refund_v4 error:", rpcErr.message);
    } else {
      console.log("  [PASS] Refund processed.");
      // Refund uses contract_id as ref_id in record_accounting_entry in v4
      await checkAccounting(testContractId, "Refund (Contract Ref)");
    }
  } else {
    console.log("  [INFO] No completed payment found (might already be refunded).");
  }

  // 5. Test 9 & 10 Summary
  console.log("\n[TEST 9] Export Integrity");
  const { count: pitCount } = await supabase.from('pit_withholdings').select('*', { count: 'exact', head: true });
  console.log(`  [INFO] Total PIT withholdings in DB: ${pitCount}`);
  
  console.log("\n[TEST 10] Service Order Coverage");
  const { data: soPayment } = await supabase.from('financial_ledger').select('id').not('service_order_id', 'is', null).limit(1).maybeSingle();
  if (soPayment) {
    console.log("  [PASS] Service Order payments detected in ledger.");
  } else {
    console.log("  [INFO] No Service Order payments found in ledger history.");
  }

  console.log("\n==================================================");
  console.log("          SMOKE TESTS COMPLETED                  ");
  console.log("==================================================");
}

runSmokeTests().catch(console.error);
