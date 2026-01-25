"use client";

import { MoreVertical, Edit, Trash, EyeOff, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useTransition } from "react";
import { deleteServiceAction, toggleServiceStatusAction } from "../_actions";
import { useRouter } from "next/navigation";

interface ServiceActionsMenuProps {
    serviceId: string;
    currentStatus: string;
}

export default function ServiceActionsMenu({ serviceId, currentStatus }: ServiceActionsMenuProps) {
    const [pending, startTransition] = useTransition();
    const router = useRouter();

    const handleDelete = () => {
        if (confirm("Czy na pewno chcesz usunąć tę usługę?")) {
            startTransition(async () => {
                await deleteServiceAction(serviceId);
                router.refresh();
            });
        }
    };

    const handleToggleStatus = () => {
        const newStatus = currentStatus === "active" ? "inactive" : "active";
        startTransition(async () => {
            await toggleServiceStatusAction(serviceId, newStatus);
            router.refresh(); // Refresh to update UI badge
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border shadow-md">
                <DropdownMenuItem asChild>
                    <Link href={`/app/services/${serviceId}/edit`} className="flex items-center gap-2 cursor-pointer">
                        <Edit className="h-4 w-4" />
                        <span>Edytuj</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={handleToggleStatus}
                    disabled={pending}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    {currentStatus === "active" ? (
                        <>
                            <EyeOff className="h-4 w-4" />
                            <span>Ukryj usługę (Dezaktywuj)</span>
                        </>
                    ) : (
                        <>
                            <Eye className="h-4 w-4" />
                            <span>Pokaż usługę (Aktywuj)</span>
                        </>
                    )}
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={handleDelete}
                    className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                    disabled={pending}
                >
                    <Trash className="h-4 w-4" />
                    <span>{pending ? "Usuwanie..." : "Usuń"}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
