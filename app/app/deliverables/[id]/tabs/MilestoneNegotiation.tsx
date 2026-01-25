"use client";

import { MilestoneNegotiationOrchestrator } from "./negotiation/MilestoneNegotiationOrchestrator";

interface Props {
    contract: any;
    milestones: any[];
    isCompany: boolean;
    isStudent: boolean;
    totalAmount: number;
    applicationId: string;
}

export function MilestoneNegotiation({ contract, isCompany, isStudent, totalAmount, applicationId }: Props) {
    if (!contract) return <div>Brak kontraktu</div>;

    return (
        <div className="w-full">
            <MilestoneNegotiationOrchestrator
                applicationId={applicationId}
                contractId={contract.id}
                totalAmount={totalAmount}
                isStudent={isStudent}
                isCompany={isCompany}
            />
        </div>
    );
}
