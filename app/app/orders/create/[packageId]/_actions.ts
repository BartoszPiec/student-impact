"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { ensureConversationForServiceOrder } from "@/lib/services/service-order-conversations";
import {
  buildLegacyRequirementsText,
  buildRequestSnapshot,
  extractRequestFormAnswers,
  type ServiceOrderFormAnswer,
} from "@/lib/services/service-order-snapshots";
import {
  type PackageFormField,
  normalizePackageFormSchema,
  resolvePackageVariantsWithFallback,
  resolveSelectedPackageVariant,
} from "@/lib/services/package-customization";
import { UUID_RE } from "@/lib/security/validation";
import { logCriticalError } from "@/lib/observability/error-log";

const MAX_ADDITIONAL_INFO_LENGTH = 5000;
const MAX_FORM_ANSWER_LENGTH = 1500;
const MAX_FORM_ANSWERS = 80;
const MAX_INQUIRY_MESSAGE_LENGTH = 2000;

const packageIdSchema = z
  .string()
  .trim()
  .regex(UUID_RE, "Nieprawidlowy identyfikator pakietu.");

const createOrderFormSchema = z.object({
  packageId: packageIdSchema,
  contactEmail: z
    .string()
    .trim()
    .email("Podaj prawidlowy email kontaktowy.")
    .max(254, "Email kontaktowy jest zbyt dlugi."),
  companyWebsite: z
    .string()
    .trim()
    .max(300, "Adres strony firmy jest zbyt dlugi."),
  variantKey: z
    .string()
    .trim()
    .max(80, "Nieprawidlowy wariant pakietu.")
    .regex(/^[a-zA-Z0-9_-]*$/, "Nieprawidlowy wariant pakietu.")
    .transform((value) => value || null),
  additionalInfo: z
    .string()
    .trim()
    .max(MAX_ADDITIONAL_INFO_LENGTH, "Dodatkowe informacje sa zbyt dlugie."),
});

const startInquirySchema = z.object({
  packageId: packageIdSchema,
  message: z
    .string()
    .trim()
    .max(MAX_INQUIRY_MESSAGE_LENGTH, "Wiadomosc jest zbyt dluga."),
});

async function logOrderCreateActionError(input: {
  source: string;
  error: unknown;
  userId?: string | null;
  packageId?: string | null;
  serviceOrderId?: string | null;
  conversationId?: string | null;
}) {
  await logCriticalError({
    source: input.source,
    error: input.error,
    userId: input.userId ?? null,
    context: {
      packageId: input.packageId ?? null,
      serviceOrderId: input.serviceOrderId ?? null,
      conversationId: input.conversationId ?? null,
    },
  });
}

function readFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseCreateOrderForm(formData: FormData) {
  const parsed = createOrderFormSchema.safeParse({
    packageId: readFormString(formData, "packageId"),
    contactEmail: readFormString(formData, "contact_email"),
    companyWebsite: readFormString(formData, "company_website"),
    variantKey: readFormString(formData, "variantName"),
    additionalInfo: readFormString(formData, "requirements"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Nieprawidlowe dane zamowienia.");
  }

  return parsed.data;
}

function parseStartInquiryInput(packageId: string, message: string) {
  const parsed = startInquirySchema.safeParse({ packageId, message });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Nieprawidlowe dane zapytania.");
  }

  return parsed.data;
}

function normalizeOrderFormAnswers(
  answers: ServiceOrderFormAnswer[],
  schema: PackageFormField[],
): ServiceOrderFormAnswer[] {
  const allowedQuestionIds = new Set(schema.map((field) => field.id));

  return answers
    .filter((answer) => allowedQuestionIds.has(answer.id))
    .slice(0, MAX_FORM_ANSWERS)
    .map((answer) => ({
      id: answer.id,
      label: answer.label.trim().slice(0, 160),
      value: answer.value.trim().slice(0, MAX_FORM_ANSWER_LENGTH),
    }))
    .filter((answer) => answer.value.length > 0);
}

function normalizeOptionalUrl(value: string | null | undefined) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    const hasValidHost = /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname);
    if (!hasValidHost || url.username || url.password) {
      throw new Error("Nieprawidlowy adres strony.");
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    throw new Error("Podaj prawidlowy adres strony, np. test.pl albo https://test.pl.");
  }
}

export async function createOrder(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Musisz byc zalogowany.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    await logOrderCreateActionError({
      source: "orders.create.profile_lookup",
      error: profileError,
      userId: user.id,
    });
    throw new Error("Nie udalo sie sprawdzic uprawnien konta.");
  }

  if (profile?.role !== "company") {
    throw new Error("Zamowienia usług może skladac tylko konto firmowe.");
  }

  const input = parseCreateOrderForm(formData);
  const companyWebsite = normalizeOptionalUrl(input.companyWebsite);

  const { data: pkgData, error: pkgError } = await supabase
    .from("service_packages")
    .select("student_id, is_system, type, form_schema, price, title, variants")
    .eq("id", input.packageId)
    .single();

  if (pkgError) {
    await logOrderCreateActionError({
      source: "orders.create.package_lookup",
      error: pkgError,
      userId: user.id,
      packageId: input.packageId,
    });
    throw new Error("Nie udalo sie pobrac pakietu.");
  }

  if (!pkgData) {
    throw new Error("Pakiet nie zostal znaleziony.");
  }

  // Pakiety systemowe (Quick Task) mają dedykowany flow z wariantami,
  // przypisaniem studenta i poprawną ceną — to legacy entry point nie może
  // tworzyć zamówień bez wykonawcy (status pending, student_id NULL).
  if (pkgData.is_system === true || pkgData.type === "platform_service" || !pkgData.student_id) {
    redirect(`/app/company/packages/${input.packageId}/customize`);
  }

  if (pkgData.student_id && pkgData.student_id === user.id && pkgData.is_system !== true) {
    throw new Error("Nie mozesz zamowic wlasnej usługi.");
  }

  const entries = Array.from(formData.entries());
  const schema = normalizePackageFormSchema(pkgData.form_schema);
  const formAnswers = normalizeOrderFormAnswers(extractRequestFormAnswers(entries, schema), schema);
  const packageTitle = pkgData.title || "Usluga";

  const requirementsText = buildLegacyRequirementsText({
    contactEmail: input.contactEmail,
    companyWebsite,
    formAnswers,
    additionalInfo: input.additionalInfo,
  });

  const requestSnapshot = buildRequestSnapshot({
    packageId: input.packageId,
    packageTitle,
    contactEmail: input.contactEmail,
    companyWebsite,
    formAnswers,
    additionalInfo: input.additionalInfo,
  });

  const selectedVariant = resolveSelectedPackageVariant(
    resolvePackageVariantsWithFallback(input.packageId, pkgData.variants),
    input.variantKey ?? "",
  );
  const orderAmount = Number(selectedVariant?.price ?? pkgData.price);

  if (!Number.isFinite(orderAmount) || orderAmount <= 0) {
    await logOrderCreateActionError({
      source: "orders.create.invalid_package_price",
      error: new Error("Invalid package price"),
      userId: user.id,
      packageId: input.packageId,
    });
    throw new Error("Pakiet ma nieprawidlowa cene. Skontaktuj sie z obsluga.");
  }

  const { data: order, error } = await supabase
    .from("service_orders")
    .insert({
      company_id: user.id,
      package_id: input.packageId,
      student_id: pkgData.student_id,
      amount: orderAmount,
      variant_key: input.variantKey,
      requirements: requirementsText,
      request_snapshot: requestSnapshot,
      status: "pending",
      title: packageTitle,
      contact_email: input.contactEmail,
      company_website: companyWebsite,
      entry_point: "company_request",
      initiated_by: "company",
    })
    .select("id")
    .single();

  if (error) {
    await logOrderCreateActionError({
      source: "orders.create.service_order_insert",
      error,
      userId: user.id,
      packageId: input.packageId,
    });
    throw new Error("Nie udalo sie utworzyc zamowienia. Sprobuj ponownie.");
  }

  if (pkgData.student_id && pkgData.is_system !== true) {
    let conversationId = null;

    const newConv = await ensureConversationForServiceOrder(supabase, {
      serviceOrderId: order.id,
      companyId: user.id,
      studentId: pkgData.student_id,
      packageId: input.packageId,
    });

    conversationId = newConv.id;

    if (conversationId) {
      const { error: inquiryMessageError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: "Zapytano o wycenę usługi.",
      });

      if (inquiryMessageError) {
        await logOrderCreateActionError({
          source: "orders.create.inquiry_message_insert",
          error: inquiryMessageError,
          userId: user.id,
          packageId: input.packageId,
          serviceOrderId: order.id,
          conversationId,
        });
        throw new Error("Zamowienie zostalo zapisane, ale nie udalo sie wyslac wiadomosci.");
      }

      const { error: inquiryDetailsError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: requirementsText,
        event: "inquiry_details",
      });

      if (inquiryDetailsError) {
        await logOrderCreateActionError({
          source: "orders.create.inquiry_details_insert",
          error: inquiryDetailsError,
          userId: user.id,
          packageId: input.packageId,
          serviceOrderId: order.id,
          conversationId,
        });
        throw new Error("Zamowienie zostalo zapisane, ale nie udalo sie wyslac szczegolow zapytania.");
      }

      revalidatePath("/app/chat");
      revalidatePath("/app/company/packages");
      redirect("/app/company/packages?success=inquiry_sent");
    }
  }

  revalidatePath("/app/company/packages");
  redirect("/app/company/packages");
}

export async function startInquiry(packageId: string, message: string) {
  const input = parseStartInquiryInput(packageId, message);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    await logOrderCreateActionError({
      source: "orders.start_inquiry.profile_lookup",
      error: profileError,
      userId: user.id,
      packageId: input.packageId,
    });
    throw new Error("Nie udalo sie sprawdzic uprawnien konta.");
  }

  if (profile?.role !== "company") {
    throw new Error("Zapytanie o usluge moze wyslac tylko konto firmowe.");
  }

  const { data: pkg, error: pkgError } = await supabase
    .from("service_packages")
    .select("student_id, title")
    .eq("id", input.packageId)
    .single();

  if (pkgError) {
    await logOrderCreateActionError({
      source: "orders.start_inquiry.package_lookup",
      error: pkgError,
      userId: user.id,
      packageId: input.packageId,
    });
    throw new Error("Nie udalo sie pobrac pakietu.");
  }

  if (!pkg || !pkg.student_id) {
    throw new Error("Nie mozna rozpoczac zapytania dla tego pakietu.");
  }

  const { data: existingStats, error: existingConversationError } = await supabase
    .from("conversations")
    .select("id")
    .eq("company_id", user.id)
    .eq("student_id", pkg.student_id)
    .eq("package_id", input.packageId)
    .limit(1);

  if (existingConversationError) {
    await logOrderCreateActionError({
      source: "orders.start_inquiry.existing_conversation_lookup",
      error: existingConversationError,
      userId: user.id,
      packageId: input.packageId,
    });
    throw new Error("Nie udalo sie sprawdzic istniejacej rozmowy.");
  }

  let conversationId = existingStats?.[0]?.id;

  if (!conversationId) {
    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({
        company_id: user.id,
        student_id: pkg.student_id,
        status: "active",
        type: "inquiry",
        package_id: input.packageId,
      })
      .select("id")
      .single();

    if (error) {
      await logOrderCreateActionError({
        source: "orders.start_inquiry.conversation_insert",
        error,
        userId: user.id,
        packageId: input.packageId,
      });
      throw new Error("Nie udalo sie utworzyc rozmowy.");
    }

    conversationId = newConv.id;
  }

  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: input.message || `Dzien dobry, chcialbym zapytac o szczegoly uslugi: "${pkg.title}".`,
  });

  if (messageError) {
    await logOrderCreateActionError({
      source: "orders.start_inquiry.message_insert",
      error: messageError,
      userId: user.id,
      packageId: input.packageId,
      conversationId,
    });
    throw new Error("Nie udalo sie wyslac wiadomosci.");
  }

  revalidatePath("/app/chat");
  redirect(`/app/chat/${conversationId}`);
}
