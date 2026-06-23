"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Błąd renderowania panelu aplikacji:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-6 py-16 text-center">
      <div className="w-full rounded-[2rem] border border-red-100 bg-white p-8 shadow-xl shadow-red-500/5">
        <p className="text-xs font-black uppercase tracking-widest text-red-600">Błąd aplikacji</p>
        <h1 className="mt-3 text-2xl font-black text-slate-900">Nie udało się załadować tej strony.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Spróbuj ponownie. Jeśli problem się powtórzy, skontaktuj się z pomocą techniczną.
        </p>
        <Button type="button" onClick={reset} className="mt-6 rounded-xl">
          Spróbuj ponownie
        </Button>
      </div>
    </main>
  );
}
