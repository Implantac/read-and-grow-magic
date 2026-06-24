import { useState } from 'react';
import { toast } from 'sonner';
import { SystemProduct, XMLData } from './types';

const SYSTEM_PRODUCTS: SystemProduct[] = [
  { id: 'PROD-123', name: 'Tecido de Algodão Cru', code: 'ALG-001' },
  { id: 'PROD-456', name: 'Linha Costura Reforçada 40/2', code: 'LIN-100' },
  { id: 'PROD-789', name: 'Botão Poliéster Perolado', code: 'BOT-005' },
];

export function useXMLImport() {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [xmlData, setXmlData] = useState<XMLData | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [showManualLinking, setShowManualLinking] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  const systemProducts = SYSTEM_PRODUCTS;

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
      linkedProductName: product.name,
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

    reader.onload = async () => {
      try {
        const mockParsedData: XMLData = {
          accessKey: "35230612345678000190550010000123451000123456",
          number: "12345",
          series: "1",
          issueDate: new Date().toISOString(),
          supplier: {
            name: "FORNECEDOR DE TECIDOS LTDA",
            cnpj: "12.345.678/0001-90",
            ie: "123456789",
          },
          products: [
            {
              code: "TEC-001",
              description: "TECIDO ALGODAO PREMIUM AZUL",
              ncm: "52081100",
              cfop: "1101",
              uCom: "M",
              qCom: 100,
              vUnCom: 15.50,
              vProd: 1550.00,
              taxes: { icms: 186.00, ipi: 0, pis: 25.50, cofins: 117.80 },
              linkedProductId: "PROD-123",
              linkedProductName: "Tecido de Algodão Cru",
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
              taxes: { icms: 53.40, ipi: 22.25, pis: 7.34, cofins: 33.82 },
            },
          ],
          total: 1995.00,
          purchaseOrderId: "PO-789",
        };

        setXmlData(mockParsedData);
        setShowReview(true);
        toast.success('XML carregado. Verifique os vínculos de produtos e pedidos.');
      } catch {
        toast.error('Erro ao processar arquivo XML.');
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsText(file);
  };

  const processImport = async () => {
    if (!xmlData) return;

    const unlinkedItems = xmlData.products.filter(p => !p.linkedProductId);
    if (unlinkedItems.length > 0) {
      toast.error(`Existem ${unlinkedItems.length} itens sem vínculo. Defina o vínculo antes de finalizar.`);
      return;
    }

    const supplierCodes = xmlData.products.map(p => p.code);
    const hasDuplicates = supplierCodes.some((code, index) => supplierCodes.indexOf(code) !== index);
    if (hasDuplicates) {
      toast.error('Existem referências de fornecedor duplicadas no XML. Verifique os itens.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    const steps = [
      { msg: 'Vinculando Pedido de Compra...', weight: 15 },
      { msg: 'Cadastrando Fornecedor e Referências...', weight: 30 },
      { msg: 'Sincronizando Produtos e Vínculos...', weight: 50 },
      { msg: 'Calculando Custos, Tributos e Margens...', weight: 75 },
      { msg: 'Finalizando Pedido de Compra e Estoque...', weight: 100 },
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

  return {
    isUploading,
    isProcessing,
    xmlData,
    showReview,
    setShowReview,
    showManualLinking,
    setShowManualLinking,
    activeItemIndex,
    progress,
    systemProducts,
    handleManualLink,
    confirmManualLink,
    handleFileUpload,
    processImport,
  };
}
