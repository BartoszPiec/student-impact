export const PRIVATE_PROPOSAL_ELIGIBLE_CONTRACT_STATUSES = [
  "awaiting_funding",
  "active",
  "delivered",
  "completed",
] as const;

export type EligibleCompany = {
  user_id: string;
  nazwa: string | null;
  city?: string | null;
  website?: string | null;
};

export async function listEligibleCompaniesForStudent(supabase: any, studentId: string): Promise<EligibleCompany[]> {
  const { data: contracts, error: contractsError } = await supabase
    .from("contracts")
    .select("company_id")
    .eq("student_id", studentId)
    .in("status", [...PRIVATE_PROPOSAL_ELIGIBLE_CONTRACT_STATUSES]);

  if (contractsError || !contracts?.length) {
    return [];
  }

  const companyIds = Array.from(
    new Set(
      contracts
        .map((contract: { company_id?: string | null }) => contract.company_id)
        .filter((companyId: string | null | undefined): companyId is string => Boolean(companyId)),
    ),
  );

  if (!companyIds.length) {
    return [];
  }

  const { data: companies, error: companiesError } = await supabase
    .from("company_profiles")
    .select("user_id, nazwa, city, website")
    .in("user_id", companyIds)
    .order("nazwa", { ascending: true });

  if (companiesError || !companies?.length) {
    return [];
  }

  return companies as EligibleCompany[];
}

export async function assertStudentCanPrivatelyProposeToCompany(
  supabase: any,
  studentId: string,
  companyId: string,
) {
  const { data: contract } = await supabase
    .from("contracts")
    .select("id")
    .eq("student_id", studentId)
    .eq("company_id", companyId)
    .in("status", [...PRIVATE_PROPOSAL_ELIGIBLE_CONTRACT_STATUSES])
    .limit(1)
    .maybeSingle();

  if (!contract) {
    throw new Error("Możesz wysłać prywatną propozycję tylko do firmy, z którą już współpracowałeś.");
  }
}
