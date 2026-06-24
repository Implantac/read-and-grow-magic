import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { NFe, NFeItem } from '@/types/fiscal';

import { formatDateTime, formatBRL } from '@/lib/formatters';

// Convert mm → PDF points (1 mm = 2.83465 pt)
const MM = 2.83465;

interface DrawCtx {
  page: PDFPage;
  helv: PDFFont;
  helvBold: PDFFont;
  pageHeightMm: number;
}

function drawText(
  ctx: DrawCtx,
  text: string,
  xMm: number,
  yMm: number,
  options?: { size?: number; bold?: boolean; align?: 'left' | 'center' | 'right'; maxWidth?: number }
) {
  const size = options?.size ?? 8;
  const font = options?.bold ? ctx.helvBold : ctx.helv;
  const align = options?.align ?? 'left';
  let str = text ?? '';

  if (options?.maxWidth) {
    const maxW = options.maxWidth * MM;
    while (str.length > 0 && font.widthOfTextAtSize(str, size) > maxW) {
      str = str.slice(0, -1);
    }
  }

  let x = xMm * MM;
  const width = font.widthOfTextAtSize(str, size);
  if (align === 'center') x -= width / 2;
  else if (align === 'right') x -= width;

  const y = (ctx.pageHeightMm - yMm) * MM - size; // baseline adjust
  ctx.page.drawText(str, { x, y, size, font, color: rgb(0, 0, 0) });
}

function drawRect(ctx: DrawCtx, xMm: number, yMm: number, wMm: number, hMm: number, fill?: [number, number, number]) {
  const x = xMm * MM;
  const y = (ctx.pageHeightMm - yMm - hMm) * MM;
  const w = wMm * MM;
  const h = hMm * MM;
  ctx.page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.3,
    color: fill ? rgb(fill[0], fill[1], fill[2]) : undefined,
  });
}

function triggerDownload(bytes: Uint8Array, filename: string, mime: string) {
  // copy into a fresh ArrayBuffer (avoid SharedArrayBuffer typing issues)
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const blob = new Blob([ab], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  const body = document.body || document.getElementsByTagName('body')[0];
  if (body) {
    body.appendChild(a);
    a.click();
    body.removeChild(a);
  }
  URL.revokeObjectURL(url);
}

export async function generateDANFE(nfe: NFe): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidthMm = 210;
  const pageHeightMm = 297;
  const margin = 10;
  const contentWidth = pageWidthMm - margin * 2;

  let page = pdfDoc.addPage([pageWidthMm * MM, pageHeightMm * MM]);
  let ctx: DrawCtx = { page, helv, helvBold, pageHeightMm };
  let y = margin;

  const newPage = () => {
    page = pdfDoc.addPage([pageWidthMm * MM, pageHeightMm * MM]);
    ctx = { page, helv, helvBold, pageHeightMm };
    y = margin;
  };

  // ===== HEADER =====
  drawRect(ctx, margin, y, contentWidth, 30);
  drawText(ctx, 'DANFE', margin + 3, y + 6, { size: 14, bold: true });
  drawText(ctx, 'Documento Auxiliar da', margin + 3, y + 11, { size: 6 });
  drawText(ctx, 'Nota Fiscal Eletrônica', margin + 3, y + 14, { size: 6 });

  const centerX = margin + contentWidth / 2;
  drawText(ctx, 'NF-e', centerX, y + 6, { size: 12, bold: true, align: 'center' });
  drawText(ctx, `Nº ${nfe.number}`, centerX, y + 12, { size: 10, bold: true, align: 'center' });
  drawText(ctx, `Série: ${nfe.series}`, centerX, y + 17, { size: 8, align: 'center' });

  const typeLabel = nfe.operationType === 'saida' ? '1 - SAÍDA' : '0 - ENTRADA';
  drawText(ctx, typeLabel, margin + contentWidth - 3, y + 8, { size: 9, bold: true, align: 'right' });
  drawText(ctx, `Emissão: ${formatDateTime(nfe.issueDate)}`, margin + contentWidth - 3, y + 14, { size: 7, align: 'right' });

  if (nfe.status === 'authorized') {
    drawText(ctx, 'AUTORIZADA', margin + contentWidth - 3, y + 20, { size: 8, bold: true, align: 'right' });
  } else if (nfe.status === 'cancelled') {
    drawText(ctx, 'CANCELADA', margin + contentWidth - 3, y + 20, { size: 8, bold: true, align: 'right' });
  }
  y += 32;

  // ===== ACCESS KEY =====
  drawRect(ctx, margin, y, contentWidth, 10);
  drawText(ctx, 'CHAVE DE ACESSO', margin + 3, y + 4, { size: 6 });
  drawText(ctx, nfe.accessKey || 'Chave não disponível', margin + 3, y + 8, { size: 8, bold: true });
  y += 12;

  // ===== PROTOCOL =====
  if (nfe.protocol) {
    drawRect(ctx, margin, y, contentWidth, 8);
    drawText(ctx, 'PROTOCOLO DE AUTORIZAÇÃO', margin + 3, y + 4, { size: 6 });
    drawText(ctx, `${nfe.protocol} - ${formatDateTime(nfe.authorizationDate || '')}`, margin + 3, y + 7.5, { size: 7, bold: true });
    y += 10;
  }

  // ===== DESTINATÁRIO =====
  drawRect(ctx, margin, y, contentWidth, 18);
  drawText(ctx, 'DESTINATÁRIO/REMETENTE', margin + 3, y + 4, { size: 6, bold: true });
  drawText(ctx, 'Nome/Razão Social', margin + 3, y + 8, { size: 5 });
  drawText(ctx, nfe.clientName, margin + 3, y + 12, { size: 8, bold: true, maxWidth: contentWidth - 60 });
  if (nfe.clientDocument) {
    drawText(ctx, 'CNPJ/CPF', margin + contentWidth - 50, y + 8, { size: 5 });
    drawText(ctx, nfe.clientDocument, margin + contentWidth - 50, y + 12, { size: 8 });
  }
  y += 20;

  // ===== ITEMS TABLE =====
  drawRect(ctx, margin, y, contentWidth, 8);
  drawText(ctx, 'DADOS DOS PRODUTOS/SERVIÇOS', margin + 3, y + 5, { size: 7, bold: true });
  y += 8;

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

  drawRect(ctx, margin, y, contentWidth, 6, [0.94, 0.94, 0.94]);
  cols.forEach((col) => {
    drawText(ctx, col.label, col.x + 1, y + 4, { size: 5, bold: true });
  });
  y += 6;

  const items = nfe.items || [];
  items.forEach((item: NFeItem) => {
    if (y > 260) {
      newPage();
    }
    const rowHeight = 6;
    drawRect(ctx, margin, y, contentWidth, rowHeight);

    drawText(ctx, item.productCode, cols[0].x + 1, y + 4, { size: 5, maxWidth: cols[0].width - 1 });
    drawText(ctx, item.productName.substring(0, 30), cols[1].x + 1, y + 4, { size: 5, maxWidth: cols[1].width - 1 });
    drawText(ctx, item.ncm || '', cols[2].x + 1, y + 4, { size: 5 });
    drawText(ctx, item.cfop || '', cols[3].x + 1, y + 4, { size: 5 });
    drawText(ctx, item.unit || 'UN', cols[4].x + 1, y + 4, { size: 5 });
    drawText(ctx, String(item.quantity), cols[5].x + 1, y + 4, { size: 5 });
    drawText(ctx, formatBRL(item.unitPrice), cols[6].x + 1, y + 4, { size: 5 });
    drawText(ctx, formatBRL(item.total), cols[7].x + 1, y + 4, { size: 5 });
    drawText(ctx, formatBRL(item.icmsValue || 0), cols[8].x + 1, y + 4, { size: 5 });
    y += rowHeight;
  });
  y += 4;

  // ===== TOTALS =====
  if (y > 250) newPage();

  drawRect(ctx, margin, y, contentWidth, 24);
  drawText(ctx, 'CÁLCULO DO IMPOSTO', margin + 3, y + 4, { size: 6, bold: true });

  const taxY = y + 8;
  const taxCol = contentWidth / 4;

  drawText(ctx, 'Base ICMS', margin + 3, taxY, { size: 5 });
  drawText(ctx, formatBRL(nfe.icms), margin + 3, taxY + 3.5, { size: 7, bold: true });
  drawText(ctx, 'Valor ICMS', margin + taxCol + 3, taxY, { size: 5 });
  drawText(ctx, formatBRL(nfe.icms), margin + taxCol + 3, taxY + 3.5, { size: 7, bold: true });
  drawText(ctx, 'Valor IPI', margin + taxCol * 2 + 3, taxY, { size: 5 });
  drawText(ctx, formatBRL(nfe.ipi), margin + taxCol * 2 + 3, taxY + 3.5, { size: 7, bold: true });
  drawText(ctx, 'Valor Total NF-e', margin + taxCol * 3 + 3, taxY, { size: 5 });
  drawText(ctx, formatBRL(nfe.total), margin + taxCol * 3 + 3, taxY + 3.5, { size: 9, bold: true });

  const taxY2 = taxY + 9;
  drawText(ctx, 'Valor PIS', margin + 3, taxY2, { size: 5 });
  drawText(ctx, formatBRL(nfe.pis), margin + 3, taxY2 + 3.5, { size: 7, bold: true });
  drawText(ctx, 'Valor COFINS', margin + taxCol + 3, taxY2, { size: 5 });
  drawText(ctx, formatBRL(nfe.cofins), margin + taxCol + 3, taxY2 + 3.5, { size: 7, bold: true });
  drawText(ctx, 'Desconto', margin + taxCol * 2 + 3, taxY2, { size: 5 });
  drawText(ctx, formatBRL(nfe.discount), margin + taxCol * 2 + 3, taxY2 + 3.5, { size: 7, bold: true });
  drawText(ctx, 'Frete', margin + taxCol * 3 + 3, taxY2, { size: 5 });
  drawText(ctx, formatBRL(nfe.shipping), margin + taxCol * 3 + 3, taxY2 + 3.5, { size: 7, bold: true });

  y += 26;

  // ===== CANCELLATION =====
  if (nfe.status === 'cancelled' && nfe.cancellationReason) {
    drawRect(ctx, margin, y, contentWidth, 14, [1, 0.9, 0.9]);
    drawText(ctx, 'NOTA FISCAL CANCELADA', margin + 3, y + 5, { size: 9, bold: true });
    drawText(ctx, `Motivo: ${nfe.cancellationReason}`, margin + 3, y + 10, { size: 7, maxWidth: contentWidth - 6 });
    if (nfe.cancellationDate) {
      drawText(ctx, `Data: ${formatDateTime(nfe.cancellationDate)}`, margin + 3, y + 13, { size: 6 });
    }
  }

  // ===== FOOTER =====
  drawText(ctx, 'Documento gerado pelo sistema ERP - Use Sistemas', pageWidthMm / 2, 290, { size: 6, align: 'center' });

  const bytes = await pdfDoc.save();
  triggerDownload(bytes, `DANFE_${nfe.number}.pdf`, 'application/pdf');
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
  const body = document.body || document.getElementsByTagName('body')[0];
  if (body) {
    body.appendChild(a);
    a.click();
    body.removeChild(a);
  }
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
