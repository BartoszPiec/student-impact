import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { Clock, Banknote, ArrowRight } from "lucide-react";
import { acceptOrder } from "./_actions";

export const dynamic = "force-dynamic";

export default async function OrdersMarketPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth");

    // Tylko studenci mogą widzieć giełdę
    const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
    if (profile?.role !== "student") redirect("/app");

    // Pobierz dostępne zlecenia (status=pending, student_id=NULL)
    const { data: orders } = await supabase
        .from("service_orders")
        .select(`
            id, 
            amount, 
            status, 
            created_at, 
            requirements,
            title,
            company:company_profiles(nazwa)
        `)
        .eq("status", "pending")
        .is("student_id", null)
        .order("created_at", { ascending: false });

    return (
        <main className="space-y-8 pb-20">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold">Giełda Zleceń</h1>
                <p className="text-muted-foreground">Przeglądaj dostępne zlecenia i zacznij zarabiać od zaraz.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {orders?.map((order: any) => (
                    <Card key={order.id} className="flex flex-col border-slate-200 hover:border-indigo-300 transition-all hover:shadow-md group">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Dostępne
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(order.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <CardTitle className="text-lg line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                {order.title || "Zlecenie bez tytułu"}
                            </CardTitle>
                            <div className="text-sm font-medium text-slate-600 flex items-center gap-1">
                                {order.company?.nazwa || "Klient anonimowy"}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 text-sm text-slate-600 line-clamp-3">
                            {order.requirements}
                        </CardContent>
                        <CardFooter className="bg-slate-50 border-t border-slate-100 p-4 pt-4 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground uppercase font-bold">Stawka</span>
                                <div className="flex items-center gap-1 text-xl font-bold text-slate-900">
                                    {order.amount} <span className="text-sm font-medium text-slate-500">PLN</span>
                                </div>
                            </div>

                            <form action={acceptOrder.bind(null, order.id)}>
                                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                                    Biorę to <ArrowRight className="ml-1 h-4 w-4" />
                                </Button>
                            </form>
                        </CardFooter>
                    </Card>
                ))}

                {(!orders || orders.length === 0) && (
                    <div className="col-span-full py-16 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <h3 className="text-lg font-medium text-slate-900">Brak dostępnych zleceń</h3>
                        <p className="text-slate-500 mt-1">Sprawdź ponownie później, firmy dodają nowe zlecenia na bieżąco.</p>
                    </div>
                )}
            </div>
        </main>
    );
}
