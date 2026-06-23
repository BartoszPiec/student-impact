ALTER TABLE public.contracts
ADD CONSTRAINT fk_contracts_student_profile
FOREIGN KEY (student_id) REFERENCES public.student_profiles(user_id);

ALTER TABLE public.contracts
ADD CONSTRAINT fk_contracts_company_profile
FOREIGN KEY (company_id) REFERENCES public.company_profiles(user_id);
;
