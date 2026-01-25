"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CopyOfferLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // fallback
      try {
        const el = document.createElement("textarea");
        el.value = url;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      } catch {}
    }
  }

  return (
    <Button type="button" variant="outline" onClick={onCopy}>
      {copied ? "Skopiowano ✅" : "Kopiuj link"}
    </Button>
  );
}
