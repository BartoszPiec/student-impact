"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteSystemService } from "./_actions";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeleteServiceButton({ serviceId, serviceTitle }: { serviceId: string, serviceTitle: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        startTransition(async () => {
            try {
                await deleteSystemService(serviceId);
                toast.success("Usługa została usunięta");
            } catch (error) {
                toast.error("Wystąpił błąd podczas usuwania usługi");
            }
        });
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                    disabled={isPending}
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Usuń
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>Czy na pewno chcesz usunąć tę usługę?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tej operacji nie można cofnąć. Usługa "{serviceTitle}" zostanie trwale usunięta z systemu.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Anuluj</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700 rounded-xl"
                    >
                        Usuń usługę
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
