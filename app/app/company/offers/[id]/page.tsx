import { redirect } from "next/navigation";

export default async function CompanyOfferRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/app/offers/${id}`);
}
