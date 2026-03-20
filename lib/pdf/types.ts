export interface ContractData {
  contractId: string;
  createdAt: string; // DD.MM.YYYY
  // Company
  companyName: string;
  companyNip: string;
  companyAddress: string;
  companyCity: string;
  companyContactPerson: string;
  // Student
  studentName: string;
  studentEmail: string;
  // Offer
  offerTitle: string;
  offerDescription: string;
  // Milestones
  milestones: MilestoneData[];
  // Financial
  totalAmount: number;
  platformFeePercent: number;
  platformFee: number;
  netAmount: number; // total minus platform fee
  currency: string;
  reviewWindowDays: number;
}

export interface MilestoneData {
  idx: number;
  title: string;
  criteria: string;
  amount: number;
  dueAt: string | null;
}

export interface InvoiceData {
  invoiceNumber: string;
  issuedAt: string; // DD.MM.YYYY
  // Issuer (always platform)
  issuerName: string;
  issuerNip: string;
  issuerAddress: string;
  // Recipient
  recipientName: string;
  recipientNip: string | null;
  recipientAddress: string;
  // Items
  items: InvoiceItem[];
  // Totals
  totalNet: number;
  totalGross: number;
  platformFee: number;
  currency: string;
  // Payment reference
  contractId: string;
  paymentMethod: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}
