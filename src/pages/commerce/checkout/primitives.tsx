import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { RadioGroupItem } from "@/ui/base/radio-group";

export function Field({
  label, value, onChange, type = "text", placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function PaymentOption({
  value, icon, label, hint, selected,
}: {
  value: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
  selected: boolean;
}) {
  return (
    <Label
      htmlFor={`pay-${value}`}
      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-muted hover:border-primary/40"
      }`}
    >
      <RadioGroupItem id={`pay-${value}`} value={value} />
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {label}
        </div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </Label>
  );
}
