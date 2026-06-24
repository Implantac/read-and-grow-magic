import { Badge } from "@/ui/base/badge";
import { Button } from "@/ui/base/button";
import { Label } from "@/ui/base/label";
import { Progress } from "@/ui/base/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/base/dialog";
import {
  AlertTriangle,
  CheckCircle,
  FileSearch,
  Link as LinkIcon,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { XMLData } from "./types";

interface XMLReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  xmlData: XMLData | null;
  isProcessing: boolean;
  progress: number;
  onManualLink: (index: number) => void;
  onConfirm: () => void;
}

export function XMLReviewDialog({
  open,
  onOpenChange,
  xmlData,
  isProcessing,
  progress,
  onManualLink,
  onConfirm,
}: XMLReviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-primary" />
            Revisão de Importação XML
          </DialogTitle>
        </DialogHeader>

        {xmlData && (
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted/30 rounded-xl border">
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground font-bold">Número/Série</Label>
                <p className="font-bold">{xmlData.number} / {xmlData.series}</p>
              </div>
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground font-bold">Data Emissão</Label>
                <p className="font-bold">{new Date(xmlData.issueDate).toLocaleDateString()}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-[10px] uppercase text-muted-foreground font-bold">Fornecedor</Label>
                <p className="font-bold truncate">{xmlData.supplier.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{xmlData.supplier.cnpj}</p>
              </div>
              <div className="bg-primary/10 p-2 rounded border border-primary/20">
                <Label className="text-[10px] uppercase text-primary font-black">Pedido Vinculado</Label>
                <p className="font-bold text-primary flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {xmlData.purchaseOrderId || 'Nenhum'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Produtos e Inteligência de Vínculos
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left">Item (XML)</th>
                      <th className="px-3 py-2 text-left">Vínculo Sistema</th>
                      <th className="px-3 py-2 text-center">NCM/CFOP</th>
                      <th className="px-3 py-2 text-right">Qtd</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {xmlData.products.map((p, idx) => {
                      const isDuplicate = xmlData.products.filter(item => item.code === p.code).length > 1;
                      const hasIssue = !p.linkedProductId || isDuplicate;

                      return (
                        <tr key={idx} className={cn(
                          "hover:bg-muted/20 transition-colors",
                          hasIssue && "bg-destructive/5"
                        )}>
                          <td className="px-3 py-3">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium">{p.description}</span>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-[10px] font-mono px-1.5 py-0.5 rounded",
                                  isDuplicate ? "bg-destructive text-destructive-foreground font-bold" : "text-muted-foreground bg-muted"
                                )}>
                                  Ref: {p.code}
                                </span>
                                {isDuplicate && (
                                  <Badge variant="destructive" className="h-4 text-[9px] px-1 animate-pulse">
                                    Duplicado
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            {p.linkedProductId ? (
                              <div className="flex flex-col">
                                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 w-fit gap-1 mb-1">
                                  <CheckCircle className="h-2 w-2" /> Vínculo OK
                                </Badge>
                                <span className="text-xs font-bold text-primary">{p.linkedProductName}</span>
                                <span className="text-[10px] text-muted-foreground">{p.linkedProductId}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/5 w-fit gap-1 font-bold">
                                  <AlertTriangle className="h-2 w-2" /> Vínculo Obrigatório
                                </Badge>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 text-[10px] justify-start gap-1 font-bold text-primary underline decoration-primary/30"
                                  onClick={() => onManualLink(idx)}
                                >
                                  <LinkIcon className="h-2 w-2" />
                                  Vincular agora
                                </Button>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="text-[10px] font-mono">{p.ncm}</div>
                            <Badge variant="outline" className="text-[9px] h-4 px-1">{p.cfop}</Badge>
                          </td>
                          <td className="px-3 py-3 text-right">{p.qCom} {p.uCom}</td>
                          <td className="px-3 py-3 text-right font-bold">R$ {p.vProd.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-primary/5 rounded-xl border border-primary/20">
              <div className="flex gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Itens com Pendência</span>
                  <Badge variant="destructive" className="animate-bounce w-fit">
                    {xmlData.products.filter(p => !p.linkedProductId || xmlData.products.filter(item => item.code === p.code).length > 1).length} Pendentes
                  </Badge>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Fornecedor</span>
                  <Badge className="bg-blue-100 text-blue-700 w-fit">Reconhecido</Badge>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Valor Total da Nota</span>
                <p className="text-2xl font-black text-primary">R$ {xmlData.total.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="border-t pt-4">
          {isProcessing ? (
            <div className="w-full space-y-2">
              <div className="flex justify-between text-xs font-bold animate-pulse">
                <span>Processando Importação Enterprise...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={onConfirm} className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Confirmar Cadastro Automático
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
