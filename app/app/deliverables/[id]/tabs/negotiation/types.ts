export type DraftState =
    | 'STUDENT_EDITING'           // S0
    | 'WAITING_COMPANY_REVIEW'    // S1
    | 'COMPANY_EDITING'           // S2
    | 'WAITING_STUDENT_REVIEW'    // S3
    | 'APPROVED';                 // S4

export type DraftRole = 'STUDENT' | 'COMPANY';

export interface MilestoneItem {
    client_id: string;      // Stable ID for UI diffing (UUID generated on frontend or preserved)
    title: string;
    amount: number;         // Main currency unit (PLN)
    criteria: string;       // Text or JSON string
    position: number;
}

export interface DraftHeader {
    id: string; // draft_id
    contract_id: string;
    state: DraftState;
    agreed_total_minor: number;
    current_version_id: string | null;
    review_version_id: string | null;
    company_changes_version_id: string | null;
}

export interface Props {
    applicationId: string;
    contractId: string;
    totalAmount: number; // Budget limit
    isStudent: boolean;
    isCompany: boolean;
}

export interface DiffItem {
    client_id: string;
    status: 'UNCHANGED' | 'MODIFIED' | 'ADDED' | 'DELETED';
    student?: MilestoneItem;
    company?: MilestoneItem;
}
