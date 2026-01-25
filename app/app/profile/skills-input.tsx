"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  name?: string; // hidden input name
  initial?: string[];
  placeholder?: string;
  max?: number;
};

function normalize(s: string) {
  return s.trim().replace(/\s+/g, " ");
}

export default function SkillsInput({
  name = "kompetencje_json",
  initial = [],
  placeholder = "Dodaj kompetencję i Enter…",
  max = 20,
}: Props) {
  const [tags, setTags] = React.useState<string[]>(
    (initial ?? []).map(normalize).filter(Boolean)
  );
  const [value, setValue] = React.useState("");

  const lowerSet = React.useMemo(() => new Set(tags.map((t) => t.toLowerCase())), [tags]);

  function addTag(raw: string) {
    const t = normalize(raw.replace(/,$/, ""));
    if (!t) return;
    if (lowerSet.has(t.toLowerCase())) return;
    if (tags.length >= max) return;
    setTags((prev) => [...prev, t]);
    setValue("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(value);
    }
    if (e.key === "Backspace" && !value && tags.length) {
      // szybkie usuwanie ostatniego
      setTags((prev) => prev.slice(0, -1));
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (!text.includes(",")) return;
    e.preventDefault();
    const parts = text.split(",").map((p) => normalize(p)).filter(Boolean);
    parts.forEach(addTag);
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={JSON.stringify(tags)} />

      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <Badge key={t} variant="outline" className="flex items-center gap-1">
            {t}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
              aria-label={`Usuń ${t}`}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>

      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        placeholder={tags.length >= max ? `Limit ${max} kompetencji` : placeholder}
        disabled={tags.length >= max}
      />

      <div className="text-xs text-muted-foreground">
        Enter lub przecinek dodaje tag. Backspace na pustym polu usuwa ostatni.
      </div>
    </div>
  );
}
