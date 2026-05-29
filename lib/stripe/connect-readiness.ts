import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

export type StripeConnectReadiness =
  | {
      ready: true;
      account: Stripe.Account;
    }
  | {
      ready: false;
      account: Stripe.Account | null;
      message: string;
    };

export function isPayoutAccountReady(account: Stripe.Account): boolean {
  return Boolean(
    account.details_submitted
    && account.payouts_enabled
    && account.capabilities?.transfers === "active",
  );
}

export async function checkPayoutAccountReadiness(accountId: string): Promise<StripeConnectReadiness> {
  try {
    const account = await getStripe().accounts.retrieve(accountId);

    if (isPayoutAccountReady(account)) {
      return { ready: true, account };
    }

    if (account.capabilities?.transfers === "pending") {
      return {
        ready: false,
        account,
        message: "Konto Stripe studenta czeka jeszcze na weryfikacje. Ponow wyplate po zakonczeniu weryfikacji Stripe.",
      };
    }

    return {
      ready: false,
      account,
      message: "Konto Stripe studenta nie jest jeszcze gotowe do transferow. Popros studenta o dokonczenie onboardingu Stripe i ponow wyplate.",
    };
  } catch {
    return {
      ready: false,
      account: null,
      message: "Nie udalo sie potwierdzic gotowosci konta Stripe studenta. Sprobuj ponownie za chwile.",
    };
  }
}
