import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CompanyApplicationsRoute({
  searchParams,
}: {
  searchParams: Promise<{ offerId?: string }>;
}) {
  const { offerId } = await searchParams;

  if (offerId) {
    redirect(`/app/company/offers/${offerId}`);
  }

  redirect("/app/company/offers");
}
