import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DebugExperiencePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Not logged in</div>;

    // REPLICATING LOGIC EXACTLY

    // 1. Fetch Manual Entries
    const { data: manualRows } = await supabase
        .from("experience_entries")
        .select("id, title, summary, link, created_at, offer_id")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

    // 2. Fetch User's Applications & Service Orders IDs
    const { data: myApps, error: appErr } = await supabase
        .from("applications")
        .select("id, offer_id, offers(tytul, opis)")
        .eq("student_id", user.id);

    const { data: myOrders, error: ordErr } = await supabase
        .from("service_orders")
        .select("id, title, description")
        .eq("student_id", user.id);

    const myAppIds = (myApps || []).map(a => a.id);
    const myOrderIds = (myOrders || []).map(o => o.id);

    // 3. Fetch Completed Contracts (Split Queries for Safety)
    let contractsFromApps: any[] = [];
    let appQueryErr = null;
    if (myAppIds.length > 0) {
        const { data, error } = await supabase
            .from("contracts")
            .select("*") // Selecting ALL to see if column hiding is issue
            .in("application_id", myAppIds)
            .eq("status", "completed");
        contractsFromApps = data || [];
        appQueryErr = error;
    }

    let contractsFromOrders: any[] = [];
    let ordQueryErr = null;
    if (myOrderIds.length > 0) {
        const { data, error } = await supabase
            .from("contracts")
            .select("*")
            .in("service_order_id", myOrderIds)
            .eq("status", "completed");
        contractsFromOrders = data || [];
        ordQueryErr = error;
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 bg-white min-h-screen text-slate-900 font-mono text-sm">
            <h1 className="text-2xl font-bold border-b pb-4">Debug: Experience Logic</h1>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-100 p-4 rounded">
                    <h3 className="font-bold">Applications ({myAppIds.length})</h3>
                    <pre>{JSON.stringify(myAppIds, null, 2)}</pre>
                    {appErr && <div className="text-red-500">{JSON.stringify(appErr)}</div>}
                </div>
                <div className="bg-slate-100 p-4 rounded">
                    <h3 className="font-bold">Service Orders ({myOrderIds.length})</h3>
                    <pre>{JSON.stringify(myOrderIds, null, 2)}</pre>
                    {ordErr && <div className="text-red-500">{JSON.stringify(ordErr)}</div>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-100 p-4 rounded">
                    <h3 className="font-bold">Contracts from Apps ({contractsFromApps.length})</h3>
                    <pre className="overflow-auto max-h-60">{JSON.stringify(contractsFromApps, null, 2)}</pre>
                    {appQueryErr && <div className="text-red-500">{JSON.stringify(appQueryErr)}</div>}
                </div>
                <div className="bg-blue-100 p-4 rounded">
                    <h3 className="font-bold">Contracts from Orders ({contractsFromOrders.length})</h3>
                    <pre className="overflow-auto max-h-60">{JSON.stringify(contractsFromOrders, null, 2)}</pre>
                    {ordQueryErr && <div className="text-red-500">{JSON.stringify(ordQueryErr)}</div>}
                </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded">
                <h3 className="font-bold">Manual Rows ({manualRows?.length})</h3>
                <pre>{JSON.stringify(manualRows, null, 2)}</pre>
            </div>

        </div>
    );
}
