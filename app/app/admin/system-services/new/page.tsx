import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SystemServiceForm from "../_components/SystemServiceForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewSystemServicePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-6 md:py-10">
      <Button asChild variant="ghost" className="mb-2 pl-0 text-slate-300 hover:bg-transparent hover:text-white">
        <Link href="/app/admin/system-services">
          <ArrowLeft className="mr-2 h-4 w-4" /> Wroc do listy
        </Link>
      </Button>

      <div className="mb-6 space-y-1">
        <h1 className="text-3xl font-black text-white">Nowa Usługa Systemowa</h1>
        <p className="text-base text-slate-300">
          Zdefiniuj parametry, stawke i materialy dla nowej usługi gwarantowanej.
        </p>
      </div>

      <SystemServiceForm />
    </div>
  );
}
