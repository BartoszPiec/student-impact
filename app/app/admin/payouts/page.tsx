"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Clock,
  CheckCircle2,
  Loader2,
  ArrowRight,
  DollarSign,
  Filter,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getPayouts, markPayoutProcessing, markPayoutPaid } from "./_actions";

type PayoutRow = {
  id: string;
  milestone_id: string;
  contract_id: string;
  amount_gross: number;
  platform_fee: number;
  amount_net: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  studentName: string;
  offerTitle: string;
  milestoneTitle: string;
  milestoneIdx: number;
};

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);

  const loadPayouts = async (statusFilter?: string) => {
    setLoading(true);
    try {
      const data = await getPayouts(statusFilter || filter);
      setPayouts(data as any);
    } catch (err: any) {
      toast.error(err.message || "Błąd ładowania wypłat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts();
  }, [filter]);

  const handleMarkProcessing = (payoutId: string) => {
    setActionId(payoutId);
    startTransition(async () => {
      try {
        await markPayoutProcessing(payoutId);
        toast.success("Oznaczono jako przetwarzane");
        await loadPayouts();
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setActionId(null);
      }
    });
  };

  const handleMarkPaid = (payoutId: string) => {
    if (!confirm("Potwierdzasz, że środki zostały przelane do studenta?")) return;
    setActionId(payoutId);
    startTransition(async () => {
      try {
        await markPayoutPaid(payoutId);
        toast.success("Oznaczono jako wypłacone!");
        await loadPayouts();
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setActionId(null);
      }
    });
  };

  // Summary stats
  const pendingCount = payouts.filter((p) => p.status === "pending").length;
  const pendingTotal = payouts
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + Number(p.amount_net), 0);
  const processingCount = payouts.filter((p) => p.status === "processing").length;
  const paidTotal = payouts
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount_net), 0);
  const feeTotal = payouts.reduce((sum, p) => sum + Number(p.platform_fee), 0);

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
            <Clock className="w-3 h-3 mr-1" /> Oczekuje
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Przetwarzane
          </Badge>
        );
      case "paid":
        return (
          <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Wypłacone
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Wallet className="w-8 h-8 text-indigo-600" />
            Panel Wypłat
          </h1>
          <p className="text-slate-500 mt-1">Zarządzaj wypłatami dla studentów</p>
        </div>
        <Button
          variant="outline"
          onClick={() => loadPayouts()}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Odśwież
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Oczekujące</p>
                <p className="text-2xl font-black text-amber-800">{pendingCount}</p>
              </div>
              <div className="text-xs text-amber-600 font-bold">{pendingTotal.toFixed(2)} PLN</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Przetwarzane</p>
                <p className="text-2xl font-black text-blue-800">{processingCount}</p>
              </div>
              <Loader2 className="w-5 h-5 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Wypłacone</p>
                <p className="text-2xl font-black text-emerald-800">{paidTotal.toFixed(2)} PLN</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Prowizje</p>
                <p className="text-2xl font-black text-indigo-800">{feeTotal.toFixed(2)} PLN</p>
              </div>
              <DollarSign className="w-5 h-5 text-indigo-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-500 font-medium">Filtr:</span>
        {["all", "pending", "processing", "paid"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f ? "bg-indigo-600 hover:bg-indigo-700" : ""}
          >
            {f === "all" && "Wszystkie"}
            {f === "pending" && "Oczekujące"}
            {f === "processing" && "Przetwarzane"}
            {f === "paid" && "Wypłacone"}
          </Button>
        ))}
      </div>

      {/* Payouts Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-20">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Brak wypłat do wyświetlenia</p>
              <p className="text-slate-400 text-sm">Wypłaty pojawią się po akceptacji etapów przez firmy.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Zlecenie / Etap</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Brutto</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Prowizja (5%)</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Netto</th>
                    <th className="text-center p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                    <th className="text-center p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <tr key={payout.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{payout.studentName}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-slate-700">{payout.offerTitle}</div>
                        <div className="text-xs text-slate-400">
                          Etap {payout.milestoneIdx}: {payout.milestoneTitle}
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono text-sm">{Number(payout.amount_gross).toFixed(2)}</td>
                      <td className="p-4 text-right font-mono text-sm text-red-600">
                        -{Number(payout.platform_fee).toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-mono text-sm font-bold text-emerald-700">
                        {Number(payout.amount_net).toFixed(2)} PLN
                      </td>
                      <td className="p-4 text-center">{statusBadge(payout.status)}</td>
                      <td className="p-4 text-sm text-slate-500">
                        {new Date(payout.created_at).toLocaleDateString("pl-PL", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {payout.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkProcessing(payout.id)}
                              disabled={isPending && actionId === payout.id}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              {isPending && actionId === payout.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <ArrowRight className="w-3 h-3 mr-1" />
                                  Przetwarzaj
                                </>
                              )}
                            </Button>
                          )}
                          {(payout.status === "pending" || payout.status === "processing") && (
                            <Button
                              size="sm"
                              onClick={() => handleMarkPaid(payout.id)}
                              disabled={isPending && actionId === payout.id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              {isPending && actionId === payout.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Wypłacone
                                </>
                              )}
                            </Button>
                          )}
                          {payout.status === "paid" && (
                            <span className="text-xs text-slate-400">
                              {payout.paid_at
                                ? new Date(payout.paid_at).toLocaleDateString("pl-PL")
                                : "—"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
