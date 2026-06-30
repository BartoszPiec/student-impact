import { createAdminClient } from "@/lib/supabase/admin";

type MilestoneStateRow = {
  id: string;
  status: string | null;
};

type ContractStateRow = {
  id: string;
  status: string | null;
  funding_mode: string | null;
  milestones: MilestoneStateRow[] | null;
};

const STARTED_OR_FUNDED_STATUSES = new Set([
  "funded",
  "in_progress",
  "delivered",
  "released",
  "accepted",
  "completed",
]);

const LOCKED_NEXT_STEP_STATUSES = new Set(["draft", "awaiting_funding"]);

export async function normalizeFullFundingContractState(contractId: string): Promise<boolean> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("contracts")
    .select("id, status, funding_mode, milestones(id, status)")
    .eq("id", contractId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  const contract = data as ContractStateRow;
  if ((contract.funding_mode ?? "full") !== "full") {
    return false;
  }

  const milestones = contract.milestones ?? [];
  const hasStartedWork = milestones.some((milestone) =>
    STARTED_OR_FUNDED_STATUSES.has(String(milestone.status)),
  );

  if (!hasStartedWork) {
    return false;
  }

  const lockedMilestoneIds = milestones
    .filter((milestone) => LOCKED_NEXT_STEP_STATUSES.has(String(milestone.status)))
    .map((milestone) => milestone.id);

  if (lockedMilestoneIds.length === 0 && !["draft", "awaiting_funding"].includes(String(contract.status))) {
    return false;
  }

  if (lockedMilestoneIds.length > 0) {
    const { error: milestoneUpdateError } = await admin
      .from("milestones")
      .update({
        status: "funded",
        updated_at: new Date().toISOString(),
      })
      .in("id", lockedMilestoneIds);

    if (milestoneUpdateError) {
      console.error("Failed to normalize full-funding milestones:", milestoneUpdateError);
      return false;
    }
  }

  if (["draft", "awaiting_funding"].includes(String(contract.status))) {
    const { error: contractUpdateError } = await admin
      .from("contracts")
      .update({
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId);

    if (contractUpdateError) {
      console.error("Failed to normalize full-funding contract:", contractUpdateError);
      return false;
    }
  }

  return true;
}
