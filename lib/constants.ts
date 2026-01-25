
export const SERVICE_CATEGORIES = [
    "Serwisy internetowe",
    "Multimedia",
    "Programowanie i IT",
    "Marketing",
    "Design",
    "Tłumaczenia",
    "Prace biurowe",
    "Copywriting",
    "Usprawnienia AI",
    "Prawo",
    "Analiza danych",
    "Inne prace"
] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number];
