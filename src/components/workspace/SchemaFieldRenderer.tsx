import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { X } from "lucide-react";

export interface SchemaField {
  key: string;
  label: string;
  type: "text" | "textarea" | "password" | "number" | "slider" | "tags" | "select";
  required?: boolean;
  help?: string;
  default?: any;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface Props {
  field: SchemaField;
  value: any;
  onChange: (value: any) => void;
}

const SchemaFieldRenderer = ({ field, value, onChange }: Props) => {
  const [tagInput, setTagInput] = useState("");
  const v = value ?? field.default ?? (field.type === "tags" ? [] : "");

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}

      {field.type === "text" && (
        <Input value={v} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />
      )}

      {field.type === "password" && (
        <Input type="password" value={v} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />
      )}

      {field.type === "number" && (
        <Input type="number" value={v} onChange={(e) => onChange(Number(e.target.value))} min={field.min} max={field.max} />
      )}

      {field.type === "textarea" && (
        <Textarea value={v} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} rows={4} />
      )}

      {field.type === "slider" && (
        <div className="space-y-1">
          <Slider value={[Number(v) || field.min || 0]} min={field.min ?? 0} max={field.max ?? 100} step={1} onValueChange={(val) => onChange(val[0])} />
          <p className="text-xs text-muted-foreground text-right font-mono">{v}</p>
        </div>
      )}

      {field.type === "tags" && (
        <div className="space-y-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && tagInput.trim()) {
                e.preventDefault();
                onChange([...(Array.isArray(v) ? v : []), tagInput.trim()]);
                setTagInput("");
              }
            }}
            placeholder="Digite e Enter para adicionar"
          />
          <div className="flex flex-wrap gap-2">
            {Array.isArray(v) && v.map((tag: string, i: number) => (
              <Badge key={i} variant="secondary" className="gap-1">
                {tag}
                <button onClick={() => onChange(v.filter((_: any, idx: number) => idx !== i))} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {field.type === "select" && (
        <select
          value={v}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 rounded-lg border border-border/60 bg-card/40 px-4 text-sm"
        >
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
    </div>
  );
};

export default SchemaFieldRenderer;
