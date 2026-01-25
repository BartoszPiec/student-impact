
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Globe, Info, User } from "lucide-react";

export function InquiryCard({ content }: { content: string }) {
    // Parse the legacy format: 
    // === DANE KONTAKTOWE === Email: ... WWW: ... === SZCZEGÓŁY ZLECENIA === ...

    // Simple parser
    const parseSection = (text: string, sectionName: string) => {
        const parts = text.split(`=== ${sectionName} ===`);
        if (parts.length < 2) return null;
        // Get the content after the header until the next ===
        const sectionContent = parts[1].split('===')[0].trim();
        return sectionContent;
    };

    const contactSection = parseSection(content, "DANE KONTAKTOWE");
    const detailsSection = parseSection(content, "SZCZEGÓŁY ZLECENIA");
    const extraSection = parseSection(content, "DODATKOWE INFORMACJE");

    // Helper to extract known fields if they are in Key: Value format
    // This is heuristic because the input format seems to be a single line string.
    // Example: "Email: foo@bar.com WWW: example.com"
    // We can try to split by known keys if they are consistent, or just display raw if not.

    return (
        <Card className="w-full max-w-lg border-none shadow-sm bg-indigo-50/50 mb-2">
            <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-semibold text-indigo-700 flex items-center gap-2">
                    <Info className="w-4 h-4" /> Szczegóły zapytania
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
                {contactSection && (
                    <div>
                        <div className="font-semibold text-xs text-slate-500 uppercase mb-1">Dane Kontaktowe</div>
                        <div className="bg-white p-3 rounded-md shadow-sm space-y-1">
                            {contactSection}
                        </div>
                    </div>
                )}

                {detailsSection && (
                    <div>
                        <div className="font-semibold text-xs text-slate-500 uppercase mb-1">Zlecenie</div>
                        <div className="bg-white p-3 rounded-md shadow-sm space-y-1">
                            {detailsSection}
                        </div>
                    </div>
                )}

                {extraSection && (
                    <div>
                        <div className="font-semibold text-xs text-slate-500 uppercase mb-1">Dodatkowe Informacje</div>
                        <div className="bg-white p-3 rounded-md shadow-sm space-y-1">
                            {extraSection}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
