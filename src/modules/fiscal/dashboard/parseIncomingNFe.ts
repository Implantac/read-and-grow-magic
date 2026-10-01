import type { XMLData } from './types';

const child = (node: Element, name: string): Element | null =>
  Array.from(node.children).find((item) => item.localName === name) ?? null;
const text = (node: Element | null, name: string): string =>
  child(node ?? document.createElement('empty'), name)?.textContent?.trim() ?? '';
const amount = (value: string): number => Number(value);

export function parseIncomingNFe(xml: string): XMLData {
  if (/<!\s*(?:DOCTYPE|ENTITY)/i.test(xml)) throw new Error('XML com estrutura não permitida.');
  const documentXml = new DOMParser().parseFromString(xml, 'application/xml');
  if (documentXml.getElementsByTagName('parsererror').length) throw new Error('O arquivo XML está inválido.');

  const byName = (name: string): Element | null =>
    Array.from(documentXml.getElementsByTagName('*')).find((node) => node.localName === name) ?? null;
  const infNFe = byName('infNFe');
  const ide = infNFe && child(infNFe, 'ide');
  const emit = infNFe && child(infNFe, 'emit');
  const dest = infNFe && child(infNFe, 'dest');
  const total = infNFe && child(infNFe, 'total');
  const key = infNFe?.getAttribute('Id')?.replace(/^NFe/, '') ?? '';
  const protocol = byName('infProt');
  if (!infNFe || !ide || !emit || !dest || !total || !/^\d{44}$/.test(key)) {
    throw new Error('Selecione um XML de NF-e com chave de acesso válida.');
  }
  if (!protocol || text(protocol, 'cStat') !== '100' || text(protocol, 'chNFe') !== key) {
    throw new Error('A NF-e precisa conter protocolo de autorização correspondente à chave de acesso.');
  }
  const products = Array.from(infNFe.children).filter((node) => node.localName === 'det').map((item) => {
    const product = child(item, 'prod');
    const tax = child(item, 'imposto');
    const taxAmount = (group: string, field: string) => {
      const parent = tax && child(tax, group);
      const variant = parent?.firstElementChild;
      return amount(text(variant ?? parent, field)) || 0;
    };
    return {
      code: text(product, 'cProd'),
      description: text(product, 'xProd'),
      ncm: text(product, 'NCM'),
      cfop: text(product, 'CFOP'),
      uCom: text(product, 'uCom'),
      qCom: amount(text(product, 'qCom')),
      vUnCom: amount(text(product, 'vUnCom')),
      vProd: amount(text(product, 'vProd')),
      taxes: {
        icms: taxAmount('ICMS', 'vICMS'), ipi: taxAmount('IPI', 'vIPI'),
        pis: taxAmount('PIS', 'vPIS'), cofins: taxAmount('COFINS', 'vCOFINS'),
      },
    };
  });
  const invoiceTotal = amount(text(child(total, 'ICMSTot'), 'vNF'));
  if (!products.length || products.some((p) => !p.code || !p.description || !p.uCom || !Number.isFinite(p.qCom) || p.qCom <= 0 || !Number.isFinite(p.vUnCom) || p.vUnCom < 0 || !Number.isFinite(p.vProd) || p.vProd < 0)
    || !Number.isFinite(invoiceTotal) || invoiceTotal <= 0 || !/^\d{14}$/.test(text(emit, 'CNPJ')) || !/^\d{14}$/.test(text(dest, 'CNPJ'))) {
    throw new Error('A nota possui itens, fornecedor ou valores inválidos.');
  }
  return {
    accessKey: key,
    number: text(ide, 'nNF'), series: text(ide, 'serie'), issueDate: text(ide, 'dhEmi') || text(ide, 'dEmi'),
    supplier: { name: text(emit, 'xNome'), cnpj: text(emit, 'CNPJ'), ie: text(emit, 'IE') },
    recipientCnpj: text(dest, 'CNPJ'),
    products, total: invoiceTotal,
  };
}