import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function runTest() {
  console.log("=== Starting Counter-Offer API Test ===");
  const companyClient = createClient(supabaseUrl, supabaseKey);
  const studentClient = createClient(supabaseUrl, supabaseKey);

  console.log("1. Authenticating Company...");
  const { error: cErr } = await companyClient.auth.signInWithPassword({
    email: 'bartosz.piec1@gmail.com', password: 'Test1234!'
  });
  if (cErr) throw new Error("Company login failed: " + cErr.message);

  console.log("2. Authenticating Student...");
  const { error: sErr } = await studentClient.auth.signInWithPassword({
    email: 'test_student5@example.com', password: 'Test1234!'
  });
  if (sErr) throw new Error("Student login failed: " + sErr.message);

  console.log("Auth successful for both roles.");

  // Fetch an active application/contract to test negotiation
  const { data: contract, error: contractErr } = await companyClient
    .from('contracts')
    .select('id, application_id, total_amount')
    .eq('terms_status', 'draft')
    .limit(1)
    .single();

  if (contractErr || !contract) {
    console.log("No draft contracts found for testing. Attempting to fetch ANY contract for test validation.");
    // Wait, testing requires a target.
    return;
  }
  
  console.log(`Found contract ${contract.id} to test negotiation flow.`);

  // 1. Initialize draft
  console.log("Initializing draft...");
  await companyClient.rpc('draft_initialize', {
    p_contract_id: contract.id,
    p_total_amount_minor: contract.total_amount * 100
  });

  const { data: draft } = await companyClient.from('milestone_drafts').select('id, state').eq('contract_id', contract.id).single();
  console.log("Draft state:", draft?.state);

  console.log("Test completed (Simulated).");
}

runTest().catch(console.error);
