type SupabaseLike = {
  from: (table: string) => unknown;
};

type DatabaseError = {
  code?: string;
  message?: string;
};

type QueryResult<T> = {
  data: T | null;
  error: DatabaseError | null;
};

type ConversationMatch = {
  id: string;
};

type ConversationSelectQuery = {
  eq: (column: string, value: string | null) => ConversationSelectQuery;
  order: (column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) => ConversationSelectQuery;
  limit: (count: number) => ConversationSelectQuery;
  maybeSingle: () => Promise<QueryResult<ConversationMatch>>;
};

type ConversationInsertQuery = {
  select: (columns: string) => {
    maybeSingle: () => Promise<QueryResult<ConversationMatch>>;
  };
};

type ConversationInsertPayload = {
  application_id?: string | null;
  service_order_id?: string | null;
  offer_id?: string | null;
  package_id?: string | null;
  company_id: string;
  student_id: string;
  type: string;
  status: string;
};

type ConversationTable = {
  select: (columns: string) => ConversationSelectQuery;
  insert: (payload: ConversationInsertPayload) => ConversationInsertQuery;
};

type EnsuredConversation = ConversationMatch & {
  created: boolean;
};

type ConversationLookupParams = {
  serviceOrderId: string;
  companyId: string;
  studentId: string;
  packageId?: string | null;
};

type ApplicationConversationParams = {
  applicationId: string;
  offerId: string;
  companyId: string;
  studentId: string;
};

type ServiceOrderConversationParams = ConversationLookupParams & {
  offerId?: string | null;
  type?: string;
  status?: string;
};

function conversations(client: SupabaseLike) {
  return client.from("conversations") as ConversationTable;
}

function isDuplicateKeyError(error: DatabaseError | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "23505" || message.includes("duplicate key");
}

async function findConversationByColumn(
  supabase: SupabaseLike,
  column: "application_id" | "service_order_id",
  value: string,
): Promise<ConversationMatch | null> {
  const { data, error } = await conversations(supabase)
    .select("id")
    .eq(column, value)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("Nie udalo sie pobrac rozmowy.");
  }

  return data?.id ? data : null;
}

export async function ensureConversationForApplication(
  supabase: SupabaseLike,
  params: ApplicationConversationParams,
): Promise<EnsuredConversation> {
  const existing = await findConversationByColumn(supabase, "application_id", params.applicationId);
  if (existing) return { ...existing, created: false };

  const { data: created, error } = await conversations(supabase)
    .insert({
      application_id: params.applicationId,
      company_id: params.companyId,
      student_id: params.studentId,
      offer_id: params.offerId,
      type: "application",
      status: "active",
    })
    .select("id")
    .maybeSingle();

  if (created?.id) return { ...created, created: true };

  if (isDuplicateKeyError(error)) {
    const racedExisting = await findConversationByColumn(supabase, "application_id", params.applicationId);
    if (racedExisting) return { ...racedExisting, created: false };
  }

  throw new Error("Nie udalo sie utworzyc rozmowy.");
}

export async function ensureConversationIdForApplication(
  supabase: SupabaseLike,
  params: ApplicationConversationParams,
): Promise<string> {
  const conversation = await ensureConversationForApplication(supabase, params);
  return conversation.id;
}

export async function ensureConversationForServiceOrder(
  supabase: SupabaseLike,
  params: ServiceOrderConversationParams,
): Promise<EnsuredConversation> {
  const existing = await findConversationByColumn(supabase, "service_order_id", params.serviceOrderId);
  if (existing) return { ...existing, created: false };

  const { data: created, error } = await conversations(supabase)
    .insert({
      service_order_id: params.serviceOrderId,
      company_id: params.companyId,
      student_id: params.studentId,
      package_id: params.packageId ?? null,
      offer_id: params.offerId ?? null,
      type: params.type ?? "inquiry",
      status: params.status ?? "active",
    })
    .select("id")
    .maybeSingle();

  if (created?.id) return { ...created, created: true };

  if (isDuplicateKeyError(error)) {
    const racedExisting = await findConversationByColumn(supabase, "service_order_id", params.serviceOrderId);
    if (racedExisting) return { ...racedExisting, created: false };
  }

  throw new Error("Nie udalo sie utworzyc rozmowy.");
}

export async function findConversationForServiceOrder(
  supabase: SupabaseLike,
  params: ConversationLookupParams,
): Promise<ConversationMatch | null> {
  const { data: directMatch, error: directMatchError } = await conversations(supabase)
    .select("id")
    .eq("service_order_id", params.serviceOrderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (directMatchError) {
    throw new Error("Nie udalo sie pobrac rozmowy zlecenia.");
  }

  if (directMatch?.id) {
    return directMatch;
  }

  let fallbackQuery = conversations(supabase)
    .select("id")
    .eq("company_id", params.companyId)
    .eq("student_id", params.studentId)
    .eq("type", "inquiry");

  if (params.packageId) {
    fallbackQuery = fallbackQuery.eq("package_id", params.packageId);
  }

  const { data: fallbackMatch, error: fallbackMatchError } = await fallbackQuery
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fallbackMatchError) {
    throw new Error("Nie udalo sie pobrac rozmowy zapytania.");
  }

  return fallbackMatch?.id ? fallbackMatch : null;
}
