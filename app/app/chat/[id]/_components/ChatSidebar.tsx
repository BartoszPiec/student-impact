"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Briefcase, CheckCircle, ExternalLink, Package } from "lucide-react";
import { ReportProblemButton } from "./ReportProblemButton";

type ChatDetailsProps = {
    conversation: { id: string };
    application: { id: string; status: string | null; agreed_stawka?: number | null; agreed_stawka_minor?: number | null } | null;
    offer: { id: string; tytul: string | null; stawka: number | null } | null;
    packageData: { title: string | null; price: number | null; is_system: boolean | null } | null;
    serviceOrder?: { id: string; amount: number | null; entry_point: string | null; status: string | null } | null;
    isCompany: boolean;
};

function fromMinorUnits(value: number | null | undefined) {
    if (value == null || !Number.isFinite(value)) return null;
    return value / 100;
}

function ChatDetailsContent({
    conversation,
    application,
    offer,
    packageData,
    serviceOrder,
    isCompany,
}: ChatDetailsProps) {
    const isSystem = packageData?.is_system || !!serviceOrder;

    let title = "Rozmowa";
    let subtitle = "Zlecenie";
    let price: number | string | null = null;
    let statusRaw = "negotiating";
    let targetLink = "";
    let showAction = false;
    let buttonLabel = "Przejdź do szczegółów";
    let ButtonIcon = ExternalLink;

    if (isSystem) {
        title = packageData?.title || "Pakiet Systemowy";
        subtitle = serviceOrder?.entry_point === "student_private_proposal"
            ? "Prywatna propozycja"
            : "Zlecenie systemowe";
    price = serviceOrder?.amount ?? packageData?.price ?? null;
        statusRaw = serviceOrder?.status || "nowe";

        if (statusRaw === "active" || statusRaw === "accepted" || statusRaw === "in_progress") {
            targetLink = `/app/deliverables/${serviceOrder?.id || ""}`;
            showAction = true;
            buttonLabel = "Przejdź do realizacji";
            ButtonIcon = CheckCircle;
        } else if (!isCompany && serviceOrder?.id) {
            targetLink = `/app/services/dashboard/${serviceOrder.id}`;
            showAction = true;
            buttonLabel = "Szczegóły zapytania";
            ButtonIcon = ExternalLink;
        }
    } else {
        title = offer?.tytul || "Zlecenie";
        subtitle = "Zlecenie niestandardowe";
    price = application?.agreed_stawka ?? fromMinorUnits(application?.agreed_stawka_minor) ?? offer?.stawka ?? null;
        statusRaw = application?.status || "negotiating";

        if (statusRaw === "accepted" || statusRaw === "completed" || statusRaw === "in_progress") {
            if (application?.id) {
                targetLink = `/app/deliverables/${application.id}`;
                showAction = true;
                buttonLabel = "Przejdź do realizacji";
                ButtonIcon = CheckCircle;
            }
        } else if (statusRaw === "rejected" || statusRaw === "cancelled") {
            showAction = false;
        } else if (isCompany && offer?.id) {
            targetLink = `/app/company/offers/${offer.id}`;
            showAction = true;
            buttonLabel = "Przejdź do zgłoszenia";
            ButtonIcon = ExternalLink;
        } else if (!isCompany && offer?.id) {
            targetLink = `/app/jobs/${offer.id}`;
            showAction = true;
            buttonLabel = "Przejdź do zgłoszenia";
            ButtonIcon = ExternalLink;
        }
    }

    const mapStatus = (status: string) => {
        switch (status) {
            case "in_progress": return "W trakcie";
            case "accepted": return "W realizacji";
            case "completed": return "Zakończone";
            case "cancelled": return "Anulowane";
            case "active": return "Aktywne";
            case "sent": return "Nowe zgłoszenie";
            case "negotiating": return "Negocjacje";
            case "rejected": return "Odrzucone";
            default: return status;
        }
    };

    const statusLabel = mapStatus(statusRaw);

    return (
        <Card className="border-none bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium uppercase text-slate-500">Szczegóły zlecenia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                    <div className={`rounded-lg p-2 ${isSystem ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"}`}>
                        {isSystem ? <Package className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
                    </div>
                    <div>
                        <div className="line-clamp-2 text-sm font-semibold text-slate-900">{title}</div>
                        <div className="text-xs text-slate-500">{subtitle}</div>
                    </div>
                </div>

                <div className="space-y-1 pt-3">
                    <div className="text-xs text-slate-500">Koszt realizacji</div>
                    <div className="text-xl font-bold text-slate-800">
                        {price ? `${price} zł` : "—"}
                    </div>
                </div>

                <div className="space-y-1 pt-3">
                    <div className="text-xs text-slate-500">Status</div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                        {statusLabel}
                    </Badge>
                </div>

                <div className="space-y-3 pt-4">
                    {showAction && targetLink && (
                        <Button asChild variant="outline" className="w-full border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50 hover:text-slate-900">
                            <Link href={targetLink}>
                                <ButtonIcon className="mr-2 h-4 w-4" /> {buttonLabel}
                            </Link>
                        </Button>
                    )}

                    {conversation?.id && (
                        <ReportProblemButton conversationId={conversation.id} />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export function ChatDetailsSheet(props: ChatDetailsProps) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 rounded-xl border-slate-200 bg-white text-xs font-black text-slate-700 shadow-sm lg:hidden">
                    Szczegóły
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[82dvh] rounded-t-[2rem] border-none bg-slate-50 p-0">
                <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-200" />
                <div className="max-h-[calc(82dvh-1rem)] overflow-y-auto p-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
                    <SheetHeader className="mb-4 text-left">
                        <SheetTitle>Szczegóły rozmowy</SheetTitle>
                    </SheetHeader>
                    <ChatDetailsContent {...props} />
                </div>
            </SheetContent>
        </Sheet>
    );
}

export function ChatSidebar(props: ChatDetailsProps) {
    return (
        <div className="hidden w-full shrink-0 flex-col gap-6 lg:flex lg:w-64">
            <ChatDetailsContent {...props} />
        </div>
    );
}
