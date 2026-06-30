
ALTER TABLE service_orders
ADD COLUMN IF NOT EXISTS student_selection_mode text DEFAULT 'first_come'
  CHECK (student_selection_mode IN ('first_come', 'company_choice', 'auto_assign')),
ADD COLUMN IF NOT EXISTS student_selected_at timestamptz,
ADD COLUMN IF NOT EXISTS student_selection_expires_at timestamptz,
ADD COLUMN IF NOT EXISTS student_pool_snapshot jsonb;

COMMENT ON COLUMN service_orders.student_selection_mode IS 'first_come | company_choice | auto_assign — wybrany przez firmę przy zamówieniu';
COMMENT ON COLUMN service_orders.student_selected_at IS 'Kiedy firma wybrała studenta (company_choice)';
COMMENT ON COLUMN service_orders.student_selection_expires_at IS 'Deadline na wybór studenta — po tym fallback do first_come';
COMMENT ON COLUMN service_orders.student_pool_snapshot IS 'Snapshot listy studentów dostępnych w momencie zamówienia (dla company_choice)';
;
