export interface XMLProduct {
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
  linkedProductId?: string;
  linkedProductName?: string;
}

export interface XMLData {
  accessKey: string;
  number: string;
  series: string;
  issueDate: string;
  supplier: {
    name: string;
    cnpj: string;
    ie: string;
  };
  products: XMLProduct[];
  total: number;
  purchaseOrderId?: string;
}

export interface SystemProduct {
  id: string;
  name: string;
  code: string;
}
