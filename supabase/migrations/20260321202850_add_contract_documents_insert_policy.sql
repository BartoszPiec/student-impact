-- Pozwolenie uczestnikom kontraktu (firma/student) na wgrywanie dokumentów do tego kontraktu
CREATE POLICY contract_documents_insert_participants ON contract_documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM contracts c
    WHERE c.id = contract_id
    AND (auth.uid() = c.company_id OR auth.uid() = c.student_id)
  )
);
;
