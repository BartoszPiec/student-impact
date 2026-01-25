"use client";

import ServiceForm from "../_components/service-form";

export default function NewServicePage() {
    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Nowy Pakiet Usług</h1>
            <ServiceForm />
        </div>
    );
}
