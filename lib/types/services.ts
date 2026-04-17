import type { ServiceOrderQuoteSnapshot, ServiceOrderRequestSnapshot } from "@/lib/services/service-order-snapshots";

export type ServicePackage = {
  id: string;
  student_id: string;
  title: string;
  description: string | null;
  price: number;
  delivery_time_days: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
};

export type ServiceOrder = {
  id: string;
  package_id: string;
  company_id: string;
  student_id: string;
  entry_point?: "company_request" | "student_private_proposal";
  initiated_by?: "company" | "student";
  status:
    | "inquiry"
    | "pending"
    | "pending_selection"
    | "pending_student_confirmation"
    | "pending_confirmation"
    | "proposal_sent"
    | "countered"
    | "accepted"
    | "active"
    | "in_progress"
    | "revision"
    | "delivered"
    | "completed"
    | "rejected"
    | "cancelled"
    | "disputed";
  amount: number;
  counter_amount?: number | null;
  requirements: string | null;
  request_snapshot?: ServiceOrderRequestSnapshot | null;
  quote_snapshot?: ServiceOrderQuoteSnapshot | null;
  created_at: string;
  updated_at: string;
};
