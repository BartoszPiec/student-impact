
import { createClient } from "@/lib/supabase/server";

export default async function DebugBadgePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Not logged in</div>;

    // 1. Global Count
    const { count: globalCount, error: globalError } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .neq("sender_id", user.id)
        .is("read_at", null);

    // 2. Fetch actual messages that are unread
    const { data: messages, error: msgError } = await supabase
        .from("messages")
        .select("id, content, sender_id, read_at, conversation_id")
        .neq("sender_id", user.id)
        .is("read_at", null)
        .limit(5);

    // 3. Fetch related conversations to check visibility/RLS
    const convIds = Array.from(new Set(messages?.map((m: any) => m.conversation_id) || [])) as string[];
    let convs: any[] = [];
    let convError = null;

    if (convIds.length > 0) {
        const res = await supabase
            .from("conversations")
            .select("*")
            .in("id", convIds);
        convs = res.data || [];
        convError = res.error;
    }

    // 4. Simulate Sidebar Query (Recent 10)
    const { data: sidebarData, error: sidebarError } = await supabase
        .from("conversations")
        .select(`
            id, 
            type,
            updated_at,
            created_at,
            student_id,
            company_id,
            package_id,
            application_id,
            messages:messages(id, content, read_at, sender_id, created_at)
        `)
        .or(`student_id.eq.${user.id},company_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(10);

    // 5. Simulate INSERT (Test Permissions)
    const testCid = crypto.randomUUID();
    const { error: insertError } = await supabase
        .from("conversations")
        .insert({
            id: testCid,
            company_id: user.id,
            student_id: user.id, // Self chat to bypass other user constraints
            type: "inquiry",
            status: "active"
        });

    // Cleanup if successful
    let deleteError = null;
    if (!insertError) {
        const { error } = await supabase.from("conversations").delete().eq("id", testCid);
        deleteError = error;
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Debug Badge Logic</h1>
            <div className="space-y-4">
                <div className="p-4 border rounded bg-slate-50">
                    <h2 className="font-bold">Summary</h2>
                    <p>User ID: {user.id}</p>
                    <p>Global Unread Count (layout query): <strong>{globalCount}</strong> (Error: {globalError?.message || 'none'})</p>
                </div>

                <div className="p-4 border rounded bg-slate-50">
                    <h2 className="font-bold">INSERT Permission Test</h2>
                    <p>Attempting to create a test conversation (Status: active, Type: inquiry)...</p>
                    {insertError ? (
                        <p className="text-red-600 font-bold">INSERT FAILED: {insertError.message} (Code: {insertError.code})</p>
                    ) : (
                        <p className="text-green-600 font-bold">INSERT SUCCESS (Permissions OK)</p>
                    )}
                    {deleteError && <p className="text-orange-500">Cleanup Error: {deleteError.message}</p>}
                </div>

                <div className="p-4 border rounded bg-slate-50">
                    <h2 className="font-bold">Recent Conversations (Top 10)</h2>
                    {sidebarError ? <p className="text-red-600">Error: {sidebarError.message}</p> : (
                        <div className="space-y-4">
                            <p>Total Fetched: {sidebarData?.length}</p>
                            {sidebarData?.map((c: any) => (
                                <div key={c.id} className="text-xs bg-gray-100 p-2 rounded mb-2">
                                    <p><strong>ID:</strong> {c.id}</p>
                                    <p><strong>Type:</strong> {c.type} | <strong>Pkg:</strong> {c.package_id} | <strong>App:</strong> {c.application_id}</p>
                                    <p><strong>Created:</strong> {c.created_at} | <strong>Updated:</strong> {c.updated_at}</p>
                                    <p><strong>Messages:</strong> {c.messages?.length} (Last content: {c.messages?.[c.messages.length - 1]?.content || 'none'})</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border rounded bg-slate-50">
                    <h2 className="font-bold">Sample Unread Messages (Limit 5)</h2>
                    {/*...*/}
                    {msgError ? <p className="text-red-600">Error: {msgError.message}</p> : (
                        <pre className="text-xs bg-black text-white p-2 rounded overflow-auto">
                            {JSON.stringify(messages, null, 2)}
                        </pre>
                    )}
                </div>

                <div className="p-4 border rounded bg-slate-50">
                    <h2 className="font-bold">Related Conversations (Ids: {convIds.join(', ')})</h2>
                    {convError ? <p className="text-red-600">Error: {convError.message}</p> : (
                        <pre className="text-xs bg-black text-white p-2 rounded overflow-auto">
                            {JSON.stringify(convs, null, 2)}
                        </pre>
                    )}
                    {convs.length === 0 && convIds.length > 0 && <p className="text-red-600 font-bold">WARNING: Messages exist but Conversations are not visible (RLS restricted)!</p>}
                </div>
            </div>
        </div>
    );
}
