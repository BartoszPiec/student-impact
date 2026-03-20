"use client";

import { useState, useTransition, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Receipt,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  Calendar,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { markPitPaid, markPitBatchPaid } from "../_actions";
import { toast } from "sonner";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";
import { PageContainer } from "@/components/ui/page-container";

interface PitWithholding {
  id: string;
  contract_id: string;
  milestone_id: string;
  student_id: string;
  student_name: string;
  amount_gross: number;
  kup_rate: number;
  taxable_base: number;
  pit_rate: number;
  pit_amount: number;
  amount_net: number;
  status: string;
  paid_to_us_at: string | null;
  tax_period: string | null;
  created_at: string;
}

interface Props {
  withholdings: PitWithholding[];
}

export default function PitDashboard({ withholdings }: Props) {
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // Group by tax_period (YYYY-MM)
  const grouped = useMemo(() => {
    const filtered = withholdings.filter((w) => {
      if (filter === "pending") return w.status === "pending";
      if (filter === "paid") return w.status === "paid";
      return true;
    });

    const groups: Record<string, PitWithholding[]> = {};
    filtered.forEach((w) => {
      const period = w.tax_period || "Brak okresu";
      if (!groups[period]) groups[period] = [];
      groups[period].push(w);
    });

    // Sort periods descending
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [withholdings, filter]);

  // Stats
  const totalPending = withholdings
    .filter((w) => w.status === "pending")
    .reduce((sum, w) => sum + Number(w.pit_amount), 0);
  const totalPaid = withholdings
    .filter((w) => w.status === "paid")
    .reduce((sum, w) => sum + Number(w.pit_amount), 0);
  const pendingCount = withholdings.filter((w) => w.status === "pending").length;
  const uniqueStudents = new Set(withholdings.map((w) => w.student_id)).size;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllPending = () => {
    const pendingIds = withholdings
      .filter((w) => w.status === "pending")
      .map((w) => w.id);
    if (selectedIds.size === pendingIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingIds));
    }
  };

  const handleMarkPaid = (id: string) => {
    startTransition(async () => {
      try {
        await markPitPaid(id);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        toast.success("Oznaczono jako opłacone!");
      } catch (err: any) {
        toast.error("Błąd: " + (err?.message || "Nieznany błąd"));
      }
    });
  };

  const handleBatchPaid = () => {
    if (selectedIds.size === 0) return;
    startTransition(async () => {
      try {
        await markPitBatchPaid(Array.from(selectedIds));
        setSelectedIds(new Set());
        toast.success(`Oznaczono ${selectedIds.size} pozycji jako opłacone!`);
      } catch (err: any) {
        toast.error("Błąd: " + (err?.message || "Nieznany błąd"));
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <PremiumPageHeader
        icon={<Receipt className="w-6 h-6" />}
        title="Zaliczki PIT"
        description="Panel administracyjny zarządzania zaliczkami na podatek dochodowy"
      />

      <PageContainer>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 -mt-8 relative z-10 mb-8">
          <Card className="bg-white border-none shadow-xl shadow-slate-200/40 rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Do zapłaty</div>
                  <div className="text-xl font-black text-slate-800">{totalPending.toFixed(2)} zł</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-none shadow-xl shadow-slate-200/40 rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Opłacone</div>
                  <div className="text-xl font-black text-slate-800">{totalPaid.toFixed(2)} zł</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-none shadow-xl shadow-slate-200/40 rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Oczekujące</div>
                  <div className="text-xl font-black text-slate-800">{pendingCount}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-none shadow-xl shadow-slate-200/40 rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Studentów</div>
                  <div className="text-xl font-black text-slate-800">{uniqueStudents}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            {(["all", "pending", "paid"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  filter === f
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f === "all" ? "Wszystkie" : f === "pending" ? "Oczekujące" : "Opłacone"}
              </button>
            ))}
          </div>

          {selectedIds.size > 0 && (
            <Button
              onClick={handleBatchPaid}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-200 ml-auto"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Oznacz {selectedIds.size} jako opłacone
            </Button>
          )}

          {pendingCount > 0 && (
            <Button
              variant="outline"
              onClick={selectAllPending}
              className="rounded-xl border-slate-200 text-slate-600"
            >
              {selectedIds.size === pendingCount ? "Odznacz wszystkie" : "Zaznacz wszystkie oczekujące"}
            </Button>
          )}
        </div>

        {/* Grouped Table */}
        {grouped.length === 0 ? (
          <Card className="bg-white border-none shadow-lg rounded-2xl">
            <CardContent className="p-12 text-center">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <div className="text-lg font-bold text-slate-400">Brak zaliczek PIT</div>
              <div className="text-sm text-slate-400 mt-1">
                Zaliczki pojawią się automatycznie po zatwierdzeniu kamieni milowych.
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {grouped.map(([period, items]) => {
              const periodTotal = items.reduce((s, w) => s + Number(w.pit_amount), 0);
              const pendingInPeriod = items.filter((w) => w.status === "pending").length;

              return (
                <Card key={period} className="bg-white border-none shadow-xl shadow-slate-200/40 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-6">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3 text-sm font-black text-slate-700">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        Okres: {period}
                      </CardTitle>
                      <div className="flex items-center gap-3">
                        {pendingInPeriod > 0 && (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">
                            {pendingInPeriod} oczekujące
                          </Badge>
                        )}
                        <Badge variant="outline" className="font-mono text-slate-600">
                          Suma PIT: {periodTotal.toFixed(2)} zł
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="p-3 text-left w-10"></th>
                            <th className="p-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student</th>
                            <th className="p-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Brutto</th>
                            <th className="p-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">KUP</th>
                            <th className="p-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Podstawa</th>
                            <th className="p-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stawka</th>
                            <th className="p-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">PIT</th>
                            <th className="p-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Netto</th>
                            <th className="p-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="p-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Akcja</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((w) => (
                            <tr
                              key={w.id}
                              className={`border-b border-slate-50 transition-colors ${
                                selectedIds.has(w.id) ? "bg-emerald-50/50" : "hover:bg-slate-50/50"
                              }`}
                            >
                              <td className="p-3 text-center">
                                {w.status === "pending" && (
                                  <Checkbox
                                    checked={selectedIds.has(w.id)}
                                    onCheckedChange={() => toggleSelect(w.id)}
                                    className="border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                  />
                                )}
                              </td>
                              <td className="p-3">
                                <div className="font-semibold text-sm text-slate-700">{w.student_name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{w.contract_id.slice(0, 8)}…</div>
                              </td>
                              <td className="p-3 text-right font-mono text-sm text-slate-600">{Number(w.amount_gross).toFixed(2)}</td>
                              <td className="p-3 text-right font-mono text-sm text-slate-500">{(Number(w.kup_rate) * 100).toFixed(0)}%</td>
                              <td className="p-3 text-right font-mono text-sm text-slate-600">{Number(w.taxable_base).toFixed(2)}</td>
                              <td className="p-3 text-right font-mono text-sm text-slate-500">{(Number(w.pit_rate) * 100).toFixed(0)}%</td>
                              <td className="p-3 text-right font-mono text-sm font-bold text-slate-800">{Number(w.pit_amount).toFixed(2)}</td>
                              <td className="p-3 text-right font-mono text-sm text-slate-600">{Number(w.amount_net).toFixed(2)}</td>
                              <td className="p-3 text-center">
                                {w.status === "paid" ? (
                                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Opłacone
                                  </Badge>
                                ) : (
                                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">
                                    <Clock className="w-3 h-3 mr-1" /> Oczekujące
                                  </Badge>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                {w.status === "pending" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-lg border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-xs"
                                    onClick={() => handleMarkPaid(w.id)}
                                    disabled={isPending}
                                  >
                                    Opłać
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
