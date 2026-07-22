import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/base/dialog";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Textarea } from "@/ui/base/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/base/select";
import { Loader2, Plus } from "lucide-react";
import type { Incident } from "./types";

export function NewIncidentDialog({
  onCreate, pending,
}: { onCreate: (f: { title: string; description: string; severity: Incident["severity"] }) => void; pending: boolean }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", severity: "minor" as Incident["severity"] });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo incidente</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Abrir incidente</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v as Incident["severity"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="minor">Menor</SelectItem>
              <SelectItem value="major">Maior</SelectItem>
              <SelectItem value="critical">Crítico</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button disabled={!form.title || pending} onClick={() => {
            onCreate(form);
            setForm({ title: "", description: "", severity: "minor" });
            setOpen(false);
          }}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
