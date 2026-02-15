import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clock, FileText, Lock, MessageSquare, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

// Components for Tabs
import { StatusTab } from "./tabs/StatusTab";
import { FilesTab } from "./tabs/FilesTab";
import { SecretsTab } from "./tabs/SecretsTab";
import { ChatTab } from "./tabs/ChatTab"; // We might embed Chat or just link

export const dynamic = "force-dynamic";

export default async function RealizationWorkspace({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: applicationId } = await params;
    const supabase = await createClient();

    const { data: userRaw } = await supabase.auth.getUser();
    const user = userRaw.user;
    if (!user) redirect("/auth");

    // Unified Fetch (App or Service Order)
    let appRow = null;
    let isServiceOrder = false;

    // 1. Try Application
    const { data: application, error: appError } = await supabase
        .from("applications")
        .select(`
            id, status, realization_status, student_id, offer_id, created_at, agreed_stawka,
            offers ( id, tytul, company_id, stawka, typ, is_platform_service )
        `)
        .eq("id", applicationId)
        .maybeSingle();

    if (application) {
        appRow = application;
    } else {
        // 2. Try Service Order
        const { data: serviceOrder, error: soError } = await supabase
            .from("service_orders")
            .select(`
                id, status, student_id, company_id, amount, created_at, package_id,
                package:service_packages( title, type )
            `)
            .eq("id", applicationId)
            .maybeSingle();

        if (serviceOrder) {
            isServiceOrder = true;
            // Polyfill to look like 'appRow'
            const so = serviceOrder as any;
            appRow = {
                id: so.id,
                status: so.status,
                realization_status: so.status === 'completed' ? 'completed' : 'pending',
                student_id: so.student_id,
                offer_id: null,
                agreed_stawka: so.amount, // For service orders, amount IS the agreed price
                offers: {
                    id: null,
                    tytul: so.package?.title || "Zlecenie Usługi",
                    company_id: so.company_id,
                    stawka: so.amount,
                    typ: 'service_order',
                    is_platform_service: so.package?.type === 'platform_service'
                },
                created_at: so.created_at,
                package_id: so.package_id
            };
        }
    }

    if (!appRow) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                <div className="bg-slate-50 p-6 rounded-full">
                    <Briefcase className="w-12 h-12 text-slate-300" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-slate-900">Nie znaleziono zlecenia</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        To zlecenie nie istnieje lub nie masz do niego dostępu.
                    </p>
                    <Link href="/app" className="inline-block mt-4 text-indigo-600 hover:text-indigo-700 font-medium">
                        Wróć do pulpitu
                    </Link>
                </div>
            </div>
        );
    }

    const offer = Array.isArray(appRow.offers) ? appRow.offers[0] : appRow.offers;
    const companyId = offer?.company_id;
    const studentId = appRow.student_id;

    const isStudent = user.id === studentId;
    const isCompany = user.id === companyId;

    if (!isStudent && !isCompany) {
        return <div className="p-12 text-center text-red-500">Brak uprawnień do tego zlecenia (ID użytkownika nie pasuje).</div>;
    }

    // --- PRELOAD DATA FOR TABS ---
    // --- PRELOAD DATA FOR TABS ---

    // Dynamic Filter
    const filterColumn = isServiceOrder ? "service_order_id" : "application_id";

    // 1. Deliverables (Student Work)
    const { data: deliverables } = await supabase
        .from("deliverables")
        .select("*")
        .eq(filterColumn, applicationId) // applicationId variable holds the ID
        .order("created_at", { ascending: false });

    // 2. Reviews
    const { data: reviews } = await supabase
        .from("reviews")
        .select("*")
        .eq(filterColumn, applicationId);

    // 3. Resources (Company Files)
    const { data: resources } = await supabase
        .from("project_resources")
        .select("*")
        .eq(filterColumn, applicationId)
        .order("created_at", { ascending: false });

    // 4. Secrets
    const { data: secrets } = await supabase
        .from("project_secrets")
        .select("*")
        .eq(filterColumn, applicationId)
        .order("created_at", { ascending: false });

    // 5. Conversation ID for Chat
    // Chat might not support service_order_id yet. 
    // We try to fetch by application_id if not service order, otherwise we might skip or need schema update.
    // For now, we try dynamic column, assuming Conversation schema supports it (or will support it).
    // If not, it will return error or empty.
    let conversation = null;
    if (!isServiceOrder) {
        const { data: conv } = await supabase
            .from("conversations")
            .select("id")
            .eq("application_id", applicationId)
            .maybeSingle();
        conversation = conv;
    } else {
        // TEMPORAL MATCHING HEURISTIC
        // Since we don't have service_order_id in conversations, we match by TIME.
        // We find the conversation created closest to the Order creation time.
        // Orders and Chats created via 'createOrder' have nearly identical timestamps.

        const orderTime = new Date((appRow as any).created_at).getTime();
        const pkgId = (appRow as any).package_id;

        console.log("DEBUG: Temporal Matching Start", { orderId: applicationId, orderTime, pkgId });

        if (pkgId) {
            const { data: candidates } = await supabase
                .from("conversations")
                .select("id, created_at")
                .eq("company_id", companyId)
                .eq("student_id", studentId)
                .eq("package_id", pkgId)
                .order("created_at", { ascending: true }); // Get all history

            console.log("DEBUG: Candidates found:", candidates?.length, candidates);

            if (candidates && candidates.length > 0) {
                // Find candidate with min time difference
                let best = candidates[0];
                let minDiff = Infinity;

                for (const c of candidates) {
                    const cTime = new Date(c.created_at).getTime();
                    const diff = Math.abs(cTime - orderTime);
                    console.log(`DEBUG: Checking candidate ${c.id}: time=${cTime}, diff=${diff}`);
                    if (diff < minDiff) {
                        minDiff = diff;
                        best = c;
                    }
                }


                console.log("DEBUG: Selected Best Match:", best.id, "diff:", minDiff);
                conversation = best;
            } else {
                console.log("DEBUG: No candidates found.");
            }
        } else {
            console.log("DEBUG: Missing Package ID.");
        }
    }

    // FALLBACK: If temporal matching failed (e.g. no package_id or no exact match), 
    // try to find ANY conversation for these users to avoid empty state.
    if (!conversation && studentId && companyId) {
        console.log("DEBUG: Fallback to latest conversation.");
        const { data: latestConv } = await supabase
            .from("conversations")
            .select("id")
            .eq("company_id", companyId)
            .eq("student_id", studentId)
            .order("updated_at", { ascending: false }) // Get most active
            .limit(1)
            .maybeSingle();
        if (latestConv) conversation = latestConv;
    }
    // 6. [Realization Guard] Contract & Milestones
    // Try by Application ID first, then Service Order ID
    let { data: contract } = await supabase
        .from("contracts")
        .select("*, milestones(*)")
        .order("idx", { foreignTable: "milestones", ascending: true })
        .or(`application_id.eq.${applicationId},service_order_id.eq.${applicationId}`)
        .maybeSingle();

    // [AUTO-HEAL] If contract is missing for a valid Service Order, try to generate it now.
    // This handles cases where the initial status update didn't trigger the RPC or SQL patch wasn't run.
    if (!contract && isServiceOrder && appRow.status !== 'rejected') {
        const { data: newContractId, error: rpcError } = await supabase.rpc('ensure_contract_for_service_order', {
            p_service_order_id: applicationId
        });

        if (newContractId && !rpcError) {
            // Re-fetch contract immediately
            const { data: refreshedContract } = await supabase
                .from("contracts")
                .select("*, milestones(*)")
                .eq("service_order_id", applicationId)
                .maybeSingle();

            if (refreshedContract) {
                contract = refreshedContract;
            }
        }
    }


    // --- HELPERS ---
    const currentDeliv = deliverables?.[0]; // Latest deliverable
    const status = appRow.realization_status;
    const myReview = reviews?.find(r => r.reviewer_id === user.id);
    const theirReview = reviews?.find(r => r.reviewer_id !== user.id);

    return (
        <main className="min-h-screen bg-[#f8fafc]">
            {/* PREMIUM HEADER - Dark Gradient */}
            <div className="relative overflow-hidden bg-slate-900 pt-8 pb-16">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] -ml-48 -mb-48 pointer-events-none" />

                <div className="container mx-auto max-w-6xl px-4 relative z-10">
                    <div className="flex flex-col gap-6">
                        <Link
                            href={isCompany ? "/app/company/offers" : "/app/applications"}
                            className="group flex items-center gap-2 text-slate-400 hover:text-white transition-all w-fit px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-bold uppercase tracking-wider">Twoje Zlecenia</span>
                        </Link>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl ring-1 ring-indigo-500/50">
                                        <Briefcase className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                                Panel Realizacji
                                            </h1>
                                            <Badge className={cn(
                                                "px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest",
                                                status === 'completed' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                                                    status === 'delivered' ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                                                        "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                                            )}>
                                                {status === 'in_progress' && "W trakcie"}
                                                {status === 'delivered' && "W trakcie odbioru"}
                                                {status === 'completed' && "Zakończone"}
                                            </Badge>
                                        </div>
                                        <p className="text-slate-400 font-medium">
                                            Kontynuujesz pracę nad: <span className="text-white font-bold">{offer?.tytul}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="text-right hidden md:block">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Wartość zlecenia</p>
                                    <p className="text-xl font-black text-white">
                                        {(appRow.agreed_stawka || offer?.stawka) ? `${appRow.agreed_stawka || offer.stawka} PLN` : "---"}
                                    </p>
                                </div>
                                <div className="h-10 w-px bg-white/10 mx-2 hidden md:block" />
                                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">ID Zlecenia</p>
                                    <code className="text-xs text-indigo-400 font-mono">#{applicationId.slice(0, 8)}</code>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="container mx-auto max-w-6xl px-4 -mt-10 relative z-20 pb-20">
                <Tabs defaultValue="status" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/80 backdrop-blur-md p-3 rounded-[2rem] border border-white/50 shadow-xl shadow-slate-200/50">
                        <TabsList className="bg-slate-100/50 p-1.5 h-auto flex flex-wrap md:inline-flex w-full md:w-auto rounded-[1.5rem] gap-1.5 border-none">
                            <TabsTrigger value="status" className="flex-1 md:flex-none py-3 px-8 rounded-2xl font-black text-xs uppercase tracking-widest transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg shadow-slate-300">
                                <Clock className="w-4 h-4 mr-2" /> Status
                            </TabsTrigger>
                            <TabsTrigger value="files" className="flex-1 md:flex-none py-3 px-8 rounded-2xl font-black text-xs uppercase tracking-widest transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg shadow-slate-300">
                                <FileText className="w-4 h-4 mr-2" /> Pliki
                            </TabsTrigger>
                            <TabsTrigger value="secrets" className="flex-1 md:flex-none py-3 px-8 rounded-2xl font-black text-xs uppercase tracking-widest transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg shadow-slate-300">
                                <Lock className="w-4 h-4 mr-2" /> Dostępy
                            </TabsTrigger>
                            <TabsTrigger value="chat" className="flex-1 md:flex-none py-3 px-8 rounded-2xl font-black text-xs uppercase tracking-widest transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg shadow-slate-300">
                                <MessageSquare className="w-4 h-4 mr-2" /> Wiadomości
                            </TabsTrigger>
                        </TabsList>

                        <div className="px-6 py-2 border-l border-slate-100 hidden lg:block">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sesja aktywna</span>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-[400px]">
                        <TabsContent value="status" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                            <StatusTab
                                status={status}
                                isStudent={isStudent}
                                isCompany={isCompany}
                                applicationId={applicationId}
                                currentDeliv={currentDeliv}
                                deliverables={deliverables ?? []}
                                myReview={myReview}
                                theirReview={theirReview}
                                contract={contract}
                                totalAmount={Number(appRow?.agreed_stawka || offer?.stawka || 0)}
                                enableNegotiation={!offer?.is_platform_service && offer?.typ !== 'job_offer'}
                            />
                        </TabsContent>

                        <TabsContent value="files" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                            <FilesTab
                                applicationId={applicationId}
                                resources={resources ?? []}
                                deliverables={deliverables ?? []}
                                isCompany={isCompany}
                            />
                        </TabsContent>

                        <TabsContent value="secrets" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                            <SecretsTab
                                applicationId={applicationId}
                                secrets={secrets ?? []}
                                isCompany={isCompany}
                            />
                        </TabsContent>

                        <TabsContent value="chat" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                            <ChatTab conversationId={conversation?.id} />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </main>
    );
}
