export const LOGO_PACKAGE_ID = "5de0e9f6-3768-4732-987b-5c0073591646";

const ACTIVE_ORDER_STATUSES = ["active", "in_progress", "pending_student_confirmation", "pending_confirmation"] as const;

type PortfolioItem = {
  category?: string | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
  url?: string | null;
  file_url?: string | null;
};

export type LogoStudentCandidate = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  portfolioItems: PortfolioItem[];
  portfolioPreview: string[];
  activeOrders: number;
  createdAt: string | null;
};

type SupabaseLike = {
  from: (table: string) => unknown;
};

type FilterableQuery = PromiseLike<{ data: unknown[] | null }> & {
  in: (column: string, values: readonly string[]) => FilterableQuery;
};

type TableQuery = {
  select: (columns: string) => FilterableQuery;
};

type StudentProfileSelectionRow = {
  user_id?: unknown;
  public_name?: unknown;
  bio?: unknown;
  linki?: unknown;
  portfolio_url?: unknown;
  kompetencje?: unknown;
  updated_at?: unknown;
};

type ServiceOrderStatusRow = {
  student_id?: unknown;
};

function table(client: SupabaseLike, name: string) {
  return client.from(name) as TableQuery;
}

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toPortfolioItems(raw: unknown): PortfolioItem[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
      .map((item) => ({
        category: toText(item.category),
        image_url: toText(item.image_url),
        thumbnail_url: toText(item.thumbnail_url),
        url: toText(item.url),
        file_url: toText(item.file_url),
      }));
  }

  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return toPortfolioItems(parsed);
    } catch {
      return [];
    }
  }

  return [];
}

function portfolioFromProfile(row: Record<string, unknown>) {
  const linkItems = toPortfolioItems(row.linki);
  const directUrl = toText(row.portfolio_url);

  if (directUrl) {
    linkItems.push({
      category: "portfolio",
      url: directUrl,
      image_url: directUrl,
      thumbnail_url: directUrl,
    });
  }

  return linkItems;
}

function hasDesignCategory(items: PortfolioItem[], skills: unknown) {
  const fromPortfolio = items.some((item) => {
    const category = (item.category || "").toLowerCase();
    return category.includes("design") || category.includes("graf");
  });

  if (fromPortfolio) return true;

  if (Array.isArray(skills)) {
    return skills.some((skill) => {
      const normalized = String(skill || "").toLowerCase();
      return normalized.includes("design") || normalized.includes("graf");
    });
  }

  return false;
}

function getPortfolioPreview(items: PortfolioItem[]) {
  return items
    .map((item) => item.thumbnail_url || item.image_url || item.url || item.file_url || "")
    .filter((url) => url.length > 0)
    .slice(0, 3);
}

export async function fetchAvailableLogoStudents(
  supabase: SupabaseLike,
  options?: { maxActiveOrders?: number },
): Promise<LogoStudentCandidate[]> {
  const maxActiveOrders = options?.maxActiveOrders ?? 1;

  const { data: studentRows } = await table(supabase, "student_profiles")
    .select("user_id, public_name, bio, linki, portfolio_url, kompetencje, updated_at");

  if (!Array.isArray(studentRows) || studentRows.length === 0) {
    return [];
  }

  const normalized = (studentRows as StudentProfileSelectionRow[])
    .map((row: StudentProfileSelectionRow) => {
      const portfolioItems = portfolioFromProfile(row ?? {});
      return {
        userId: toText(row?.user_id),
        displayName: toText(row?.public_name) || "Student",
        bio: toText(row?.bio) || null,
        createdAt: toText(row?.updated_at) || null,
        portfolioItems,
        skills: row?.kompetencje,
      };
    })
    .filter((row) => row.userId.length > 0)
    .filter((row) => row.portfolioItems.length >= 3)
    .filter((row) => hasDesignCategory(row.portfolioItems, row.skills));

  if (normalized.length === 0) {
    return [];
  }

  const studentIds = normalized.map((row) => row.userId);

  const [ordersRes] = await Promise.all([
    table(supabase, "service_orders")
      .select("student_id, status")
      .in("student_id", studentIds)
      .in("status", [...ACTIVE_ORDER_STATUSES]),
  ]);

  const activeCountMap = new Map<string, number>();
  for (const row of (ordersRes.data || []) as ServiceOrderStatusRow[]) {
    const userId = toText(row.student_id);
    if (!userId) continue;
    activeCountMap.set(userId, (activeCountMap.get(userId) || 0) + 1);
  }

  return normalized
    .map((row) => {
      const activeOrders = activeCountMap.get(row.userId) || 0;

      return {
        userId: row.userId,
        displayName: row.displayName,
        avatarUrl: null,
        bio: row.bio,
        portfolioItems: row.portfolioItems,
        portfolioPreview: getPortfolioPreview(row.portfolioItems),
        activeOrders,
        createdAt: row.createdAt,
      } satisfies LogoStudentCandidate;
    })
    .filter((candidate) => candidate.activeOrders <= maxActiveOrders)
    .sort((a, b) => {
      if (a.activeOrders !== b.activeOrders) {
        return a.activeOrders - b.activeOrders;
      }

      const aTime = a.createdAt ? Date.parse(a.createdAt) : Number.MAX_SAFE_INTEGER;
      const bTime = b.createdAt ? Date.parse(b.createdAt) : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
}
