import { jsonError, noStoreJson } from "@/lib/security/api-response";
import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { resolveServerAppUrl } from "@/lib/app-url";
import { getStripe, calculatePlatformFee } from "@/lib/stripe";
import { resolveCommissionRate } from "@/lib/commission";
import { buildRateLimitKey, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { rejectCrossSiteRequest } from "@/lib/security/request-origin";
import { uuidSchema } from "@/lib/security/validation";
import { logCriticalError } from "@/lib/observability/error-log";

export const maxDuration = 10;

type ContractRow = {
  id: string;
  company_id: string;
  application_id: string | null;
  service_order_id: string | null;
  source_type: "application" | "service_order" | null;
  student_id: string | null;
  total_amount: number | null;
  commission_rate: number | null;
  funding_mode?: "full" | "sequential" | null;
  status: string | null;
  terms_status: string | null;
  company_contract_accepted_at: string | null;
  student_contract_accepted_at: string | null;
  milestones: MilestoneRow[] | null;
};

type ExistingPaymentRow = {
  stripe_session_id: string;
};

type MilestoneRow = {
  id: string;
  title: string | null;
  amount: number | string | null;
  amount_minor?: number | string | null;
  status: string | null;
};

type ContractDocumentRow = {
  document_type: "contract_a" | "contract_b" | string;
  company_accepted_at: string | null;
  student_accepted_at: string | null;
};

type ApplicationInfo = {
  offers: {
    tytul: string | null;
    is_platform_service: boolean | null;
    typ?: string | null;
    commission_rate?: number | null;
  } | null;
};

type ServiceOrderInfo = {
  title: string | null;
  package_id?: string | null;
};

type ServicePackageInfo = {
  commission_rate?: number | null;
};

const checkoutRequestSchema = z.object({
  contractId: uuidSchema,
  applicationId: uuidSchema.optional(),
  serviceOrderId: uuidSchema.optional(),
}).refine(
  (body) => Number(Boolean(body.applicationId)) + Number(Boolean(body.serviceOrderId)) === 1,
  { message: "Płatność musi dotyczyć dokładnie jednego typu zlecenia." },
);

function milestoneAmountMinor(milestone: MilestoneRow): number | null {
  if (milestone.amount_minor != null) {
    const amountMinor = Number(milestone.amount_minor);
    return Number.isFinite(amountMinor) && amountMinor > 0 ? Math.round(amountMinor) : null;
  }

  const amount = Number(milestone.amount);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : null;
}

function buildCheckoutIdempotencyKey(input: {
  contractId: string;
  sourceId: string;
  milestoneIds: string[];
  amountMinor: number;
  attemptWindow: number;
}) {
  const digest = createHash("sha256")
    .update([
      input.contractId,
      input.sourceId,
      input.milestoneIds.join(","),
      String(input.amountMinor),
    ].join("|"))
    .digest("hex")
    .slice(0, 24);

  return `s2w_checkout_${input.contractId}_${input.attemptWindow}_${digest}`;
}

function readErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && code.trim().length > 0 ? code.trim() : null;
}

function isMissingRowError(error: unknown): boolean {
  return readErrorCode(error) === "PGRST116";
}

async function logCheckoutError(input: {
  source: string;
  error?: unknown;
  message: string;
  level?: "error" | "warning" | "info";
  contractId?: string | null;
  stripeSessionId?: string | null;
  userId?: string | null;
  context?: Record<string, unknown>;
}) {
  await logCriticalError({
    source: input.source,
    level: input.level,
    error: input.error,
    errorCode: readErrorCode(input.error),
    message: input.message,
    contractId: input.contractId ?? null,
    stripeSessionId: input.stripeSessionId ?? null,
    userId: input.userId ?? null,
    context: input.context,
  });
}

async function expireCheckoutSession(sessionId: string) {
  try {
    await getStripe().checkout.sessions.expire(sessionId);
  } catch (error) {
    await logCheckoutError({
      source: "stripe.checkout.expire_orphaned_session",
      level: "warning",
      error,
      message: "Could not expire orphaned Stripe Checkout session.",
      stripeSessionId: sessionId,
    });
  }
}

export async function POST(req: NextRequest) {
  let actorUserId: string | null = null;

  try {
    const crossSiteResponse = rejectCrossSiteRequest(req);
    if (crossSiteResponse) return crossSiteResponse;

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return jsonError("Musisz być zalogowany.", 401);
    }

    actorUserId = user.id;

    const ip = getRequestIp(req);
    const limitResult = await enforceRateLimit(
      "checkout",
      buildRateLimitKey(["checkout", user.id, ip]),
    );
    if (!limitResult.success) {
      return noStoreJson(
        { error: "Zbyt wiele prób utworzenia płatności. Spróbuj ponownie za chwilę." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(Math.ceil((limitResult.reset - Date.now()) / 1000), 1)),
          },
        },
      );
    }

    const rawBody = await req.json().catch(() => null);
    const parsedBody = checkoutRequestSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return noStoreJson(
        { error: "Płatność musi dotyczyć dokładnie jednego typu zlecenia." },
        { status: 400 },
      );
    }

    const { contractId, applicationId, serviceOrderId } = parsedBody.data;

    const { data: contractData, error: contractError } = await supabase
      .from("contracts")
      .select("id, company_id, student_id, application_id, service_order_id, source_type, total_amount, commission_rate, funding_mode, status, terms_status, company_contract_accepted_at, student_contract_accepted_at, milestones(id, title, amount, amount_minor, status)")
      .eq("id", contractId)
      .single();
    const contract = contractData as ContractRow | null;

    if (contractError && !isMissingRowError(contractError)) {
      await logCheckoutError({
        source: "stripe.checkout.contract_lookup_failed",
        error: contractError,
        message: "Contract lookup failed before creating Stripe Checkout session.",
        contractId,
        userId: user.id,
      });
      return jsonError("Nie udało się sprawdzić umowy.", 500);
    }

    if (contractError || !contract) {
      return jsonError("Nie znaleziono umowy.", 404);
    }

    if (contract.company_id !== user.id) {
      return jsonError("Nie masz uprawnień do tej płatności.", 403);
    }

    const contractSourceType = contract.source_type ?? (contract.service_order_id ? "service_order" : "application");

    if (applicationId && (
      contractSourceType !== "application"
      || contract.application_id !== applicationId
      || contract.service_order_id !== null
    )) {
      return noStoreJson(
        { error: "Nieprawidłowe powiązanie aplikacji z kontraktem." },
        { status: 400 },
      );
    }

    if (serviceOrderId && (
      contractSourceType !== "service_order"
      || contract.service_order_id !== serviceOrderId
      || contract.application_id !== null
    )) {
      return noStoreJson(
        { error: "Nieprawidłowe powiązanie Service Order z kontraktem." },
        { status: 400 },
      );
    }

    if (serviceOrderId) {
      const { data: serviceOrder, error: serviceOrderLinkError } = await supabase
        .from("service_orders")
        .select("id, contract_id, company_id")
        .eq("id", serviceOrderId)
        .single();

      if (serviceOrderLinkError && !isMissingRowError(serviceOrderLinkError)) {
        await logCheckoutError({
          source: "stripe.checkout.service_order_link_lookup_failed",
          error: serviceOrderLinkError,
          message: "Service order link lookup failed before creating Stripe Checkout session.",
          contractId,
          userId: user.id,
          context: {
            serviceOrderId,
          },
        });
        return jsonError("Nie udało się sprawdzić powiązania zlecenia.", 500);
      }

      if (serviceOrderLinkError || !serviceOrder || serviceOrder.contract_id !== contractId || serviceOrder.company_id !== user.id) {
        return noStoreJson(
          { error: "Nieprawidłowe powiązanie Service Order z kontraktem." },
          { status: 400 },
        );
      }
    }

    if (contract.terms_status !== "agreed") {
      return jsonError("Najpierw zaakceptujcie zakres i etapy zlecenia.", 400);
    }

    let offerTitle = "Zlecenie";
    let isPlatformService = false;
    let offerType: string | null = null;
    let sourceCommissionRate: number | null = null;

    if (applicationId) {
      const { data: application, error: applicationLookupError } = await supabase
        .from("applications")
        .select("offers(tytul, is_platform_service, typ, commission_rate)")
        .eq("id", applicationId)
        .single();

      if (applicationLookupError && !isMissingRowError(applicationLookupError)) {
        await logCheckoutError({
          source: "stripe.checkout.application_lookup_failed",
          error: applicationLookupError,
          message: "Application details lookup failed before creating Stripe Checkout session.",
          contractId,
          userId: user.id,
          context: {
            applicationId,
          },
        });
        return jsonError("Nie udało się pobrać danych zlecenia.", 500);
      }

      const applicationTyped = application as ApplicationInfo | null;
      if (applicationLookupError || !applicationTyped) {
        return jsonError("Nie znaleziono danych zlecenia.", 400);
      }

      offerTitle = applicationTyped?.offers?.tytul || "Zlecenie";
      isPlatformService = applicationTyped?.offers?.is_platform_service === true;
      offerType = applicationTyped?.offers?.typ ?? null;
      sourceCommissionRate = applicationTyped?.offers?.commission_rate ?? null;
    } else if (serviceOrderId) {
      const { data: serviceOrderData, error: serviceOrderLookupError } = await supabase
        .from("service_orders")
        .select("title, package_id")
        .eq("id", serviceOrderId)
        .single();

      if (serviceOrderLookupError && !isMissingRowError(serviceOrderLookupError)) {
        await logCheckoutError({
          source: "stripe.checkout.service_order_lookup_failed",
          error: serviceOrderLookupError,
          message: "Service order details lookup failed before creating Stripe Checkout session.",
          contractId,
          userId: user.id,
          context: {
            serviceOrderId,
          },
        });
        return jsonError("Nie udało się pobrać danych usługi.", 500);
      }

      const serviceOrder = serviceOrderData as ServiceOrderInfo | null;
      if (serviceOrderLookupError || !serviceOrder) {
        return jsonError("Nie znaleziono danych usługi.", 400);
      }

      offerTitle = serviceOrder?.title || "Usługa serwisowa";
      isPlatformService = true;

      if (serviceOrder?.package_id) {
        const { data: servicePackageData, error: servicePackageLookupError } = await supabase
          .from("service_packages")
          .select("commission_rate")
          .eq("id", serviceOrder.package_id)
          .maybeSingle();

        if (servicePackageLookupError) {
          await logCheckoutError({
            source: "stripe.checkout.service_package_lookup_failed",
            error: servicePackageLookupError,
            message: "Service package commission lookup failed before creating Stripe Checkout session.",
            contractId,
            userId: user.id,
            context: {
              serviceOrderId,
              packageId: serviceOrder.package_id,
            },
          });
          return jsonError("Nie udało się pobrać danych pakietu usługi.", 500);
        }

        const servicePackage = servicePackageData as ServicePackageInfo | null;
        sourceCommissionRate = servicePackage?.commission_rate ?? null;
      }
    }

    const milestones = (contract.milestones || []) as MilestoneRow[];
    if (milestones.length === 0) {
      return noStoreJson(
        { error: "Nie można zasilić depozytu przed ustaleniem etapów." },
        { status: 400 },
      );
    }

    if (!contract.company_contract_accepted_at || !contract.student_contract_accepted_at) {
      return noStoreJson(
        { error: "Obie strony muszą zaakceptować umowę przed płatnością." },
        { status: 400 },
      );
    }

    const { data: contractDocumentsData, error: contractDocumentsError } = await supabase
      .from("contract_documents")
      .select("document_type, company_accepted_at, student_accepted_at")
      .eq("contract_id", contractId)
      .in("document_type", ["contract_a", "contract_b"]);

    if (contractDocumentsError) {
      await logCheckoutError({
        source: "stripe.checkout.contract_documents_lookup_failed",
        error: contractDocumentsError,
        message: "Contract documents lookup failed before creating Stripe Checkout session.",
        contractId,
        userId: user.id,
      });
      return noStoreJson(
        { error: "Nie udało się sprawdzić akceptacji umów." },
        { status: 500 },
      );
    }

    const contractDocuments = (contractDocumentsData ?? []) as ContractDocumentRow[];
    const contractA = contractDocuments.find((document) => document.document_type === "contract_a");
    const contractB = contractDocuments.find((document) => document.document_type === "contract_b");

    if (!contractA?.company_accepted_at || !contractB?.student_accepted_at) {
      return noStoreJson(
        { error: "Najpierw wygenerujcie i zaakceptujcie właściwe umowy." },
        { status: 400 },
      );
    }

    if (!contract.student_id) {
      return noStoreJson(
        { error: "Nie można uruchomić płatności bez przypisanego studenta." },
        { status: 409 },
      );
    }

    const fundingMode = contract.funding_mode === "sequential" ? "sequential" : "full";
    const allowedStatuses = fundingMode === "sequential"
      ? ["awaiting_funding", "draft", "active"]
      : ["awaiting_funding", "draft"];
    if (!allowedStatuses.includes(contract.status as string)) {
      return jsonError("Ta płatność nie jest już dostępna dla tego zlecenia.", 400);
    }

    const { data: existingPaymentData, error: existingPaymentError } = await supabase
      .from("payments")
      .select("stripe_session_id")
      .eq("contract_id", contractId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const existingPayment = existingPaymentData as ExistingPaymentRow | null;

    if (existingPaymentError) {
      await logCheckoutError({
        source: "stripe.checkout.existing_payment_lookup_failed",
        error: existingPaymentError,
        message: "Existing pending payment lookup failed before creating Stripe Checkout session.",
        contractId,
        userId: user.id,
      });
      return jsonError("Nie udało się sprawdzić istniejącej płatności.", 500);
    }

    if (existingPayment) {
      try {
        const existingSession = await getStripe().checkout.sessions.retrieve(existingPayment.stripe_session_id);
        if (existingSession && existingSession.status === "open") {
          return noStoreJson({
            url: existingSession.url,
            sessionId: existingSession.id,
            reused: true,
          });
        }

        if (existingSession.status === "expired") {
          const { error: expiredPaymentUpdateError } = await supabase
            .from("payments")
            .update({ status: "expired" })
            .eq("stripe_session_id", existingPayment.stripe_session_id)
            .eq("status", "pending");

          if (expiredPaymentUpdateError) {
            await logCheckoutError({
              source: "stripe.checkout.expired_payment_update_failed",
              error: expiredPaymentUpdateError,
              message: "Could not mark expired Stripe Checkout session as expired.",
              contractId,
              stripeSessionId: existingPayment.stripe_session_id,
              userId: user.id,
            });
          }
        }

        if (existingSession.status === "complete") {
          return jsonError("Ta płatność jest już przetwarzana.", 409);
        }
      } catch (error) {
        await logCheckoutError({
          source: "stripe.checkout.existing_session_retrieve_failed",
          level: "warning",
          error,
          message: "Could not retrieve existing Stripe Checkout session for reuse.",
          contractId,
          stripeSessionId: existingPayment.stripe_session_id,
          userId: user.id,
        });
      }
    }

    const parsedAmount = Number(contract.total_amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return jsonError("Nieprawidłowa kwota kontraktu w bazie.", 400);
    }

    const awaitingMilestones = milestones.filter((milestone) =>
      ["awaiting_funding", "draft"].includes(String(milestone.status)),
    );
    const payableMilestones = fundingMode === "sequential"
      ? awaitingMilestones.slice(0, 1)
      : (awaitingMilestones.length > 0 ? awaitingMilestones : milestones);

    if (payableMilestones.length === 0) {
      return noStoreJson(
        { error: "Nie ma etapu, który można teraz zasilić depozytem." },
        { status: 400 },
      );
    }

    const milestoneIds = payableMilestones.map((milestone) => milestone.id);
    const milestoneTitles = payableMilestones.map((milestone) => milestone.title || "Etap").join(", ");
    const payableAmountInGrosze = fundingMode === "sequential"
      ? milestoneAmountMinor(payableMilestones[0])
      : Math.round(parsedAmount * 100);

    if (!payableAmountInGrosze || payableAmountInGrosze <= 0) {
      return jsonError("Nieprawidłowa kwota etapu w bazie.", 400);
    }

    const payableAmount = payableAmountInGrosze / 100;
    if (payableAmount > 500_000) {
      return jsonError("Kwota kontraktu przekracza dozwolony limit.", 400);
    }

    const commissionRate = resolveCommissionRate({
      explicitRate: contract.commission_rate ?? sourceCommissionRate,
      sourceType: serviceOrderId ? "service_order" : "application",
      offerType,
      isPlatformService,
    });
    const platformFee = calculatePlatformFee(payableAmountInGrosze, commissionRate);

    const baseUrl = resolveServerAppUrl(req);

    if (!baseUrl) {
      await logCheckoutError({
        source: "stripe.checkout.app_url_missing",
        message: "Could not determine base URL for Stripe Checkout session.",
        contractId,
        userId: user.id,
      });
      return jsonError("Konfiguracja aplikacji jest niekompletna.", 500);
    }

    const sourceId = applicationId ?? serviceOrderId;
    if (!sourceId) {
      return jsonError("Płatność musi dotyczyć zlecenia.", 400);
    }
    const checkoutAttemptWindow = Math.floor(Date.now() / 60_000);
    const sessionExpiresAt = (checkoutAttemptWindow + 1) * 60 + 30 * 60;
    const idempotencyKey = buildCheckoutIdempotencyKey({
      contractId,
      sourceId,
      milestoneIds,
      amountMinor: payableAmountInGrosze,
      attemptWindow: checkoutAttemptWindow,
    });
    const successUrl = `${baseUrl}/app/deliverables/${sourceId}?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/app/deliverables/${sourceId}?payment=cancelled`;

    const session = await getStripe().checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "pln",
              product_data: {
                name: `Depozyt: ${offerTitle}`,
                description: milestoneTitles ? `Etapy: ${milestoneTitles}` : "Bezpieczna płatność za zlecenie",
              },
              unit_amount: payableAmountInGrosze,
            },
            quantity: 1,
          },
        ],
        metadata: {
          contract_id: contractId,
          application_id: applicationId || "",
          service_order_id: serviceOrderId || "",
          milestone_ids: JSON.stringify(milestoneIds),
          platform_fee: platformFee.toString(),
          commission_rate: commissionRate.toString(),
          funding_mode: fundingMode,
          user_id: user.id,
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        locale: "pl",
        billing_address_collection: "auto",
        expires_at: sessionExpiresAt,
      },
      { idempotencyKey },
    );

    const { error: paymentError } = await supabase.from("payments").insert({
      contract_id: contractId,
      stripe_session_id: session.id,
      amount_total: payableAmountInGrosze,
      platform_fee: platformFee,
      status: "pending",
    });

    if (paymentError) {
      if (paymentError.code === "23505") {
        const { data: sameSessionPayment, error: sameSessionPaymentError } = await supabase
          .from("payments")
          .select("stripe_session_id")
          .eq("stripe_session_id", session.id)
          .maybeSingle<ExistingPaymentRow>();

        if (sameSessionPaymentError) {
          await logCheckoutError({
            source: "stripe.checkout.same_session_lookup_failed",
            error: sameSessionPaymentError,
            message: "Same-session payment lookup failed after duplicate payment insert.",
            contractId,
            stripeSessionId: session.id,
            userId: user.id,
          });
          await expireCheckoutSession(session.id);
          return jsonError("Nie udało się sprawdzić istniejącej płatności.", 500);
        }

        if (sameSessionPayment?.stripe_session_id === session.id && session.url) {
          return noStoreJson({
            url: session.url,
            sessionId: session.id,
            reused: true,
          });
        }

        await expireCheckoutSession(session.id);

        const { data: pendingPayment, error: pendingPaymentError } = await supabase
          .from("payments")
          .select("stripe_session_id")
          .eq("contract_id", contractId)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<ExistingPaymentRow>();

        if (pendingPaymentError) {
          await logCheckoutError({
            source: "stripe.checkout.pending_payment_lookup_failed",
            error: pendingPaymentError,
            message: "Pending payment lookup failed after duplicate payment insert.",
            contractId,
            stripeSessionId: session.id,
            userId: user.id,
          });
          return jsonError("Nie udało się sprawdzić istniejącej płatności.", 500);
        }

        if (pendingPayment?.stripe_session_id) {
          try {
            const pendingSession = await getStripe().checkout.sessions.retrieve(pendingPayment.stripe_session_id);
            if (pendingSession.status === "open" && pendingSession.url) {
              return noStoreJson({
                url: pendingSession.url,
                sessionId: pendingSession.id,
                reused: true,
              });
            }
          } catch (error) {
            await logCheckoutError({
              source: "stripe.checkout.pending_session_retrieve_failed",
              level: "warning",
              error,
              message: "Could not retrieve pending Stripe Checkout session after duplicate payment insert.",
              contractId,
              stripeSessionId: pendingPayment.stripe_session_id,
              userId: user.id,
            });
          }
        }

        return jsonError("Płatność dla tego zlecenia jest już przygotowywana. Odśwież stronę i spróbuj ponownie.", 409);
      }

      await logCheckoutError({
        source: "stripe.checkout.payment_insert_failed",
        error: paymentError,
        message: "Failed to persist payment record after creating Stripe Checkout session.",
        contractId,
        stripeSessionId: session.id,
        userId: user.id,
        context: {
          amountMinor: payableAmountInGrosze,
          fundingMode,
        },
      });
      await expireCheckoutSession(session.id);
      return jsonError("Nie udało się zapisać płatności. Spróbuj ponownie za chwilę.", 500);
    }

    return noStoreJson({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: unknown) {
    await logCheckoutError({
      source: "stripe.checkout.unexpected",
      error,
      message: "Unexpected error while creating Stripe Checkout session.",
      userId: actorUserId,
    });
    return noStoreJson(
      { error: "Nie udało się przygotować płatności. Spróbuj ponownie za chwilę." },
      { status: 500 },
    );
  }
}
