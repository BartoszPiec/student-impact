-- 1. Add form_schema to service_packages (stores the questions definition)
ALTER TABLE public.service_packages ADD COLUMN IF NOT EXISTS form_schema jsonb DEFAULT '[]'::jsonb;

-- 2. Add contact fields to service_orders (for the specific order context)
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS company_website text;

-- 3. Populate Form Schemas for existing System Packages
-- Logo
UPDATE public.service_packages 
SET form_schema = '[
  {
    "id": "industry",
    "label": "W jakiej branży działa firma?",
    "type": "select",
    "options": ["IT / Technologie", "Beauty / Uroda", "Gastronomia", "Finanse / Prawo", "Budownictwo / Nieruchomości", "E-commerce", "Inna"]
  },
  {
    "id": "style",
    "label": "Jaki styl logo preferujesz?",
    "type": "select",
    "options": ["Minimalistyczny (prosty)", "Nowoczesny / Tech", "Klasyczny / Elegancki", "Artystyczny / Ozdobny", "Retro / Vintage"]
  },
  {
    "id": "colors",
    "label": "Preferowana kolorystyka",
    "type": "select",
    "options": ["Niebieski (zaufanie)", "Czerwony (energia)", "Zielony (natura)", "Czarny/Biały (luksus)", "Pastelowe", "Złoty/Miedziany", "Nie mam zdania"]
  }
]'::jsonb
WHERE title = 'Przygotowanie Logo';

-- Marketing
UPDATE public.service_packages 
SET form_schema = '[
  {
    "id": "goal",
    "label": "Jaki jest główny cel kampanii?",
    "type": "select",
    "options": ["Sprzedaż produktów", "Budowanie wizerunku", "Pozyskiwanie kontaktów (Leadów)", "Promocja wydarzenia"]
  },
  {
    "id": "platform",
    "label": "Na jakiej platformie działamy?",
    "type": "select",
    "options": ["Facebook + Instagram", "LinkedIn", "TikTok", "Google Ads"]
  },
  {
    "id": "assets",
    "label": "Czy posiadasz własne zdjęcia/materiały?",
    "type": "select",
    "options": ["Tak, mam gotowe zdjęcia", "Nie, potrzebuję grafik od Was", "Częściowo"]
  }
]'::jsonb
WHERE title = 'Kampania Marketingowa';

-- Automation
UPDATE public.service_packages 
SET form_schema = '[
  {
    "id": "client",
    "label": "Z jakiej poczty korzystasz?",
    "type": "select",
    "options": ["Gmail (Google Workspace)", "Outlook (Office 365)", "Onet / WP / Interia", "Inny hosting"]
  },
  {
    "id": "volume",
    "label": "Ile maili otrzymujesz dziennie?",
    "type": "select",
    "options": ["Mniej niż 20", "20-50", "50-100", "Powyżej 100"]
  },
  {
    "id": "problem",
    "label": "Co jest największym problemem?",
    "type": "select",
    "options": ["Spam", "Bałagan w folderach", "Powtarzalne pytania od klientów", "Zapominanie o odpisaniu"]
  }
]'::jsonb
WHERE title = 'Automatyzacja Skrzynki Pocztowej';
