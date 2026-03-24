import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clock, FileText, Lock, MessageSquare, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

// Components for Tabs
import { StatusTab } from "./tabs/StatusTab";
import { FilesTab } from "./tabs/FilesTab";
import { SecretsTab } from "./tabs/SecretsTab";
import { ChatTab } from "./tabs/ChatTab"; // We might embed Chat or just link

export const dynamic = "force-dynamic";

type RelationValue<T> = T | T[] | null;

type WorkspaceOffer = {
    id: string | null;
    tytul: string | null;
    company_id: string | null;
    stawka: number | null;
    typ: string | null;
    is_platform_service: boolean | null;
    service_package_id?: string | null;
};

type WorkspaceApplicationRow = {
    id: string;
    status: string;
    realization_status: string | null;
    student_id: string;
    offer_id: string | null;
    created_at: string;
    agreed_stawka: number | null;
    agreed_stawka_minor?: number | null;
    offers: RelationValue<WorkspaceOffer>;
};

type WorkspacePackage = {
    title: string | null;
    type: string | null;
    locked_content?: string | null;
};

type ServiceOrderRow = {
    id: string;
    status: string;
    student_id: string;
    company_id: string;
    amount: number | null;
    created_at: string;
    package_id: string | null;
    package: RelationValue<WorkspacePackage>;
};

type WorkspaceRow = {
    id: string;
    status: string;
    realization_status: string | null;
    student_id: string;
    offer_id: string | null;
    agreed_stawka: number | null;
    agreed_stawka_minor?: number | null;
    offers: RelationValue<WorkspaceOffer>;
    created_at: string;
    package_id: string | null;
};

type ReviewRow = {
    reviewer_id: string;
};

type ConversationMatch = {
    id: string;
};

type ContractDocumentRow = {
    id: string;
    created_at: string | null;
};

function unwrapRelation<T>(value: RelationValue<T>): T | null {
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }

    return value ?? null;
}

function fromMinorUnits(value?: number | null): number | null {
    if (value == null || !Number.isFinite(value)) return null;
    return value / 100;
}

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
    let appRow: WorkspaceRow | null = null;
    let isServiceOrder = false;

    // 1. Try Application
    const { data: application } = await supabase
        .from("applications")
        .select(`
            id, status, realization_status, student_id, offer_id, created_at, agreed_stawka, agreed_stawka_minor,
            offers ( id, tytul, company_id, stawka, typ, is_platform_service, service_package_id )
        `)
        .eq("id", applicationId)
        .maybeSingle();

    const applicationRow = application as WorkspaceApplicationRow | null;

    if (applicationRow) {
        appRow = {
            ...applicationRow,
            package_id: null,
        };
    } else {
        // 2. Try Service Order
        const { data: serviceOrder } = await supabase
            .from("service_orders")
            .select(`
                id, status, student_id, company_id, amount, created_at, package_id,
                package:service_packages( title, type )
            `)
            .eq("id", applicationId)
            .maybeSingle();

        const serviceOrderRow = serviceOrder as ServiceOrderRow | null;

        if (serviceOrderRow) {
            isServiceOrder = true;
            const pkg = unwrapRelation(serviceOrderRow.package);
            const so = { ...serviceOrderRow, package: pkg };
            appRow = {
                id: serviceOrderRow.id,
                status: serviceOrderRow.status,
                realization_status: serviceOrderRow.status === "completed" ? "completed" : "pending",
                student_id: serviceOrderRow.student_id,
                offer_id: null,
                agreed_stawka: serviceOrderRow.amount,
                agreed_stawka_minor: serviceOrderRow.amount != null ? Math.round(serviceOrderRow.amount * 100) : null,
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
                <div className="bg-slate-50 p-6 rounded-none border border-slate-200 shadow-sm">
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

    const offer = unwrapRelation(appRow.offers);
    const companyId = offer?.company_id;
    const studentId = appRow.student_id;

    const isStudent = user.id === studentId;
    const isCompany = user.id === companyId;

    // Fetch student-only instructions (locked_content) from service_package — only for platform services
    let studentInstructions: string | null = null;
    const servicePackageId = offer?.service_package_id ?? appRow.package_id ?? null;
    if (isStudent && servicePackageId) {
        const { data: pkgData } = await supabase
            .from("service_packages")
            .select("locked_content")
            .eq("id", servicePackageId)
            .maybeSingle();
        const pkg = pkgData as { locked_content: string | null } | null;
        studentInstructions = pkg?.locked_content ?? null;
    }

    if (!isStudent && !isCompany) {
        return <div className="p-12 text-center text-red-500">Brak uprawnień do tego zlecenia (ID użytkownika nie pasuje).</div>;
    }

    // --- PRELOAD DATA FOR TABS ---
    // --- PRELOAD DATA FOR TABS ---

    // Dynamic Filter
    const filterColumn = isServiceOrder ? "service_order_id" : "application_id";

    // 1. Deliverables (Student Work)
    const { data: deliverablesData } = await supabase
        .from("deliverables")
        .select("*")
        .eq(filterColumn, applicationId) // applicationId variable holds the ID
        .order("created_at", { ascending: false });
    const deliverables = deliverablesData ?? [];

    // 2. Reviews
    const { data: reviewsData } = await supabase
        .from("reviews")
        .select("*")
        .eq(filterColumn, applicationId);
    const reviews = (reviewsData ?? []) as ReviewRow[];

    // 3. Resources (Company Files)
    const { data: resourcesData } = await supabase
        .from("project_resources")
        .select("*")
        .eq(filterColumn, applicationId)
        .order("created_at", { ascending: false });
    const resources = resourcesData ?? [];

    // 4. Secrets
    const { data: secretsData } = await supabase
        .from("project_secrets")
        .select("*")
        .eq(filterColumn, applicationId)
        .order("created_at", { ascending: false });
    const secrets = secretsData ?? [];

    // 5. Conversation ID for Chat
    // Chat might not support service_order_id yet. 
    // We try to fetch by application_id if not service order, otherwise we might skip or need schema update.
    // For now, we try dynamic column, assuming Conversation schema supports it (or will support it).
    // If not, it will return error or empty.
    let conversation: ConversationMatch | null = null;
    if (!isServiceOrder) {
        const { data: convData } = await supabase
            .from("conversations")
            .select("id")
            .eq("application_id", applicationId)
            .maybeSingle();
        conversation = convData as ConversationMatch | null;
    } else if (servicePackageId && studentId && companyId) {
        const { data: latestConv } = await supabase
            .from("conversations")
            .select("id")
            .eq("package_id", servicePackageId)
            .eq("company_id", companyId)
            .eq("student_id", studentId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        conversation = latestConv as ConversationMatch | null;
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


    // 7. Contract Documents (PDF umowy)
    let contractDocuments: ContractDocumentRow[] = [];
    if (contract?.id) {
        const { data: docs } = await supabase
            .from("contract_documents")
            .select("*")
            .eq("contract_id", contract.id)
            .order("created_at", { ascending: true });
        contractDocuments = (docs ?? []) as ContractDocumentRow[];
    }

    // --- HELPERS ---
    const currentDeliv = deliverables?.[0]; // Latest deliverable
    const status = appRow.realization_status ?? appRow.status;
    const myReview = reviews.find((review) => review.reviewer_id === user.id);
    const theirReview = reviews.find((review) => review.reviewer_id !== user.id);
    const agreedAmount = appRow.agreed_stawka ?? fromMinorUnits(appRow.agreed_stawka_minor) ?? offer?.stawka ?? null;

    return (
        <main className="min-h-screen bg-[#f8fafc]">
            {/* PREMIUM HEADER - Dark Gradient (Full Width) */}
            <div className="relative overflow-hidden bg-slate-950 pt-12 pb-20 border-b border-white/5 shadow-2xl">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] -ml-48 -mb-48 pointer-events-none" />
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] bg-repeat pointer-events-none" />

                <div className="container mx-auto max-w-[2000px] px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
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
                                    <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-none ring-1 ring-indigo-500/50">
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
                                        {agreedAmount != null ? `${agreedAmount} PLN` : "---"}
                                    </p>
                                </div>
                                <div className="h-10 w-px bg-white/10 mx-2 hidden md:block" />
                                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-none">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">ID Zlecenia</p>
                                    <code className="text-xs text-indigo-400 font-mono">#{applicationId.slice(0, 8)}</code>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="container mx-auto max-w-[2000px] px-4 sm:px-6 lg:px-8 xl:px-12 -mt-10 relative z-20 pb-20">
                <Tabs defaultValue="status" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/90 backdrop-blur-xl p-4 rounded-none border border-slate-200 shadow-2xl shadow-slate-200/40">
                        <TabsList className="bg-slate-100/50 p-1.5 h-auto flex flex-wrap md:inline-flex w-full md:w-auto rounded-none gap-1.5 border-none">
                            <TabsTrigger value="status" className="flex-1 md:flex-none py-2 md:py-3 px-3 md:px-8 rounded-none font-black text-[10px] md:text-xs uppercase tracking-wider md:tracking-widest transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg shadow-slate-300">
                                <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5" /> Status
                            </TabsTrigger>
                            <TabsTrigger value="files" className="flex-1 md:flex-none py-2 md:py-3 px-3 md:px-8 rounded-none font-black text-[10px] md:text-xs uppercase tracking-wider md:tracking-widest transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg shadow-slate-300">
                                <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5" /> Pliki
                            </TabsTrigger>
                            <TabsTrigger value="secrets" className="flex-1 md:flex-none py-2 md:py-3 px-3 md:px-8 rounded-none font-black text-[10px] md:text-xs uppercase tracking-wider md:tracking-widest transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg shadow-slate-300">
                                <Lock className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5" /> Dostępy
                            </TabsTrigger>
                            <TabsTrigger value="chat" className="flex-1 md:flex-none py-2 md:py-3 px-3 md:px-8 rounded-none font-black text-[10px] md:text-xs uppercase tracking-wider md:tracking-widest transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg shadow-slate-300">
                                <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5" /> Wiadomości
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
                                applicationStatus={appRow.status}
                                isStudent={isStudent}
                                isCompany={isCompany}
                                applicationId={applicationId}
                                currentDeliv={currentDeliv}
                                deliverables={deliverables ?? []}
                                myReview={myReview}
                                theirReview={theirReview}
                                contract={contract}
                                totalAmount={Number(agreedAmount || 0)}
                                enableNegotiation={!offer?.is_platform_service && offer?.typ !== 'job_offer'}
                                isPlatformService={offer?.is_platform_service ?? false}
                                studentInstructions={studentInstructions}
                                contractDocuments={contractDocuments}
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
