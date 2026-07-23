import { PDFDocument, StandardFonts } from 'pdf-lib';
import type { NFe, NFeItem } from '@/types/fiscal';
import { formatDateTime, formatBRL } from '@/lib/formatters';
import { MM, drawText, drawRect, triggerDownload, type DrawCtx } from './pdfUtils';

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
