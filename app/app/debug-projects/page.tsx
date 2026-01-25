import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DebugProjectsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Not logged in</div>;

    // 1. Fetch ALL contracts regardless of status
    const { data: contracts, error: contractError } = await supabase
        .from("contracts")
        .select(`
      id,
      created_at,
      status,
      application_id,
      service_order_id,
      applications:application_id (
        id,
        student_id,
        offer_id
      ),
      service_orders:service_order_id (
        id,
        student_id
      )
    `);

    // 2. Fetch Manual Entries
    const { data: manual, error: manualError } = await supabase
        .from("experience_entries")
        .select("*")
        .eq("student_id", user.id);

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 bg-white min-h-screen text-slate-900">
            <h1 className="text-2xl font-bold border-b pb-4">Debug: Projects & Contracts</h1>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold">User Info</h2>
                <pre className="bg-slate-100 p-4 rounded text-xs">
                    ID: {user.id}
                </pre>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold">Raw Contracts (All Statuses)</h2>
                {contractError ? (
                    <div className="text-red-500">{JSON.stringify(contractError, null, 2)}</div>
                ) : (
                    <div className="space-y-4">
                        {contracts?.map((c: any) => {
                            const appStudent = c.applications?.student_id;
                            const soStudent = c.service_orders?.student_id;
                            const isMyStudent = appStudent === user.id || soStudent === user.id;

                            return (
                                <div key={c.id} className={`p-4 border rounded ${isMyStudent ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                                    <div className="font-bold">Contract ID: {c.id}</div>
                                    <div>Status: <span className="font-mono bg-yellow-100 px-1">{c.status}</span></div>
                                    <div className="text-xs mt-2 font-mono text-slate-600">
                                        Application ID: {c.application_id} (Student: {appStudent ?? 'N/A'})<br />
                                        Service Order ID: {c.service_order_id} (Student: {soStudent ?? 'N/A'})
                                    </div>
                                    <div className="mt-2 text-sm">
                                        {isMyStudent
                                            ? <span className="text-green-600 font-bold">MATCH: You are the student</span>
                                            : <span className="text-red-600 font-bold">MISMATCH: You are not the student</span>
                                        }
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold">Manual Experience Entries</h2>
                <pre className="bg-slate-100 p-4 rounded text-xs overflow-auto">
                    {JSON.stringify(manual, null, 2)}
                </pre>
            </div>
        </div>
    );
}
