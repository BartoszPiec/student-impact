
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, AlertTriangle, CheckCircle, Package, Briefcase } from "lucide-react";
import Link from "next/link";

export function ChatSidebar({
    conversation,
    application,
    offer,
    packageData,
    serviceOrder,
    isCompany
}: {
    conversation: any,
    application: any,
    offer: any,
    packageData: any,
    serviceOrder?: any,
    isCompany: boolean
}) {
    // 1. Normalize Data
    const isSystem = packageData?.is_system || !!serviceOrder;

    let title = "Rozmowa";
    let subtitle = "Zlecenie";
    let price: any = null;
    let statusRaw = "negotiating";
    let statusLabel = "Negocjacje";
    let targetLink = "";
    let showAction = false;
    let buttonLabel = "Przejdź do szczegółów";
    let ButtonIcon = ExternalLink;

    if (isSystem) {
        title = packageData?.title || "Pakiet Systemowy";
        subtitle = "Zlecenie systemowe";
        price = serviceOrder?.amount || packageData?.price;
        statusRaw = serviceOrder?.status || 'nowe';

        if (statusRaw === 'active' || statusRaw === 'accepted' || statusRaw === 'in_progress') {
            targetLink = `/app/deliverables/${serviceOrder?.id || ''}`;
            showAction = true;
            buttonLabel = "Przejdź do realizacji";
            ButtonIcon = CheckCircle;
        } else {
            // Negotiation/Inquiry Phase for System Orders
            if (!isCompany && serviceOrder?.id) {
                targetLink = `/app/services/dashboard/${serviceOrder.id}`;
                showAction = true;
                buttonLabel = "Szczegóły zapytania";
                ButtonIcon = ExternalLink;
            }
        }
    } else {
        // Standard Application / Offer
        title = offer?.tytul || "Zlecenie";
        subtitle = "Zlecenie niestandardowe";
        price = application?.agreed_stawka || offer?.stawka;
        statusRaw = application?.status || 'negotiating';

        // Logic for standard application link
        if (statusRaw === 'accepted' || statusRaw === 'completed' || statusRaw === 'in_progress') {
            // Realization Phase
            if (application?.id) {
                targetLink = `/app/deliverables/${application.id}`;
                showAction = true;
                buttonLabel = "Przejdź do realizacji";
                ButtonIcon = CheckCircle;
            }
        } else if (statusRaw === 'rejected' || statusRaw === 'cancelled') {
            // Rejected -> Hide Button
            showAction = false;
        } else {
            // Negotiation Phase -> Go to Application/Offer
            if (isCompany && offer?.id) {
                targetLink = `/app/company/applications?offerId=${offer.id}`;
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
    }

    // 2. Status Translation
    const mapStatus = (s: string) => {
        switch (s) {
            case 'in_progress': return 'W trakcie';
            case 'accepted': return 'W realizacji';
            case 'completed': return 'Zakończone';
            case 'cancelled': return 'Anulowane';
            case 'active': return 'Aktywne';
            case 'sent': return 'Nowe zgłoszenie';
            case 'negotiating': return 'Negocjacje';
            case 'rejected': return 'Odrzucone';
            default: return s;
        }
    };

    statusLabel = mapStatus(statusRaw);

    return (
        <div className="w-full lg:w-64 flex flex-col gap-6 shrink-0">
            {/* UNIFIED DETAILS CARD */}
            <Card className="border-none shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] bg-white">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-500 uppercase">Szczegóły zlecenia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isSystem ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {isSystem ? <Package className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
                        </div>
                        <div>
                            <div className="font-semibold text-slate-900 text-sm line-clamp-2">{title}</div>
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

                    {/* ACTIONS INTEGRATED HERE */}
                    <div className="pt-4 space-y-3">
                        {showAction && targetLink && (
                            <Button asChild variant="outline" className="w-full bg-white text-slate-900 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm">
                                <Link href={targetLink}>
                                    <ButtonIcon className="w-4 h-4 mr-2" /> {buttonLabel}
                                </Link>
                            </Button>
                        )}

                        <Button variant="ghost" className="w-full h-auto p-0 text-xs text-slate-400 hover:text-red-500 hover:bg-transparent justify-center">
                            <AlertTriangle className="w-3 h-3 mr-1.5" /> Zgłoś problem
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
