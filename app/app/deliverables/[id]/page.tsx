import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Briefcase, Building2, ExternalLink } from "lucide-react";

// Components for Tabs
import { findConversationForServiceOrder } from "@/lib/services/service-order-conversations";
import { getCurrentUser } from "@/lib/auth/request-context";
import { WorkspaceTabs } from "./workspace-tabs";

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
    amount_minor?: number | null;
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
    rating: number;
    comment: string | null;
    created_at: string;
};

type ConversationMatch = {
    id: string;
};

type ContractDocumentRow = {
    id: string;
    contract_id: string;
    document_type: string;
    storage_path: string;
    file_name: string;
    company_accepted_at: string | null;
    student_accepted_at: string | null;
    generated_at: string;
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

    const user = await getCurrentUser();
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
                agreed_stawka_minor: serviceOrderRow.amount_minor ?? (serviceOrderRow.amount != null ? Math.round(serviceOrderRow.amount * 100) : null),
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
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
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

    // Fetch company name for the profile link (student view only)
    const servicePackageId = offer?.service_package_id ?? appRow.package_id ?? null;

    if (!isStudent && !isCompany) {
        return <div className="p-12 text-center text-red-500">Brak uprawnień do tego zlecenia (ID użytkownika nie pasuje).</div>;
    }

    // --- PRELOAD DATA FOR TABS ---
    // --- PRELOAD DATA FOR TABS ---

    // Dynamic Filter
    const filterColumn = isServiceOrder ? "service_order_id" : "application_id";

    // 1. Deliverables (Student Work)
    const conversationPromise = (async (): Promise<ConversationMatch | null> => {
        if (!isServiceOrder) {
            const { data } = await supabase
                .from("conversations")
                .select("id")
                .eq("application_id", applicationId)
                .maybeSingle();
            return data as ConversationMatch | null;
        }

        if (!servicePackageId || !companyId) return null;
        return findConversationForServiceOrder(supabase, {
            serviceOrderId: applicationId,
            companyId,
            studentId,
            packageId: servicePackageId,
        });
    })();

    const [companyResult, packageResult, deliverablesResult, reviewsResult, resourcesResult, secretsResult, conversation, contractResult] = await Promise.all([
        isStudent && companyId
            ? supabase.from("company_profiles").select("nazwa").eq("user_id", companyId).maybeSingle()
            : Promise.resolve({ data: null }),
        isStudent && servicePackageId
            ? supabase.from("service_packages").select("locked_content").eq("id", servicePackageId).maybeSingle()
            : Promise.resolve({ data: null }),
        supabase.from("deliverables").select("id, milestone_id, status, company_feedback, description, files, created_at").eq(filterColumn, applicationId).order("created_at", { ascending: false }),
        supabase.from("reviews").select("reviewer_id, rating, comment, created_at").eq(filterColumn, applicationId),
        supabase.from("project_resources").select("id, file_name, file_path, created_at").eq(filterColumn, applicationId).order("created_at", { ascending: false }),
        supabase.from("project_secrets").select("id, title, secret_value, created_at").eq(filterColumn, applicationId).order("created_at", { ascending: false }),
        conversationPromise,
        supabase
            .from("contracts")
            .select("id, status, funding_mode, terms_status, company_contract_accepted_at, student_contract_accepted_at, documents_generated_at, milestones(id, status, title, acceptance_criteria, amount, amount_minor, idx)")
            .order("idx", { foreignTable: "milestones", ascending: true })
            .or(`application_id.eq.${applicationId},service_order_id.eq.${applicationId}`)
            .maybeSingle(),
    ]);

    const companyName = (companyResult.data as { nazwa: string | null } | null)?.nazwa ?? null;
    const studentInstructions = (packageResult.data as { locked_content: string | null } | null)?.locked_content ?? null;
    const deliverables = deliverablesResult.data ?? [];
    const reviews = (reviewsResult.data ?? []) as ReviewRow[];
    const resources = resourcesResult.data ?? [];
    const secrets = secretsResult.data ?? [];
    const contract = contractResult.data;

    // 5. Conversation ID for Chat
    // Chat might not support service_order_id yet.
    // We try to fetch by application_id if not service order, otherwise we might skip or need schema update.
    // For now, we try dynamic column, assuming Conversation schema supports it (or will support it).
    // If not, it will return error or empty.
    // 7. Contract Documents (PDF umowy)
    let contractDocuments: ContractDocumentRow[] = [];
    if (contract?.id) {
        const { data: docs } = await supabase
            .from("contract_documents")
            .select("id, contract_id, document_type, storage_path, file_name, company_accepted_at, student_accepted_at, generated_at")
            .eq("contract_id", contract.id)
            .order("created_at", { ascending: true });
        contractDocuments = (docs ?? []) as ContractDocumentRow[];
    }

    // --- HELPERS ---
    const status = appRow.status === "cancelled" ? "cancelled" : (appRow.realization_status ?? appRow.status);
    const myReview = reviews.find((review) => review.reviewer_id === user.id);
    const theirReview = reviews.find((review) => review.reviewer_id !== user.id);
    const agreedAmount = fromMinorUnits(appRow.agreed_stawka_minor) ?? appRow.agreed_stawka ?? offer?.stawka ?? null;
    const backHref = isServiceOrder
        ? (isCompany ? "/app/company/orders" : "/app/services/dashboard")
        : (isCompany ? "/app/company/offers" : "/app/applications");
    const milestoneRows = (contract?.milestones ?? []) as Array<{ status: string | null }>;
    const hasFundedMilestone = milestoneRows.some((milestone) =>
        ["funded", "in_progress", "delivered", "released", "accepted", "completed"].includes(String(milestone.status)),
    );
    const hasDeliveredMilestone = milestoneRows.some((milestone) => milestone.status === "delivered");
    const hasWaitingFundingMilestone = milestoneRows.some((milestone) =>
        ["awaiting_funding", "draft"].includes(String(milestone.status)),
    );
    const companyAcceptedContract = Boolean(contract?.company_contract_accepted_at);
    const studentAcceptedContract = Boolean(contract?.student_contract_accepted_at);
    const nextActionLabel = (() => {
        if (appRow.status === "cancelled") return "Współpraca anulowana";
        if (contract?.status === "completed" || status === "completed") return "Wystaw opinię";
        if (!contract || contract.terms_status !== "agreed") return "Uzgodnij etapy";
        if (isCompany && !companyAcceptedContract) return "Zaakceptuj umowę";
        if (isStudent && !studentAcceptedContract) return "Zaakceptuj umowę";
        if (!companyAcceptedContract || !studentAcceptedContract) return "Czekamy na drugą stronę";
        if (hasWaitingFundingMilestone && !hasFundedMilestone) return isCompany ? "Zasil depozyt" : "Czekamy na płatność";
        if (hasDeliveredMilestone) return isCompany ? "Sprawdź pracę" : "Czekamy na odbiór";
        return isStudent ? "Prześlij efekt pracy" : "Czekamy na realizację";
    })();
    const projectTitle = offer?.tytul ?? "Zlecenie";
    const companyHref = isStudent && companyId ? `/app/companies/${companyId}` : null;
    const conversationHref = conversation?.id ? `/app/chat/${conversation.id}` : "/app/chat";

    return (
        <main className="min-h-screen bg-[#eef3f8]">
            <div className="relative overflow-hidden bg-[#102b66] pt-24 pb-8 shadow-[0_24px_70px_-54px_rgba(7,20,47,0.85)] sm:pt-28 sm:pb-10">
                <div className="container relative z-10 mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-5">
                        <Link
                            href={backHref}
                            className="group flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-white/70 transition-all hover:bg-white/12 hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Moje zlecenia</span>
                        </Link>

                        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                            <div className="min-w-0">
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                    <Badge className="rounded-full border border-emerald-300/25 bg-emerald-300/12 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-100">
                                        Workspace
                                    </Badge>
                                    <Badge className="rounded-full border border-violet-300/25 bg-violet-300/12 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-violet-100">
                                        {status === "completed" ? "Zakończone" : status === "cancelled" ? "Anulowane" : "W trakcie"}
                                    </Badge>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-[#c5fb37]">
                                        <Briefcase className="h-6 w-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <h1 className="max-w-4xl text-balance text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
                                            {projectTitle}
                                        </h1>
                                        <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-white/62">
                                            Panel realizacji z etapami, plikami, akceptacją i statusem rozliczenia w jednym widoku.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-[420px]">
                                <div className="rounded-2xl border border-white/10 bg-white/8 p-4 text-white">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/45">Budżet</p>
                                    <p className="mt-1 text-xl font-black">
                                        {agreedAmount != null ? `${agreedAmount} PLN` : "---"}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/8 p-4 text-white">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/45">Następna akcja</p>
                                    <p className="mt-1 line-clamp-2 text-sm font-black leading-snug text-[#c5fb37]">{nextActionLabel}</p>
                                </div>
                                {companyHref && (
                                    <Link
                                        href={companyHref}
                                        className="group flex items-center gap-2 rounded-2xl border border-white/10 bg-white/8 p-4 text-white transition-all hover:bg-white/12 sm:col-span-2"
                                    >
                                        <Building2 className="h-4 w-4 shrink-0 text-[#c5fb37]" />
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/45">Profil firmy</p>
                                            <p className="truncate text-sm font-black">{companyName ?? "Zobacz profil"}</p>
                                        </div>
                                        <ExternalLink className="ml-auto h-3.5 w-3.5 text-white/35 transition-colors group-hover:text-white" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container relative z-20 mx-auto max-w-[1280px] px-4 pb-24 pt-5 sm:px-6 lg:px-8">
                <WorkspaceTabs
                    statusProps={{
                        applicationStatus: appRow.status,
                        isStudent,
                        isCompany,
                        applicationId,
                        isServiceOrder,
                        deliverables,
                        myReview,
                        theirReview,
                        contract,
                        totalAmount: Number(agreedAmount || 0),
                        enableNegotiation: !isServiceOrder && !offer?.is_platform_service && offer?.typ !== "job_offer",
                        isPlatformService: offer?.is_platform_service ?? false,
                        studentInstructions,
                        contractDocuments,
                        resources,
                        projectTitle,
                        companyName,
                        companyHref,
                        conversationHref,
                        nextActionLabel,
                    }}
                    filesProps={{ applicationId, resources, deliverables, isCompany }}
                    secretsProps={{ applicationId, secrets, isCompany }}
                    conversationId={conversation?.id}
                />
            </div>
        </main>
    );
}
