import CompanyApplicationsView from "./applications-view";

export const dynamic = "force-dynamic";

export default async function CompanyApplicationsRoute({
  searchParams,
}: {
  searchParams: Promise<{ offerId?: string }>;
}) {
  return <CompanyApplicationsView searchParams={searchParams} />;
}
