export const FIELD_TYPES = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "boolean", label: "Sim/Não" },
  { value: "date", label: "Data" },
  { value: "datetime", label: "Data/Hora" },
  { value: "select", label: "Lista (Seleção)" },
  { value: "json", label: "JSON" },
];

export function toKey(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function formatValue(v: any, type: string): string {
  if (v === null || v === undefined || v === "") return "—";
  if (type === "boolean") return v ? "Sim" : "Não";
  if (type === "json") return JSON.stringify(v);
  return String(v);
}

export const RELATIONSHIP_TYPES = [
  { value: "one_to_many", label: "1:N (Um para Muitos)" },
  { value: "many_to_one", label: "N:1 (Muitos para Um)" },
  { value: "many_to_many", label: "N:N (Muitos para Muitos)" },
];

export const INVERSE_TYPE: Record<string, string> = {
  one_to_many: "many_to_one",
  many_to_one: "one_to_many",
  many_to_many: "many_to_many",
};
