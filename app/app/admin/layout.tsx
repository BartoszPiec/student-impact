import { requireAdmin } from "@/lib/admin/auth";

/**
 * Layout admina — chroni WSZYSTKIE podstrony /app/admin/* przed nieadminami.
 * Każda strona w tym katalogu dziedziczy ten guard automatycznie.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin({ redirectOnFail: true });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.18),_transparent_28%),linear-gradient(180deg,_#0f172a_0%,_#020617_100%)]">
      <div className="mx-auto w-full max-w-[1680px] px-4 pb-12 pt-6 md:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
