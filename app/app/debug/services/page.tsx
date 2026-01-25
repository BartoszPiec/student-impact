"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DebugServicesPage() {
    const supabase = createClient();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            // Fetch Applications (with nested offers)
            const { data: apps } = await supabase
                .from("applications")
                .select(`
                    id, status, agreed_stawka, proposed_stawka, counter_stawka, offer_id,
                    offers (id, tytul, stawka)
                `);

            // Fetch Service Orders
            const { data: orders } = await supabase
                .from("service_orders")
                .select(`
                     id, status, amount, package_id,
                     service_packages (title)
                `);

            // Fetch Contracts
            const { data: contracts } = await supabase
                .from("contracts")
                .select(`
                    id, application_id, service_order_id, status, terms_status, company_approved_version, student_approved_version
                `);

            // Fetch Milestones Drafts (to see agreed total)
            const { data: drafts } = await supabase
                .from("milestone_drafts")
                .select(`
                    id, contract_id, state, agreed_total_minor
                `);

            setData({ apps, orders, contracts, drafts });
            setLoading(false);
        }
        fetchData();
    }, []);

    if (loading) return <div className="p-10">Loading raw data...</div>;

    return (
        <div className="p-8 space-y-8 font-mono text-xs">
            <h1 className="text-2xl font-bold mb-4">Debug Services & Pricing</h1>

            <section>
                <h2 className="text-xl font-bold bg-indigo-100 p-2">Applications ({data?.apps?.length})</h2>
                <table className="w-full border-collapse border border-slate-300 mt-2">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="border p-2">ID (App)</th>
                            <th className="border p-2">Status</th>
                            <th className="border p-2 bg-green-50">Agreed Stawka</th>
                            <th className="border p-2">Counter Stawka</th>
                            <th className="border p-2">Proposed Stawka</th>
                            <th className="border p-2 bg-yellow-50">Offer Original Stawka</th>
                            <th className="border p-2">Offer Title</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.apps?.map((a: any) => (
                            <tr key={a.id} className="hover:bg-slate-50">
                                <td className="border p-2">{a.id}</td>
                                <td className="border p-2">{a.status}</td>
                                <td className="border p-2 font-bold text-green-700">{a.agreed_stawka ?? 'NULL'}</td>
                                <td className="border p-2">{a.counter_stawka ?? 'NULL'}</td>
                                <td className="border p-2">{a.proposed_stawka ?? 'NULL'}</td>
                                <td className="border p-2 font-bold text-yellow-700">{a.offers?.stawka ?? 'NULL'}</td>
                                <td className="border p-2">{a.offers?.tytul}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section>
                <h2 className="text-xl font-bold bg-amber-100 p-2">Service Orders ({data?.orders?.length})</h2>
                <table className="w-full border-collapse border border-slate-300 mt-2">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="border p-2">ID (Order)</th>
                            <th className="border p-2">Status</th>
                            <th className="border p-2 bg-green-50">Amount</th>
                            <th className="border p-2">Package Title</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.orders?.map((o: any) => (
                            <tr key={o.id} className="hover:bg-slate-50">
                                <td className="border p-2">{o.id}</td>
                                <td className="border p-2">{o.status}</td>
                                <td className="border p-2 font-bold text-green-700">{o.amount ?? 'NULL'}</td>
                                <td className="border p-2">{o.service_packages?.title}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section>
                <h2 className="text-xl font-bold bg-blue-100 p-2">Contracts ({data?.contracts?.length})</h2>
                <table className="w-full border-collapse border border-slate-300 mt-2">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="border p-2">ID (Contract)</th>
                            <th className="border p-2">Terms Status</th>
                            <th className="border p-2">Status</th>
                            <th className="border p-2">App ID</th>
                            <th className="border p-2">Order ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.contracts?.map((c: any) => (
                            <tr key={c.id} className="hover:bg-slate-50">
                                <td className="border p-2">{c.id}</td>
                                <td className="border p-2">{c.terms_status}</td>
                                <td className="border p-2">{c.status}</td>
                                <td className="border p-2">{c.application_id ?? '-'}</td>
                                <td className="border p-2">{c.service_order_id ?? '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section>
                <h2 className="text-xl font-bold bg-purple-100 p-2">Milestone Drafts ({data?.drafts?.length})</h2>
                <table className="w-full border-collapse border border-slate-300 mt-2">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="border p-2">ID (Draft)</th>
                            <th className="border p-2">State</th>
                            <th className="border p-2 bg-green-50">Agreed Total (grosze)</th>
                            <th className="border p-2">Contract ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.drafts?.map((d: any) => (
                            <tr key={d.id} className="hover:bg-slate-50">
                                <td className="border p-2">{d.id}</td>
                                <td className="border p-2">{d.state}</td>
                                <td className="border p-2 font-bold text-green-700">{d.agreed_total_minor ?? 'NULL'}</td>
                                <td className="border p-2">{d.contract_id}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
}
