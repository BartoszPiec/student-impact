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

function hasDesignCategory(items: PortfolioItem[]) {
  return items.some((item) => {
    const category = (item.category || "").toLowerCase();
    return category.includes("design") || category.includes("graf");
  });
}

function getPortfolioPreview(items: PortfolioItem[]) {
  return items
    .map((item) => item.thumbnail_url || item.image_url || item.url || item.file_url || "")
    .filter((url) => url.length > 0)
    .slice(0, 3);
}

function normalizeName(profile: Record<string, unknown> | undefined) {
  if (!profile) return "Student";

  const fullName = toText(profile.full_name);
  if (fullName) return fullName;

  const publicName = toText(profile.public_name);
  if (publicName) return publicName;

  const first = toText(profile.imie);
  const last = toText(profile.nazwisko);
  const merged = `${first} ${last}`.trim();
  return merged || "Student";
}

export async function fetchAvailableLogoStudents(
  supabase: any,
  options?: { maxActiveOrders?: number },
): Promise<LogoStudentCandidate[]> {
  const maxActiveOrders = options?.maxActiveOrders ?? 1;

  const { data: studentRows } = await supabase
    .from("student_profiles")
    .select("user_id, bio, portfolio_items, created_at");

  if (!Array.isArray(studentRows) || studentRows.length === 0) {
    return [];
  }

  const normalized = studentRows
    .map((row: any) => {
      const portfolioItems = toPortfolioItems(row?.portfolio_items);
      return {
        userId: toText(row?.user_id),
        bio: toText(row?.bio) || null,
        createdAt: toText(row?.created_at) || null,
        portfolioItems,
      };
    })
    .filter((row) => row.userId.length > 0)
    .filter((row) => row.portfolioItems.length >= 3)
    .filter((row) => hasDesignCategory(row.portfolioItems));

  if (normalized.length === 0) {
    return [];
  }

  const studentIds = normalized.map((row) => row.userId);

  const [profilesByUserIdRes, profilesByIdRes, ordersRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, full_name, public_name, imie, nazwisko, avatar_url")
      .in("user_id", studentIds),
    supabase
      .from("profiles")
      .select("id, full_name, public_name, imie, nazwisko, avatar_url")
      .in("id", studentIds),
    supabase
      .from("service_orders")
      .select("student_id, status")
      .in("student_id", studentIds)
      .in("status", [...ACTIVE_ORDER_STATUSES]),
  ]);

  const profileMap = new Map<string, Record<string, unknown>>();

  for (const profile of profilesByUserIdRes.data || []) {
    const userId = toText((profile as any).user_id);
    if (userId) {
      profileMap.set(userId, profile as Record<string, unknown>);
    }
  }

  for (const profile of profilesByIdRes.data || []) {
    const userId = toText((profile as any).id);
    if (userId && !profileMap.has(userId)) {
      profileMap.set(userId, profile as Record<string, unknown>);
    }
  }

  const activeCountMap = new Map<string, number>();
  for (const row of ordersRes.data || []) {
    const userId = toText((row as any).student_id);
    if (!userId) continue;
    activeCountMap.set(userId, (activeCountMap.get(userId) || 0) + 1);
  }

  return normalized
    .map((row) => {
      const profile = profileMap.get(row.userId);
      const activeOrders = activeCountMap.get(row.userId) || 0;

      return {
        userId: row.userId,
        displayName: normalizeName(profile),
        avatarUrl: profile ? toText(profile.avatar_url) || null : null,
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
