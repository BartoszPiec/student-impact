update public.service_packages
set category = case
  when lower(coalesce(category, '')) in ('marketing', 'marketing & social', 'content i social media')
    or coalesce(title, '') ilike '%social%'
    or coalesce(title, '') ilike '%kampania marketing%'
    or coalesce(description, '') ilike '%social media%'
    then 'Marketing i social media'
  when lower(coalesce(category, '')) in ('design', 'grafika & design', 'grafika / branding')
    or coalesce(title, '') ilike '%logo%'
    or coalesce(title, '') ilike '%grafik%'
    or coalesce(description, '') ilike '%branding%'
    then 'Grafika i materiały sprzedażowe'
  when lower(coalesce(category, '')) in ('multimedia', 'video & multimedia', 'wideo & animacja')
    or coalesce(title, '') ilike '%wideo%'
    or coalesce(title, '') ilike '%video%'
    or coalesce(title, '') ilike '%reels%'
    or coalesce(title, '') ilike '%shorts%'
    or coalesce(title, '') ilike '%tiktok%'
    or coalesce(description, '') ilike '%youtube%'
    then 'Wideo i UGC'
  when lower(coalesce(category, '')) in ('copywriting', 'content & copywriting')
    or coalesce(title, '') ilike '%copywriting%'
    or coalesce(title, '') ilike '%tekst%'
    or coalesce(description, '') ilike '%seo%'
    then 'SEO i treści'
  when lower(coalesce(category, '')) in ('analiza danych')
    or coalesce(title, '') ilike '%research%'
    or coalesce(title, '') ilike '%analiz%'
    or coalesce(title, '') ilike '%lead%'
    then 'Dane, research i analizy'
  when lower(coalesce(category, '')) in ('usprawnienia ai', 'programowanie i it')
    or coalesce(title, '') ilike '%automatyzac%'
    or coalesce(title, '') ilike '%skrzynk%'
    or coalesce(title, '') ilike '%crm%'
    or coalesce(description, '') ilike '%zapier%'
    or coalesce(description, '') ilike '%gmail%'
    or coalesce(description, '') ilike '%outlook%'
    then 'Automatyzacje, AI i narzędzia'
  when lower(coalesce(category, '')) in ('serwisy internetowe')
    or coalesce(title, '') ilike '%wordpress%'
    or coalesce(title, '') ilike '%landing%'
    or coalesce(title, '') ilike '%strona%'
    then 'Strony internetowe i CMS'
  when lower(coalesce(category, '')) in ('prace biurowe')
    then 'Administracja i operacje'
  else coalesce(nullif(category, ''), 'Inne')
end
where
  coalesce(type, '') = 'platform_service'
  or coalesce(is_system, false) = true;
