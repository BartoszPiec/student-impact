import { redirect } from "next/navigation";

// Legacy "Giełda Zleceń" dla service_orders. Pozwalała przejąć zamówienie
// z pominięciem umów A/B i płatności (status od razu in_progress) i kierowała
// na nieistniejącą trasę /app/orders/[id]. Kanoniczny flow Quick Task to
// /app/company/packages -> customize -> przypisanie studenta -> umowy -> Stripe.
export default function LegacyOrdersMarketRedirectPage() {
  redirect("/app/jobs");
}
