import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SystemProduct, XMLData } from './types';
import { supabase } from '@/integrations/supabase/client';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { parseIncomingNFe } from './parseIncomingNFe';

export function useXMLImport() {
  const { currentCompany } = useEnterprise();
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [xmlData, setXmlData] = useState<XMLData | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [showManualLinking, setShowManualLinking] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  const [systemProducts, setSystemProducts] = useState<SystemProduct[]>([]);

  useEffect(() => {
    let active = true;
    setSystemProducts([]);
    if (!currentCompany?.id || !showReview) return () => { active = false; };
    void supabase.from('products').select('id,name,code').eq('company_id', currentCompany.id).order('name').then(({ data, error }) => {
      if (!active) return;
      if (error) toast.error('Não foi possível consultar os produtos cadastrados.');
      else setSystemProducts(data ?? []);
    });
    return () => { active = false; };
  }, [currentCompany?.id, showReview]);

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

    if (!file.name.toLowerCase().endsWith('.xml')) {
      toast.error('Por favor, selecione um arquivo XML válido.');
      return;
    }

    setIsUploading(true);
    try {
      const parsed = parseIncomingNFe(await file.text());
      setXmlData(parsed);
      setShowReview(true);
      toast.success('Nota lida. Confira os itens antes de prosseguir.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível ler o XML da nota.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const processImport = async () => {
    if (!xmlData) return;
    toast.error('Entrada indisponível: a nota ainda não pode gerar produtos, estoque e contas com segurança. Nenhum lançamento foi feito.');
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
