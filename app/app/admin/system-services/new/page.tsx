
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SystemServiceForm from "../_components/SystemServiceForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewSystemServicePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

    return (
        <div className="container max-w-4xl mx-auto py-10 space-y-6">
            <Button asChild variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-indigo-600">
                <Link href="/app/admin/system-services">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Wróć do listy
                </Link>
            </Button>

            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900">Nowa Usługa Systemowa</h1>
                <p className="text-slate-500 text-lg">Zdefiniuj parametry, stawkę i materiały dla nowej usługi gwarantowanej.</p>
            </div>

            <SystemServiceForm />
        </div>
    );
}
