import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SystemProduct, XMLData } from './types';
import { supabase } from '@/integrations/supabase/client';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { parseIncomingNFe } from './parseIncomingNFe';

export function useXMLImport() {
  const { currentCompany, allowedUnits, currentBranch } = useEnterprise();
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [xmlData, setXmlData] = useState<XMLData | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [showManualLinking, setShowManualLinking] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  const [systemProducts, setSystemProducts] = useState<SystemProduct[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [documentIssue, setDocumentIssue] = useState<string | null>(null);

  useEffect(() => {
    setSelectedBranchId(currentBranch?.id && allowedUnits.some(unit => unit.id === currentBranch.id) ? currentBranch.id : '');
  }, [currentBranch?.id, allowedUnits]);

  useEffect(() => {
    let active = true;
    setDocumentIssue(null);
    if (!xmlData || !currentCompany?.id || !showReview) return () => { active = false; };
    const unit = allowedUnits.find(item => item.id === selectedBranchId);
    if (!unit) {
      setDocumentIssue('Selecione a unidade que receberá a mercadoria.');
      return () => { active = false; };
    }
    void Promise.all([
      supabase.from('branches').select('cnpj').eq('company_id', currentCompany.id).eq('id', unit.id).maybeSingle(),
      supabase.from('nfe').select('id').eq('company_id', currentCompany.id).eq('access_key', xmlData.accessKey).limit(1),
    ]).then(([branch, existing]) => {
      if (!active) return;
      if (branch.error || existing.error) { setDocumentIssue('Não foi possível verificar a unidade e a duplicidade da nota.'); return; }
      const recipient = xmlData.recipientCnpj;
      const branchCnpj = branch.data?.cnpj?.replace(/\D/g, '');
      const companyCnpj = currentCompany.cnpj?.replace(/\D/g, '');
      if (!branchCnpj && !companyCnpj) setDocumentIssue('Cadastre o CNPJ da empresa ou unidade antes da entrada.');
      else if (recipient !== branchCnpj && recipient !== companyCnpj) setDocumentIssue('O destinatário do XML não corresponde à empresa ou unidade selecionada.');
      else if (existing.data?.length) setDocumentIssue('Esta chave de acesso já está cadastrada nesta empresa.');
      else setDocumentIssue(null);
    });
    return () => { active = false; };
  }, [xmlData, currentCompany?.id, currentCompany?.cnpj, selectedBranchId, allowedUnits, showReview]);

  useEffect(() => {
    let active = true;
    setSystemProducts([]);
    if (!currentCompany?.id || !showReview) return () => { active = false; };
    void supabase.from('products').select('id,name,code').eq('company_id', currentCompany.id).order('name').then(({ data, error }) => {
      if (!active) return;
      if (error) toast.error('Não foi possível consultar os produtos cadastrados.');
      else {
        setSystemProducts(data ?? []);
        setXmlData(previous => previous ? {
          ...previous,
          products: previous.products.map(item => {
            if (item.linkedProductId) return item;
            const matches = (data ?? []).filter(product => product.code === item.code);
            return matches.length === 1
              ? { ...item, linkedProductId: matches[0].id, linkedProductName: matches[0].name }
              : item;
          }),
        } : previous);
      }
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
    allowedUnits,
    selectedBranchId,
    setSelectedBranchId,
    documentIssue,
    handleManualLink,
    confirmManualLink,
    handleFileUpload,
    processImport,
  };
}
