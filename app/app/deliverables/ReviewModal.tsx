"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReviewForm } from "./[id]/ReviewForm";
import { Medal } from "lucide-react";

export function ReviewModal({
    isOpen,
    applicationId,
    action
}: {
    isOpen: boolean;
    applicationId: string;
    action: (appId: string, rating: number, comment: string) => Promise<void>;
}) {
    return (
        <AlertDialog open={isOpen}>
            <AlertDialogContent className="max-w-md bg-white">
                <AlertDialogHeader className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Medal className="h-8 w-8 text-indigo-600" />
                    </div>
                    <AlertDialogTitle className="text-xl text-center">Zlecenie Zrealizowane!</AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                        Gratulacje! Wszystkie etapy zostały zaakceptowane.<br />
                        Aby oficjalnie zakończyć zlecenie i odblokować historię, wystaw opinię o współpracy.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-2">
                    <ReviewForm applicationId={applicationId} action={action} />
                </div>

                {/* No Footer / Cancel button to enforce action */}
            </AlertDialogContent>
        </AlertDialog>
    );
}
