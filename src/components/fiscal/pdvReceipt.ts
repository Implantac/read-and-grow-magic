import { formatBRL } from '@/lib/formatters';

export interface ReceiptItem {
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
}

export interface ReceiptSplit {
  method: string;
  amount: number;
  installments?: number;
}

export interface ReceiptData {
  companyName?: string;
  companyDocument?: string;
  companyAddress?: string;
  terminalId: string;
  operatorName: string;
  saleNumber?: string;
  issuedAt?: Date;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  change: number;
  splits: ReceiptSplit[];
  customerName?: string;
  customerDocument?: string;
  loyaltyPoints?: number;
  accessKey?: string;
  authorizationProtocol?: string;
}

const methodLabels: Record<string, string> = {
  cash: 'Dinheiro',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  voucher: 'Voucher',
  multiple: 'Múltiplo',
};

const esc = (s: string | undefined | null) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c] as string));

function buildHTML(data: ReceiptData): string {
  const issued = data.issuedAt ?? new Date();
  const dateStr = issued.toLocaleString('pt-BR');
  const saleNo = data.saleNumber || `CUP-${issued.getTime().toString().slice(-8)}`;

  const itemsRows = data.items
    .map((it, idx) => {
      const total = it.quantity * it.unitPrice;
      return `
        <tr>
          <td class="c-idx">${String(idx + 1).padStart(3, '0')}</td>
          <td class="c-name">
            <div class="pname">${esc(it.productName)}</div>
            <div class="pmeta">${esc(it.productCode)}${it.unit ? ' · ' + esc(it.unit) : ''}</div>
          </td>
          <td class="c-num">${it.quantity.toLocaleString('pt-BR')}</td>
          <td class="c-num">${formatBRL(it.unitPrice)}</td>
          <td class="c-num c-total">${formatBRL(total)}</td>
        </tr>`;
    })
    .join('');

  const splitsRows = data.splits
    .map(
      (s) => `
      <tr>
        <td>${esc(methodLabels[s.method] || s.method)}${
        s.installments && s.installments > 1 ? ` · ${s.installments}x` : ''
      }</td>
        <td class="c-num">${formatBRL(s.amount)}</td>
      </tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Comprovante ${esc(saleNo)}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'SF Mono', Menlo, Consolas, 'Courier New', monospace;
    font-size: 11px; color: #111; background: #f4f4f5;
    padding: 20px;
  }
  .receipt {
    max-width: 320px; margin: 0 auto; background: #fff;
    padding: 16px; border-radius: 6px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  }
  h1 { font-size: 14px; margin: 0 0 2px; text-align: center; text-transform: uppercase; letter-spacing: 1px; }
  .company-meta { text-align: center; font-size: 10px; color: #555; margin-bottom: 8px; }
  .divider { border: none; border-top: 1px dashed #999; margin: 8px 0; }
  .doc-title { text-align: center; font-weight: bold; font-size: 11px; letter-spacing: 2px; margin: 4px 0; }
  .kv { display: flex; justify-content: space-between; margin: 2px 0; font-size: 10.5px; }
  .kv .k { color: #555; }
  table { width: 100%; border-collapse: collapse; margin: 4px 0; }
  th { text-align: left; font-size: 9.5px; text-transform: uppercase; color: #555; padding: 2px 0; border-bottom: 1px solid #ccc; }
  td { padding: 3px 0; font-size: 10.5px; vertical-align: top; border-bottom: 1px dotted #ddd; }
  .c-idx { width: 22px; color: #999; }
  .c-name .pname { font-weight: 600; }
  .c-name .pmeta { font-size: 9px; color: #777; }
  .c-num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .c-total { font-weight: 700; }
  .totals { margin-top: 6px; }
  .totals .kv.big { font-size: 14px; font-weight: 800; }
  .totals .kv.big .v { color: #000; }
  .footer { text-align: center; margin-top: 10px; font-size: 9.5px; color: #666; }
  .badge { display: inline-block; padding: 2px 6px; border-radius: 3px; background: #eef; font-size: 9px; letter-spacing: 1px; }
  .actions { max-width: 320px; margin: 12px auto 0; display: flex; gap: 8px; }
  .actions button {
    flex: 1; padding: 10px; border: none; border-radius: 6px;
    font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
    cursor: pointer; font-size: 11px;
  }
  .btn-print { background: #111; color: #fff; }
  .btn-close { background: #eee; color: #333; }
  @media print {
    body { background: #fff; padding: 0; }
    .receipt { box-shadow: none; padding: 0; max-width: 100%; }
    .actions { display: none !important; }
  }
</style>
</head>
<body>
  <div class="receipt">
    <h1>${esc(data.companyName || 'Cupom Não Fiscal')}</h1>
    ${data.companyDocument ? `<div class="company-meta">CNPJ ${esc(data.companyDocument)}</div>` : ''}
    ${data.companyAddress ? `<div class="company-meta">${esc(data.companyAddress)}</div>` : ''}
    <hr class="divider" />

    <div class="doc-title">Comprovante de Venda</div>
    <div class="kv"><span class="k">Cupom</span><span>${esc(saleNo)}</span></div>
    <div class="kv"><span class="k">Data/Hora</span><span>${esc(dateStr)}</span></div>
    <div class="kv"><span class="k">Terminal</span><span>${esc(data.terminalId)}</span></div>
    <div class="kv"><span class="k">Operador</span><span>${esc(data.operatorName)}</span></div>
    ${
      data.customerName || data.customerDocument
        ? `<hr class="divider" />
           <div class="kv"><span class="k">Cliente</span><span>${esc(data.customerName || '—')}</span></div>
           ${data.customerDocument ? `<div class="kv"><span class="k">CPF/CNPJ</span><span>${esc(data.customerDocument)}</span></div>` : ''}
           ${data.loyaltyPoints ? `<div class="kv"><span class="k">Pontos ganhos</span><span>+${data.loyaltyPoints}</span></div>` : ''}`
        : ''
    }

    <hr class="divider" />
    <table>
      <thead>
        <tr><th>#</th><th>Item</th><th class="c-num">Qtd</th><th class="c-num">Vl Un</th><th class="c-num">Total</th></tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>

    <div class="totals">
      <div class="kv"><span class="k">Subtotal</span><span class="v">${formatBRL(data.subtotal)}</span></div>
      ${data.discount > 0 ? `<div class="kv"><span class="k">Desconto</span><span class="v">− ${formatBRL(data.discount)}</span></div>` : ''}
      <div class="kv big"><span class="k">TOTAL</span><span class="v">${formatBRL(data.total)}</span></div>
    </div>

    <hr class="divider" />
    <div class="doc-title" style="font-size:10px">Pagamento</div>
    <table>
      <tbody>
        ${splitsRows}
        ${data.change > 0 ? `<tr><td><strong>Troco</strong></td><td class="c-num"><strong>${formatBRL(data.change)}</strong></td></tr>` : ''}
      </tbody>
    </table>

    ${
      data.accessKey
        ? `<hr class="divider" />
           <div class="footer"><span class="badge">CHAVE DE ACESSO</span><br /><span style="word-break:break-all">${esc(data.accessKey)}</span></div>`
        : ''
    }
    ${data.authorizationProtocol ? `<div class="footer">Protocolo: ${esc(data.authorizationProtocol)}</div>` : ''}
    <hr class="divider" />
    <div class="footer">Obrigado pela preferência!<br />Documento sem valor fiscal quando emitido em contingência.</div>
  </div>

  <div class="actions">
    <button class="btn-print" onclick="window.print()">Imprimir / Salvar PDF</button>
    <button class="btn-close" onclick="window.close()">Fechar</button>
  </div>

  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { try { window.focus(); window.print(); } catch (e) {} }, 250);
    });
  </script>
</body>
</html>`;
}

/**
 * Abre o comprovante em nova janela, com preview + botão imprimir + salvar como PDF.
 * Retorna false se o popup foi bloqueado.
 */
export function openReceipt(data: ReceiptData): boolean {
  const html = buildHTML(data);
  const win = window.open('', '_blank', 'width=420,height=720');
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}
