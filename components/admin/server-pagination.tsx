import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ADMIN_PAGE_SIZE = 50;

export function getPageNumber(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return Math.max(1, Number.parseInt(raw ?? "1", 10) || 1);
}

function pageHref(pathname: string, page: number) {
  return page <= 1 ? pathname : `${pathname}?page=${page}`;
}

export function ServerPagination({
  pathname,
  currentPage,
  hasNextPage,
}: {
  pathname: string;
  currentPage: number;
  hasNextPage: boolean;
}) {
  if (currentPage === 1 && !hasNextPage) return null;

  return (
    <nav aria-label="Paginacja" className="mt-6 flex items-center justify-between gap-4">
      {currentPage > 1 ? (
        <Button asChild variant="outline" className="rounded-xl">
          <Link href={pageHref(pathname, currentPage - 1)}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Poprzednia
          </Link>
        </Button>
      ) : (
        <Button type="button" variant="outline" disabled className="rounded-xl">
          <ChevronLeft className="mr-2 h-4 w-4" /> Poprzednia
        </Button>
      )}
      <span className="text-sm font-bold text-slate-500">Strona {currentPage}</span>
      {hasNextPage ? (
        <Button asChild variant="outline" className="rounded-xl">
          <Link href={pageHref(pathname, currentPage + 1)}>
            Następna <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button type="button" variant="outline" disabled className="rounded-xl">
          Następna <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </nav>
  );
}
