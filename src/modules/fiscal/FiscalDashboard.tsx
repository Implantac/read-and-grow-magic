import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { Progress } from "@/ui/base/progress";
import { Label } from "@/ui/base/label";
import { Input } from "@/ui/base/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/ui/base/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/base/select";
import { 
  ShieldCheck, 
  FileText, 
  Scale, 
  AlertOctagon,
  Percent,
  Download,
  Search,
  Zap,
  CheckCircle2,
  UploadCloud,
  FileSearch,
  Package,
  Users as UsersIcon,
  Calculator,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
  Link as LinkIcon,
  RefreshCw,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface XMLData {
  accessKey: string;
  number: string;
  series: string;
  issueDate: string;
  supplier: {
    name: string;
    cnpj: string;
    ie: string;
  };
  products: {
    code: string;
    description: string;
    ncm: string;
    cfop: string;
    uCom: string;
    qCom: number;
    vUnCom: number;
    vProd: number;
    taxes: {
      icms: number;
      ipi: number;
      pis: number;
      cofins: number;
    };
    linkedProductId?: string; // Linked local product ID
    linkedProductName?: string;
  }[];
  total: number;
  purchaseOrderId?: string;
}

export default function FiscalDashboard() {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [xmlData, setXmlData] = useState<XMLData | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [showManualLinking, setShowManualLinking] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [linkedOrders, setLinkedOrders] = useState<any[]>([]);
  
  // Simulated product database for linking
  const [systemProducts] = useState([
    { id: 'PROD-123', name: 'Tecido de Algodão Cru', code: 'ALG-001' },
    { id: 'PROD-456', name: 'Linha Costura Reforçada 40/2', code: 'LIN-100' },
    { id: 'PROD-789', name: 'Botão Poliéster Perolado', code: 'BOT-005' },
  ]);

  const handleManualLink = (index: number) => {
    setActiveItemIndex(index);
    setShowManualLinking(true);
  };

  const confirmManualLink = (productId: string) => {
    if (activeItemIndex === null || !xmlData) return;
    
    const product = systemProducts.find(p => p.id === productId);
    if (!product) return;

    const newProducts = [...xmlData.products];
    newProducts[activeItemIndex] = {
      ...newProducts[activeItemIndex],
      linkedProductId: product.id,
      linkedProductName: product.name
    };

    setXmlData({ ...xmlData, products: newProducts });
    setShowManualLinking(false);
    setActiveItemIndex(null);
    toast.success(`Item vinculado a ${product.name}`);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/xml' && !file.name.endsWith('.xml')) {
      toast.error('Por favor, selecione um arquivo XML válido.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      try {
        // Extraction simulation with product linking logic
        const mockParsedData: XMLData = {
          accessKey: "35230612345678000190550010000123451000123456",
          number: "12345",
          series: "1",
          issueDate: new Date().toISOString(),
          supplier: {
            name: "FORNECEDOR DE TECIDOS LTDA",
            cnpj: "12.345.678/0001-90",
            ie: "123456789"
          },
          products: [
            {
              code: "TEC-001", // Code from supplier
              description: "TECIDO ALGODAO PREMIUM AZUL",
              ncm: "52081100",
              cfop: "1101",
              uCom: "M",
              qCom: 100,
              vUnCom: 15.50,
              vProd: 1550.00,
              taxes: { icms: 186.00, ipi: 0, pis: 25.50, cofins: 117.80 },
              linkedProductId: "PROD-123", // Simulated match in system
              linkedProductName: "Tecido de Algodão Cru"
            },
            {
              code: "LIN-002",
              description: "LINHA DE COSTURA REFORCADA",
              ncm: "54011011",
              cfop: "1101",
              uCom: "RL",
              qCom: 50,
              vUnCom: 8.90,
              vProd: 445.00,
              taxes: { icms: 53.40, ipi: 22.25, pis: 7.34, cofins: 33.82 }
              // This one is not linked, will require manual link or new registration
            }
          ],
          total: 1995.00,
          purchaseOrderId: "PO-789" // Simulated detected PO link
        };

        setXmlData(mockParsedData);
        setShowReview(true);
        toast.success('XML carregado. Verifique os vínculos de produtos e pedidos.');
      } catch (err) {
        toast.error('Erro ao processar arquivo XML.');
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsText(file);
  };

  const processImport = async () => {
    if (!xmlData) return;

    // Check for unlinked items
    const unlinkedItems = xmlData.products.filter(p => !p.linkedProductId);
    if (unlinkedItems.length > 0) {
      toast.error(`Existem ${unlinkedItems.length} itens sem vínculo. Defina o vínculo antes de finalizar.`);
      return;
    }

    // Check for duplicate supplier references
    const supplierCodes = xmlData.products.map(p => p.code);
    const hasDuplicates = supplierCodes.some((code, index) => supplierCodes.indexOf(code) !== index);
    if (hasDuplicates) {
      toast.error('Existem referências de fornecedor duplicadas no XML. Verifique os itens.');
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);

    // Simulated multi-step import process
    const steps = [
      { msg: 'Vinculando Pedido de Compra...', weight: 15 },
      { msg: 'Cadastrando Fornecedor e Referências...', weight: 30 },
      { msg: 'Sincronizando Produtos e Vínculos...', weight: 50 },
      { msg: 'Calculando Custos, Tributos e Margens...', weight: 75 },
      { msg: 'Finalizando Pedido de Compra e Estoque...', weight: 100 }
    ];

    for (const step of steps) {
      await new Promise(r => setTimeout(r, 800));
      setProgress(step.weight);
      toast.info(step.msg);
    }

    setIsProcessing(false);
    setShowReview(false);
    setXmlData(null);
    toast.success('Entrada concluída! Pedido de compra finalizado e estoque atualizado via referência cruzada.');
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Motor Fiscal Enterprise</h1>
          <p className="text-muted-foreground">Compliance, apuração automática e gestão de documentos eletrônicos.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              accept=".xml" 
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              Importar XML (NFe)
            </Button>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Gerar SPED
          </Button>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={showReview} onOpenChange={setShowReview}>
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
                                    onClick={() => handleManualLink(idx)}
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-primary/5 rounded-xl border border-primary/20">
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Itens Novos</span>
                    <Badge className="bg-green-100 text-green-700 w-fit">2 Detectados</Badge>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Fornecedor</span>
                    <Badge className="bg-blue-100 text-blue-700 w-fit">Novo Cadastro</Badge>
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
                <Button variant="outline" onClick={() => setShowReview(false)}>Cancelar</Button>
                <Button onClick={processImport} className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Confirmar Cadastro Automático
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Product Linking Dialog */}
      <Dialog open={showManualLinking} onOpenChange={setShowManualLinking}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" />
              Vincular Produto do Sistema
            </DialogTitle>
          </DialogHeader>
          
          {activeItemIndex !== null && xmlData && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg border">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Item no XML</p>
                <p className="font-medium text-sm">{xmlData.products[activeItemIndex].description}</p>
                <p className="text-[10px] text-muted-foreground">Ref Fornecedor: {xmlData.products[activeItemIndex].code}</p>
              </div>

              <div className="space-y-2">
                <Label>Pesquisar no Catálogo Local</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Nome ou código do produto..." className="pl-9" />
                </div>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {systemProducts.map((p) => (
                  <div 
                    key={p.id} 
                    className="flex items-center justify-between p-3 rounded-lg border hover:border-primary cursor-pointer transition-all hover:bg-primary/5 group"
                    onClick={() => confirmManualLink(p.id)}
                  >
                    <div>
                      <p className="text-sm font-bold group-hover:text-primary transition-colors">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">Cód: {p.code}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualLinking(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Documentos (Mês)</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.850</div>
            <p className="text-xs text-muted-foreground mt-1">NFe, NFCe, CTe e MDFe</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Tributos Apurados</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 1.2M</div>
            <p className="text-xs text-green-500 mt-1 flex items-center">
              <CheckCircle2 className="h-3 w-3 mr-1" /> 100% conciliado
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98/100</div>
            <p className="text-xs text-muted-foreground mt-1">2 alertas de baixo risco</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Alerta Tributário</CardTitle>
            <AlertOctagon className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-red-500 mt-1">Inconsistência NCM detectada</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Monitor de Mensageria (DFe)</CardTitle>
            <Button variant="ghost" size="sm" className="gap-2">
              <Search className="h-3 w-3" />
              Filtrar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: 'NFe', num: '12450', status: 'Autorizada', time: '2 min atrás' },
                { type: 'CTe', num: '8542', status: 'Autorizada', time: '5 min atrás' },
                { type: 'NFe', num: '12451', status: 'Processando', time: 'Justo agora' },
                { type: 'MDFe', num: '102', status: 'Erro SEFAZ', time: '12 min atrás' },
              ].map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-bold">{doc.type}</div>
                    <span className="text-sm font-medium">Nº {doc.num}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      doc.status === 'Autorizada' ? "bg-green-100 text-green-700" : 
                      doc.status === 'Processando' ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                    )}>{doc.status}</span>
                    <span className="text-[10px] text-muted-foreground">{doc.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Automação Fiscal IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 border rounded-lg bg-primary/5">
              <p className="text-sm font-semibold mb-1">Sugestão de CFOP</p>
              <p className="text-xs text-muted-foreground">
                Baseado no destino (RS) e regime (Simples), o CFOP ideal para o produto "Tecido Algodão" é 6.102.
              </p>
            </div>
            <div className="p-3 border rounded-lg bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">Monitor de NCM</p>
              <p className="text-xs text-amber-600 dark:text-amber-300">
                Detectamos que o NCM 5208.11.00 teve alteração de alíquota IPI publicada hoje no DOU.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
