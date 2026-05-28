import jsPDF from 'jspdf';
import type { NFe, NFeItem } from '@/types/fiscal';

import { formatDateTime, formatBRL } from '@/lib/formatters';

const formatCurrency = (v: number) => formatBRL(v);


export function generateDANFE(nfe: NFe): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const drawRect = (x: number, yPos: number, w: number, h: number) => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(x, yPos, w, h);
  };

  const addText = (text: string, x: number, yPos: number, options?: { size?: number; bold?: boolean; align?: 'left' | 'center' | 'right'; maxWidth?: number }) => {
    doc.setFontSize(options?.size || 8);
    doc.setFont('helvetica', options?.bold ? 'bold' : 'normal');
    const align = options?.align || 'left';
    if (options?.maxWidth) {
      doc.text(text, x, yPos, { maxWidth: options.maxWidth, align });
    } else {
      doc.text(text, x, yPos, { align });
    }
  };

  // ===== HEADER =====
  drawRect(margin, y, contentWidth, 30);

  // Left: Emitter info
  addText('DANFE', margin + 3, y + 6, { size: 14, bold: true });
  addText('Documento Auxiliar da', margin + 3, y + 11, { size: 6 });
  addText('Nota Fiscal Eletrônica', margin + 3, y + 14, { size: 6 });

  // Center: NF-e number
  const centerX = margin + contentWidth / 2;
  addText('NF-e', centerX, y + 6, { size: 12, bold: true, align: 'center' });
  addText(`Nº ${nfe.number}`, centerX, y + 12, { size: 10, bold: true, align: 'center' });
  addText(`Série: ${nfe.series}`, centerX, y + 17, { size: 8, align: 'center' });

  // Right: Type
  const typeLabel = nfe.operationType === 'saida' ? '1 - SAÍDA' : '0 - ENTRADA';
  addText(typeLabel, margin + contentWidth - 3, y + 8, { size: 9, bold: true, align: 'right' });
  addText(`Emissão: ${formatDateTime(nfe.issueDate)}`, margin + contentWidth - 3, y + 14, { size: 7, align: 'right' });

  // Status badge
  if (nfe.status === 'authorized') {
    addText('AUTORIZADA', margin + contentWidth - 3, y + 20, { size: 8, bold: true, align: 'right' });
  } else if (nfe.status === 'cancelled') {
    addText('CANCELADA', margin + contentWidth - 3, y + 20, { size: 8, bold: true, align: 'right' });
  }

  y += 32;

  // ===== ACCESS KEY =====
  drawRect(margin, y, contentWidth, 10);
  addText('CHAVE DE ACESSO', margin + 3, y + 4, { size: 6 });
  addText(nfe.accessKey || 'Chave não disponível', margin + 3, y + 8, { size: 8, bold: true });
  y += 12;

  // ===== PROTOCOL =====
  if (nfe.protocol) {
    drawRect(margin, y, contentWidth, 8);
    addText('PROTOCOLO DE AUTORIZAÇÃO', margin + 3, y + 4, { size: 6 });
    addText(`${nfe.protocol} - ${formatDateTime(nfe.authorizationDate || '')}`, margin + 3, y + 7.5, { size: 7, bold: true });
    y += 10;
  }

  // ===== DESTINATÁRIO =====
  drawRect(margin, y, contentWidth, 18);
  addText('DESTINATÁRIO/REMETENTE', margin + 3, y + 4, { size: 6, bold: true });

  addText('Nome/Razão Social', margin + 3, y + 8, { size: 5 });
  addText(nfe.clientName, margin + 3, y + 12, { size: 8, bold: true });

  if (nfe.clientDocument) {
    addText('CNPJ/CPF', margin + contentWidth - 50, y + 8, { size: 5 });
    addText(nfe.clientDocument, margin + contentWidth - 50, y + 12, { size: 8 });
  }

  y += 20;

  // ===== ITEMS TABLE =====
  drawRect(margin, y, contentWidth, 8);
  addText('DADOS DOS PRODUTOS/SERVIÇOS', margin + 3, y + 5, { size: 7, bold: true });
  y += 8;

  // Table Header
  const cols = [
    { label: 'Código', width: 18, x: margin },
    { label: 'Descrição', width: 55, x: margin + 18 },
    { label: 'NCM', width: 15, x: margin + 73 },
    { label: 'CFOP', width: 12, x: margin + 88 },
    { label: 'Unid', width: 10, x: margin + 100 },
    { label: 'Qtde', width: 14, x: margin + 110 },
    { label: 'Vlr Unit', width: 20, x: margin + 124 },
    { label: 'Vlr Total', width: 22, x: margin + 144 },
    { label: 'ICMS', width: 22, x: margin + 166 },
  ];

  drawRect(margin, y, contentWidth, 6);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, 6, 'F');
  drawRect(margin, y, contentWidth, 6);

  cols.forEach((col) => {
    addText(col.label, col.x + 1, y + 4, { size: 5, bold: true });
  });
  y += 6;

  // Table Rows
  const items = nfe.items || [];
  items.forEach((item: NFeItem) => {
    if (y > 260) {
      doc.addPage();
      y = margin;
    }

    const rowHeight = 6;
    drawRect(margin, y, contentWidth, rowHeight);

    addText(item.productCode, cols[0].x + 1, y + 4, { size: 5 });
    addText(item.productName.substring(0, 30), cols[1].x + 1, y + 4, { size: 5 });
    addText(item.ncm || '', cols[2].x + 1, y + 4, { size: 5 });
    addText(item.cfop || '', cols[3].x + 1, y + 4, { size: 5 });
    addText(item.unit || 'UN', cols[4].x + 1, y + 4, { size: 5 });
    addText(String(item.quantity), cols[5].x + 1, y + 4, { size: 5 });
    addText(formatCurrency(item.unitPrice), cols[6].x + 1, y + 4, { size: 5 });
    addText(formatCurrency(item.total), cols[7].x + 1, y + 4, { size: 5 });
    addText(formatCurrency(item.icmsValue || 0), cols[8].x + 1, y + 4, { size: 5 });

    y += rowHeight;
  });

  y += 4;

  // ===== TOTALS =====
  if (y > 250) {
    doc.addPage();
    y = margin;
  }

  drawRect(margin, y, contentWidth, 24);
  addText('CÁLCULO DO IMPOSTO', margin + 3, y + 4, { size: 6, bold: true });

  const taxY = y + 8;
  const taxCol = contentWidth / 4;

  // Row 1
  addText('Base ICMS', margin + 3, taxY, { size: 5 });
  addText(formatCurrency(nfe.icms), margin + 3, taxY + 3.5, { size: 7, bold: true });

  addText('Valor ICMS', margin + taxCol + 3, taxY, { size: 5 });
  addText(formatCurrency(nfe.icms), margin + taxCol + 3, taxY + 3.5, { size: 7, bold: true });

  addText('Valor IPI', margin + taxCol * 2 + 3, taxY, { size: 5 });
  addText(formatCurrency(nfe.ipi), margin + taxCol * 2 + 3, taxY + 3.5, { size: 7, bold: true });

  addText('Valor Total NF-e', margin + taxCol * 3 + 3, taxY, { size: 5 });
  addText(formatCurrency(nfe.total), margin + taxCol * 3 + 3, taxY + 3.5, { size: 9, bold: true });

  // Row 2
  const taxY2 = taxY + 9;
  addText('Valor PIS', margin + 3, taxY2, { size: 5 });
  addText(formatCurrency(nfe.pis), margin + 3, taxY2 + 3.5, { size: 7, bold: true });

  addText('Valor COFINS', margin + taxCol + 3, taxY2, { size: 5 });
  addText(formatCurrency(nfe.cofins), margin + taxCol + 3, taxY2 + 3.5, { size: 7, bold: true });

  addText('Desconto', margin + taxCol * 2 + 3, taxY2, { size: 5 });
  addText(formatCurrency(nfe.discount), margin + taxCol * 2 + 3, taxY2 + 3.5, { size: 7, bold: true });

  addText('Frete', margin + taxCol * 3 + 3, taxY2, { size: 5 });
  addText(formatCurrency(nfe.shipping), margin + taxCol * 3 + 3, taxY2 + 3.5, { size: 7, bold: true });

  y += 26;

  // ===== CANCELLATION =====
  if (nfe.status === 'cancelled' && nfe.cancellationReason) {
    drawRect(margin, y, contentWidth, 14);
    doc.setFillColor(255, 230, 230);
    doc.rect(margin, y, contentWidth, 14, 'F');
    drawRect(margin, y, contentWidth, 14);
    addText('NOTA FISCAL CANCELADA', margin + 3, y + 5, { size: 9, bold: true });
    addText(`Motivo: ${nfe.cancellationReason}`, margin + 3, y + 10, { size: 7 });
    if (nfe.cancellationDate) {
      addText(`Data: ${formatDateTime(nfe.cancellationDate)}`, margin + 3, y + 13, { size: 6 });
    }
  }

  // ===== FOOTER =====
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('Documento gerado pelo sistema ERP - Use Sistemas', pageWidth / 2, 290, { align: 'center' });

  doc.save(`DANFE_${nfe.number}.pdf`);
}

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
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
