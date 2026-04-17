type ConversationLookupParams = {
  serviceOrderId: string;
  companyId: string;
  studentId: string;
  packageId?: string | null;
};

type ConversationMatch = {
  id: string;
};

export async function findConversationForServiceOrder(
  supabase: any,
  params: ConversationLookupParams,
): Promise<ConversationMatch | null> {
  const { data: directMatch } = await supabase
    .from("conversations")
    .select("id")
    .eq("service_order_id", params.serviceOrderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (directMatch) {
    return directMatch as ConversationMatch;
  }

  let fallbackQuery = supabase
    .from("conversations")
    .select("id")
    .eq("company_id", params.companyId)
    .eq("student_id", params.studentId)
    .eq("type", "inquiry");

  if (params.packageId) {
    fallbackQuery = fallbackQuery.eq("package_id", params.packageId);
  }

  const { data: fallbackMatch } = await fallbackQuery
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (fallbackMatch as ConversationMatch | null) ?? null;
}
