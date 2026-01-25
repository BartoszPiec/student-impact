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
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  amount: number;
  requirements: string | null;
  created_at: string;
  updated_at: string;
};
