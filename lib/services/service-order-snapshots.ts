export type ServiceOrderFormAnswer = {
  id: string;
  label: string;
  value: string;
};

export type CompanyOrderFormRequestSnapshot = {
  source: "company_order_form";
  package_id: string;
  package_title: string;
  contact: {
    email: string;
    website: string | null;
  };
  form_answers: ServiceOrderFormAnswer[];
  additional_info: string | null;
  submitted_at: string;
};

export type StudentPrivateProposalRequestSnapshot = {
  source: "student_private_proposal";
  package_id: string;
  package_title: string;
  target_company_id: string;
  target_company_name: string | null;
  proposal_goal: string;
  expected_result: string;
  scope_summary: string;
  estimated_timeline_days: number | null;
  proposed_amount: number | null;
  message: string | null;
  submitted_at: string;
};

export type ServiceOrderRequestSnapshot =
  | CompanyOrderFormRequestSnapshot
  | StudentPrivateProposalRequestSnapshot;

export type ServiceOrderQuoteSnapshot = {
  state: "proposal_sent" | "countered" | "accepted" | "rejected";
  student_offer?: {
    amount: number;
    message: string | null;
    created_at: string;
  } | null;
  company_counter?: {
    amount: number;
    created_at: string;
  } | null;
  accepted_amount?: number | null;
  accepted_by?: "company" | "student" | null;
  accepted_at?: string | null;
};

type QuestionDefinition = {
  id: string;
  label?: string | null;
};

export function extractRequestFormAnswers(
  entries: Array<[string, FormDataEntryValue]>,
  schema: QuestionDefinition[],
): ServiceOrderFormAnswer[] {
  return entries
    .filter(([key]) => key.startsWith("q_"))
    .map(([key, value]) => {
      const questionId = key.replace("q_", "");
      const questionDef = schema.find((field) => field.id === questionId);
      let normalizedValue = "";

      if (typeof value === "string") {
        normalizedValue = value;
      } else if (typeof File !== "undefined" && value instanceof File) {
        normalizedValue = value.name || "";
      } else {
        normalizedValue = String(value ?? "");
      }

      return {
        id: questionId,
        label: questionDef?.label || questionId.toUpperCase(),
        value: normalizedValue,
      };
    })
    .filter((answer) => answer.value.trim().length > 0);
}

export function buildLegacyRequirementsText(params: {
  contactEmail: string;
  companyWebsite?: string | null;
  formAnswers: ServiceOrderFormAnswer[];
  additionalInfo?: string | null;
}) {
  const lines = ["=== DANE KONTAKTOWE ===", `Email: ${params.contactEmail}`];

  if (params.companyWebsite) {
    lines.push(`WWW: ${params.companyWebsite}`);
  }

  lines.push("", "=== SZCZEGOLY ZLECENIA ===");

  for (const answer of params.formAnswers) {
    lines.push(`${answer.label}: ${answer.value}`);
  }

  if (params.additionalInfo) {
    lines.push("", "=== DODATKOWE INFORMACJE ===", `Dodane: ${params.additionalInfo}`);
  }

  return lines.join("\n");
}

export function buildRequestSnapshot(params: {
  packageId: string;
  packageTitle: string;
  contactEmail: string;
  companyWebsite?: string | null;
  formAnswers: ServiceOrderFormAnswer[];
  additionalInfo?: string | null;
}) {
  return {
    source: "company_order_form",
    package_id: params.packageId,
    package_title: params.packageTitle,
    contact: {
      email: params.contactEmail,
      website: params.companyWebsite || null,
    },
    form_answers: params.formAnswers,
    additional_info: params.additionalInfo || null,
    submitted_at: new Date().toISOString(),
  } satisfies ServiceOrderRequestSnapshot;
}

export function buildPrivateProposalLegacyText(params: {
  targetCompanyName?: string | null;
  proposalGoal: string;
  expectedResult: string;
  scopeSummary: string;
  estimatedTimelineDays?: number | null;
  proposedAmount?: number | null;
  message?: string | null;
}) {
  const lines = ["=== PRYWATNA PROPOZYCJA WSPOLPRACY ==="];

  if (params.targetCompanyName) {
    lines.push(`Firma: ${params.targetCompanyName}`);
  }

  lines.push("", "=== CEL WSPOLPRACY ===", params.proposalGoal);
  lines.push("", "=== OCZEKIWANY REZULTAT ===", params.expectedResult);
  lines.push("", "=== ZAKRES I PLAN REALIZACJI ===", params.scopeSummary);

  if (params.estimatedTimelineDays) {
    lines.push(`Szacowany czas realizacji: ${params.estimatedTimelineDays} dni`);
  }

  if (params.proposedAmount) {
    lines.push(`Proponowana kwota: ${params.proposedAmount} PLN`);
  }

  if (params.message) {
    lines.push("", "=== WIADOMOSC DO FIRMY ===", params.message);
  }

  return lines.join("\n");
}

export function buildPrivateProposalRequestSnapshot(params: {
  packageId: string;
  packageTitle: string;
  targetCompanyId: string;
  targetCompanyName?: string | null;
  proposalGoal: string;
  expectedResult: string;
  scopeSummary: string;
  estimatedTimelineDays?: number | null;
  proposedAmount?: number | null;
  message?: string | null;
}) {
  return {
    source: "student_private_proposal",
    package_id: params.packageId,
    package_title: params.packageTitle,
    target_company_id: params.targetCompanyId,
    target_company_name: params.targetCompanyName || null,
    proposal_goal: params.proposalGoal,
    expected_result: params.expectedResult,
    scope_summary: params.scopeSummary,
    estimated_timeline_days: params.estimatedTimelineDays ?? null,
    proposed_amount: params.proposedAmount ?? null,
    message: params.message || null,
    submitted_at: new Date().toISOString(),
  } satisfies ServiceOrderRequestSnapshot;
}

export function buildStudentProposalSnapshot(
  existing: ServiceOrderQuoteSnapshot | null | undefined,
  params: { amount: number; message?: string | null },
) {
  return {
    ...(existing || {}),
    state: "proposal_sent",
    student_offer: {
      amount: params.amount,
      message: params.message || null,
      created_at: new Date().toISOString(),
    },
  } satisfies ServiceOrderQuoteSnapshot;
}

export function buildCompanyCounterSnapshot(
  existing: ServiceOrderQuoteSnapshot | null | undefined,
  params: { amount: number },
) {
  return {
    ...(existing || {}),
    state: "countered",
    company_counter: {
      amount: params.amount,
      created_at: new Date().toISOString(),
    },
  } satisfies ServiceOrderQuoteSnapshot;
}

export function buildAcceptedQuoteSnapshot(
  existing: ServiceOrderQuoteSnapshot | null | undefined,
  params: { amount: number; acceptedBy: "company" | "student" },
) {
  return {
    ...(existing || {}),
    state: "accepted",
    accepted_amount: params.amount,
    accepted_by: params.acceptedBy,
    accepted_at: new Date().toISOString(),
  } satisfies ServiceOrderQuoteSnapshot;
}

export function buildRejectedQuoteSnapshot(existing: ServiceOrderQuoteSnapshot | null | undefined) {
  return {
    ...(existing || {}),
    state: "rejected",
  } satisfies ServiceOrderQuoteSnapshot;
}

export function getRequestSnapshotPreview(
  snapshot: ServiceOrderRequestSnapshot | null | undefined,
  fallback: string | null | undefined,
) {
  if (!snapshot) {
    return fallback || "Brak dodatkowych wytycznych od firmy.";
  }

  const parts: string[] = [];

  if (snapshot.source === "student_private_proposal") {
    parts.push(snapshot.proposal_goal);

    if (snapshot.expected_result) {
      parts.push(snapshot.expected_result);
    }

    if (snapshot.message) {
      parts.push(snapshot.message);
    }
  } else {
    if (snapshot.additional_info) {
      parts.push(snapshot.additional_info);
    }

    for (const answer of snapshot.form_answers.slice(0, 2)) {
      parts.push(`${answer.label}: ${answer.value}`);
    }
  }

  return parts.join(" • ") || fallback || "Brak dodatkowych wytycznych od firmy.";
}

export function isRequestSnapshot(value: unknown): value is ServiceOrderRequestSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.source === "string" &&
    typeof candidate.package_id === "string" &&
    typeof candidate.package_title === "string" &&
    (candidate.source === "company_order_form" || candidate.source === "student_private_proposal")
  );
}

export function isQuoteSnapshot(value: unknown): value is ServiceOrderQuoteSnapshot {
  return Boolean(value && typeof value === "object" && "state" in (value as Record<string, unknown>));
}
