import type { NFe, NFeItem } from '@/types/fiscal';
import { escapeXml } from './pdfUtils';

export function generateNFeXML(nfe: NFe): void {
  const items = nfe.items || [];
  const itemsXml = items
    .map(
      (item: NFeItem, idx: number) => `
    <det nItem="${idx + 1}">
      <prod>
        <cProd>${escapeXml(item.productCode)}</cProd>
        <xProd>${escapeXml(item.productName)}</xProd>
        <NCM>${escapeXml(item.ncm || '')}</NCM>
        <CFOP>${escapeXml(item.cfop || '5102')}</CFOP>
        <uCom>${escapeXml(item.unit || 'UN')}</uCom>
        <qCom>${item.quantity.toFixed(4)}</qCom>
        <vUnCom>${item.unitPrice.toFixed(4)}</vUnCom>
        <vProd>${item.total.toFixed(2)}</vProd>
        <vDesc>${(item.discount || 0).toFixed(2)}</vDesc>
      </prod>
      <imposto>
        <ICMS>
          <ICMS00>
            <orig>0</orig>
            <CST>00</CST>
            <modBC>0</modBC>
            <vBC>${(item.icmsBase || 0).toFixed(2)}</vBC>
            <pICMS>${(item.icmsRate || 0).toFixed(2)}</pICMS>
            <vICMS>${(item.icmsValue || 0).toFixed(2)}</vICMS>
          </ICMS00>
        </ICMS>
        <IPI>
          <IPITrib>
            <CST>50</CST>
            <pIPI>${(item.ipiRate || 0).toFixed(2)}</pIPI>
            <vIPI>${(item.ipiValue || 0).toFixed(2)}</vIPI>
          </IPITrib>
        </IPI>
        <PIS>
          <PISAliq>
            <CST>01</CST>
            <vBC>${item.total.toFixed(2)}</vBC>
            <pPIS>${(item.pisRate || 0).toFixed(2)}</pPIS>
            <vPIS>${(item.pisValue || 0).toFixed(2)}</vPIS>
          </PISAliq>
        </PIS>
        <COFINS>
          <COFINSAliq>
            <CST>01</CST>
            <vBC>${item.total.toFixed(2)}</vBC>
            <pCOFINS>${(item.cofinsRate || 0).toFixed(2)}</pCOFINS>
            <vCOFINS>${(item.cofinsValue || 0).toFixed(2)}</vCOFINS>
          </COFINSAliq>
        </COFINS>
      </imposto>
    </det>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe versao="4.00" Id="NFe${nfe.accessKey || ''}">
      <ide>
        <cUF>35</cUF>
        <natOp>${nfe.operationType === 'saida' ? 'Venda de mercadoria' : 'Compra de mercadoria'}</natOp>
        <mod>55</mod>
        <serie>${nfe.series}</serie>
        <nNF>${nfe.number}</nNF>
        <dhEmi>${nfe.issueDate}</dhEmi>
        <tpNF>${nfe.operationType === 'saida' ? '1' : '0'}</tpNF>
        <tpAmb>2</tpAmb>
        <finNFe>1</finNFe>
      </ide>
      <emit>
        <xNome>Empresa Emissora</xNome>
        <enderEmit>
          <xLgr>Rua Exemplo</xLgr>
          <nro>100</nro>
          <xBairro>Centro</xBairro>
          <cMun>3550308</cMun>
          <xMun>Sao Paulo</xMun>
          <UF>SP</UF>
          <CEP>01000000</CEP>
        </enderEmit>
      </emit>
      <dest>
        <xNome>${escapeXml(nfe.clientName)}</xNome>
        ${nfe.clientDocument ? `<CNPJ>${escapeXml(nfe.clientDocument.replace(/\D/g, ''))}</CNPJ>` : ''}
      </dest>
      ${itemsXml}
      <total>
        <ICMSTot>
          <vBC>${nfe.icms.toFixed(2)}</vBC>
          <vICMS>${nfe.icms.toFixed(2)}</vICMS>
          <vIPI>${nfe.ipi.toFixed(2)}</vIPI>
          <vPIS>${nfe.pis.toFixed(2)}</vPIS>
          <vCOFINS>${nfe.cofins.toFixed(2)}</vCOFINS>
          <vDesc>${nfe.discount.toFixed(2)}</vDesc>
          <vFrete>${nfe.shipping.toFixed(2)}</vFrete>
          <vProd>${nfe.subtotal.toFixed(2)}</vProd>
          <vNF>${nfe.total.toFixed(2)}</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
  ${nfe.protocol ? `<protNFe versao="4.00">
    <infProt>
      <tpAmb>2</tpAmb>
      <chNFe>${nfe.accessKey || ''}</chNFe>
      <dhRecbto>${nfe.authorizationDate || ''}</dhRecbto>
      <nProt>${nfe.protocol}</nProt>
      <digVal></digVal>
      <cStat>${nfe.status === 'authorized' ? '100' : nfe.status === 'cancelled' ? '101' : '999'}</cStat>
      <xMotivo>${nfe.status === 'authorized' ? 'Autorizado o uso da NF-e' : nfe.status === 'cancelled' ? 'Cancelamento de NF-e homologado' : ''}</xMotivo>
    </infProt>
  </protNFe>` : ''}
</nfeProc>`;

  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `NFe_${nfe.number}.xml`;
  const body = document.body || document.getElementsByTagName('body')[0];
  if (body) {
    body.appendChild(a);
    a.click();
    body.removeChild(a);
  }
  URL.revokeObjectURL(url);
}
