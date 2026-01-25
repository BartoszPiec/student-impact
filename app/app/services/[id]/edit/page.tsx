import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import ServiceForm from "../../_components/service-form";

interface EditServicePageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function EditServicePage({ params }: EditServicePageProps) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth");
    }

    const { data: service, error } = await supabase
        .from("service_packages")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !service) {
        notFound();
    }

    if (service.student_id !== user.id) {
        return <div>Nie masz uprawnień do edycji tej usługi.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Edytuj Usługę</h1>
            <ServiceForm initialData={service} isEditing />
        </div>
    );
}
