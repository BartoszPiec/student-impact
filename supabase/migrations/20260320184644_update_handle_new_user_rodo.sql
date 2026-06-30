CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, accepted_terms_at, accepted_privacy_at, accepted_marketing)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    CASE WHEN (new.raw_user_meta_data->>'accepted_terms')::boolean = true
         THEN now() ELSE NULL END,
    CASE WHEN (new.raw_user_meta_data->>'accepted_privacy')::boolean = true
         THEN now() ELSE NULL END,
    COALESCE((new.raw_user_meta_data->>'accepted_marketing')::boolean, false)
  );

  IF (new.raw_user_meta_data->>'role' = 'company') THEN
      INSERT INTO public.company_profiles (user_id, nazwa, osoba_kontaktowa)
      VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'company_name', 'Firma Bez Nazwy'),
        COALESCE(new.raw_user_meta_data->>'full_name', '')
      );
  ELSE
      INSERT INTO public.student_profiles (user_id, public_name)
      VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Student')
      );
  END IF;

  RETURN new;
END;
$$;;
