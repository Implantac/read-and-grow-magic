// Construtores de XML NF-e 4.00 e eventos (cancelamento, CCe).
// Escopo mínimo viável para HOMOLOGAÇÃO: venda simples, um destinatário, itens
// com CFOP/CSOSN/CST simples. Não cobre importação, exportação, ICMS-ST completo,
// combustível, etc. Ampliar conforme cada UF/regime for entrando em produção.
//
// Todas as funções recebem objetos JSON tipados e devolvem strings XML canônicas
// (sem indentação) prontas para assinatura por nfe-sign.ts.

import { getCUF } from "./sefaz-endpoints.ts";

export interface EmitenteInput {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  ie: string;
  crt: 1 | 2 | 3; // 1=SN, 2=SN excesso, 3=Regime Normal
  endereco: EnderecoInput;
}
export interface EnderecoInput {
  logradouro: string; numero: string; complemento?: string;
  bairro: string; cod_municipio: string; municipio: string;
  uf: string; cep: string; cod_pais?: string; pais?: string;
}
export interface DestinatarioInput {
  cnpj?: string; cpf?: string;
  razao_social: string;
  ie?: string; // 'ISENTO' ou número
  indIEDest: 1 | 2 | 9;
  endereco: EnderecoInput;
  email?: string;
}
export interface ItemInput {
  cProd: string; xProd: string; ncm: string; cfop: string;
  uCom: string; qCom: number; vUnCom: number; vProd: number;
  // Tributação simplificada (Simples Nacional CSOSN 102 + PIS/COFINS/IPI outros)
  csosn?: string;   // ex '102'
  cst_icms?: string; // ex '00'
  origem: number;    // 0..8
  pis_cst?: string;   // '49' padrão outros
  cofins_cst?: string;
}
export interface NFeInput {
  ambiente: 1 | 2;
  serie: number;
  nNF: number;
  natureza: string;       // ex "Venda de mercadoria"
  data_emissao: string;    // ISO
  finalidade: 1 | 2 | 3 | 4;
  presencial: 0 | 1 | 2 | 3 | 4 | 5 | 9;
  emitente: EmitenteInput;
  destinatario: DestinatarioInput;
  itens: ItemInput[];
  frete: 0 | 1 | 2 | 3 | 4 | 9;
  observacoes?: string;
}

function xmlEscape(v: string | number | undefined | null): string {
  if (v === undefined || v === null) return "";
  return String(v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function money(n: number, dec = 2): string { return n.toFixed(dec); }

/** Calcula o dígito verificador (mod11) da chave de acesso NF-e. */
export function calcDV(chave43: string): string {
  const weights = [2, 3, 4, 5, 6, 7, 8, 9];
  let sum = 0;
  const digits = chave43.split("").reverse();
  for (let i = 0; i < digits.length; i++) {
    sum += parseInt(digits[i], 10) * weights[i % weights.length];
  }
  const mod = sum % 11;
  const dv = 11 - mod;
  return dv >= 10 ? "0" : String(dv);
}

/** Monta chave de acesso 44 dígitos: cUF+AAMM+CNPJ+mod+serie+nNF+tpEmis+cNF+DV */
export function montarChave(input: {
  uf: string; ano: number; mes: number; cnpj: string; modelo: string;
  serie: number; nNF: number; tpEmis: number; cNF: number;
}): string {
  const cUF = getCUF(input.uf);
  const aamm = String(input.ano % 100).padStart(2, "0") + String(input.mes).padStart(2, "0");
  const cnpj = input.cnpj.replace(/\D/g, "").padStart(14, "0");
  const mod = input.modelo.padStart(2, "0");
  const serie = String(input.serie).padStart(3, "0");
  const nNF = String(input.nNF).padStart(9, "0");
  const tpEmis = String(input.tpEmis);
  const cNF = String(input.cNF).padStart(8, "0");
  const chave43 = cUF + aamm + cnpj + mod + serie + nNF + tpEmis + cNF;
  return chave43 + calcDV(chave43);
}

function buildEndereco(tag: string, e: EnderecoInput): string {
  return `<${tag}>` +
    `<xLgr>${xmlEscape(e.logradouro)}</xLgr>` +
    `<nro>${xmlEscape(e.numero)}</nro>` +
    (e.complemento ? `<xCpl>${xmlEscape(e.complemento)}</xCpl>` : "") +
    `<xBairro>${xmlEscape(e.bairro)}</xBairro>` +
    `<cMun>${xmlEscape(e.cod_municipio)}</cMun>` +
    `<xMun>${xmlEscape(e.municipio)}</xMun>` +
    `<UF>${xmlEscape(e.uf)}</UF>` +
    `<CEP>${xmlEscape(e.cep.replace(/\D/g, ""))}</CEP>` +
    `<cPais>${xmlEscape(e.cod_pais ?? "1058")}</cPais>` +
    `<xPais>${xmlEscape(e.pais ?? "BRASIL")}</xPais>` +
    `</${tag}>`;
}

function buildItem(idx: number, it: ItemInput): string {
  const nItem = idx + 1;
  const vICMS =
    `<ICMS>${it.csosn
      ? `<ICMSSN102><orig>${it.origem}</orig><CSOSN>${it.csosn}</CSOSN></ICMSSN102>`
      : `<ICMS00><orig>${it.origem}</orig><CST>${it.cst_icms ?? "00"}</CST><modBC>3</modBC><vBC>0.00</vBC><pICMS>0.00</pICMS><vICMS>0.00</vICMS></ICMS00>`}
    </ICMS>`.replace(/\s+</g, "<");
  const vPIS = `<PIS><PISOutr><CST>${it.pis_cst ?? "49"}</CST><vBC>0.00</vBC><pPIS>0.00</pPIS><vPIS>0.00</vPIS></PISOutr></PIS>`;
  const vCOFINS = `<COFINS><COFINSOutr><CST>${it.cofins_cst ?? "49"}</CST><vBC>0.00</vBC><pCOFINS>0.00</pCOFINS><vCOFINS>0.00</vCOFINS></COFINSOutr></COFINS>`;

  return `<det nItem="${nItem}">` +
    `<prod>` +
      `<cProd>${xmlEscape(it.cProd)}</cProd>` +
      `<cEAN>SEM GTIN</cEAN>` +
      `<xProd>${xmlEscape(it.xProd)}</xProd>` +
      `<NCM>${xmlEscape(it.ncm)}</NCM>` +
      `<CFOP>${xmlEscape(it.cfop)}</CFOP>` +
      `<uCom>${xmlEscape(it.uCom)}</uCom>` +
      `<qCom>${money(it.qCom, 4)}</qCom>` +
      `<vUnCom>${money(it.vUnCom, 4)}</vUnCom>` +
      `<vProd>${money(it.vProd)}</vProd>` +
      `<cEANTrib>SEM GTIN</cEANTrib>` +
      `<uTrib>${xmlEscape(it.uCom)}</uTrib>` +
      `<qTrib>${money(it.qCom, 4)}</qTrib>` +
      `<vUnTrib>${money(it.vUnCom, 4)}</vUnTrib>` +
      `<indTot>1</indTot>` +
    `</prod>` +
    `<imposto>${vICMS}${vPIS}${vCOFINS}</imposto>` +
  `</det>`;
}

export function buildNFeXml(input: NFeInput): { xml: string; chave: string } {
  const dt = new Date(input.data_emissao);
  const uf = input.emitente.endereco.uf;
  const cNF = Math.floor(Math.random() * 99999999);
  const chave = montarChave({
    uf, ano: dt.getFullYear(), mes: dt.getMonth() + 1,
    cnpj: input.emitente.cnpj, modelo: "55",
    serie: input.serie, nNF: input.nNF, tpEmis: 1, cNF,
  });

  const total = input.itens.reduce((s, it) => s + it.vProd, 0);

  const ide = `<ide>` +
    `<cUF>${getCUF(uf)}</cUF>` +
    `<cNF>${String(cNF).padStart(8, "0")}</cNF>` +
    `<natOp>${xmlEscape(input.natureza)}</natOp>` +
    `<mod>55</mod>` +
    `<serie>${input.serie}</serie>` +
    `<nNF>${input.nNF}</nNF>` +
    `<dhEmi>${dt.toISOString().replace(/\.\d{3}Z$/, "-03:00")}</dhEmi>` +
    `<tpNF>1</tpNF>` +
    `<idDest>1</idDest>` +
    `<cMunFG>${xmlEscape(input.emitente.endereco.cod_municipio)}</cMunFG>` +
    `<tpImp>1</tpImp>` +
    `<tpEmis>1</tpEmis>` +
    `<cDV>${chave.slice(-1)}</cDV>` +
    `<tpAmb>${input.ambiente}</tpAmb>` +
    `<finNFe>${input.finalidade}</finNFe>` +
    `<indFinal>1</indFinal>` +
    `<indPres>${input.presencial}</indPres>` +
    `<procEmi>0</procEmi>` +
    `<verProc>USE-ERP-1.0</verProc>` +
  `</ide>`;

  const emit = `<emit>` +
    `<CNPJ>${input.emitente.cnpj.replace(/\D/g, "")}</CNPJ>` +
    `<xNome>${xmlEscape(input.emitente.razao_social)}</xNome>` +
    (input.emitente.nome_fantasia ? `<xFant>${xmlEscape(input.emitente.nome_fantasia)}</xFant>` : "") +
    buildEndereco("enderEmit", input.emitente.endereco) +
    `<IE>${xmlEscape(input.emitente.ie)}</IE>` +
    `<CRT>${input.emitente.crt}</CRT>` +
  `</emit>`;

  const d = input.destinatario;
  const dest = `<dest>` +
    (d.cnpj ? `<CNPJ>${d.cnpj.replace(/\D/g, "")}</CNPJ>` : d.cpf ? `<CPF>${d.cpf.replace(/\D/g, "")}</CPF>` : "") +
    `<xNome>${xmlEscape(d.razao_social)}</xNome>` +
    buildEndereco("enderDest", d.endereco) +
    `<indIEDest>${d.indIEDest}</indIEDest>` +
    (d.ie && d.indIEDest === 1 ? `<IE>${xmlEscape(d.ie)}</IE>` : "") +
    (d.email ? `<email>${xmlEscape(d.email)}</email>` : "") +
  `</dest>`;

  const dets = input.itens.map((it, i) => buildItem(i, it)).join("");

  const total_block = `<total><ICMSTot>` +
    `<vBC>0.00</vBC><vICMS>0.00</vICMS><vICMSDeson>0.00</vICMSDeson>` +
    `<vFCP>0.00</vFCP><vBCST>0.00</vBCST><vST>0.00</vST><vFCPST>0.00</vFCPST><vFCPSTRet>0.00</vFCPSTRet>` +
    `<vProd>${money(total)}</vProd><vFrete>0.00</vFrete><vSeg>0.00</vSeg><vDesc>0.00</vDesc>` +
    `<vII>0.00</vII><vIPI>0.00</vIPI><vIPIDevol>0.00</vIPIDevol><vPIS>0.00</vPIS><vCOFINS>0.00</vCOFINS>` +
    `<vOutro>0.00</vOutro><vNF>${money(total)}</vNF>` +
  `</ICMSTot></total>`;

  const transp = `<transp><modFrete>${input.frete}</modFrete></transp>`;
  const pag = `<pag><detPag><indPag>0</indPag><tPag>90</tPag><vPag>${money(total)}</vPag></detPag></pag>`;
  const infAdic = input.observacoes ? `<infAdic><infCpl>${xmlEscape(input.observacoes)}</infCpl></infAdic>` : "";

  const infNFe = `<infNFe versao="4.00" Id="NFe${chave}">${ide}${emit}${dest}${dets}${total_block}${transp}${pag}${infAdic}</infNFe>`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?><NFe xmlns="http://www.portalfiscal.inf.br/nfe">${infNFe}</NFe>`;
  return { xml, chave };
}

/** Evento de cancelamento (tpEvento 110111). */
export function buildEventoCancelamento(input: {
  ambiente: 1 | 2; chave_nfe: string; cnpj_emit: string; uf: string;
  sequencia: number; protocolo_autorizacao: string; justificativa: string;
}): { xml: string; idEvento: string } {
  const dt = new Date().toISOString().replace(/\.\d{3}Z$/, "-03:00");
  const tpEvento = "110111";
  const nSeq = String(input.sequencia).padStart(2, "0");
  const idEvento = `ID${tpEvento}${input.chave_nfe}${nSeq}`;
  const cOrgao = getCUF(input.uf);
  const detEvento = `<detEvento versao="1.00"><descEvento>Cancelamento</descEvento>` +
    `<nProt>${input.protocolo_autorizacao}</nProt>` +
    `<xJust>${xmlEscape(input.justificativa)}</xJust></detEvento>`;
  const infEvento = `<infEvento Id="${idEvento}">` +
    `<cOrgao>${cOrgao}</cOrgao><tpAmb>${input.ambiente}</tpAmb>` +
    `<CNPJ>${input.cnpj_emit.replace(/\D/g, "")}</CNPJ>` +
    `<chNFe>${input.chave_nfe}</chNFe><dhEvento>${dt}</dhEvento>` +
    `<tpEvento>${tpEvento}</tpEvento><nSeqEvento>${input.sequencia}</nSeqEvento>` +
    `<verEvento>1.00</verEvento>${detEvento}</infEvento>`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>` +
    `<evento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">${infEvento}</evento>`;
  return { xml, idEvento };
}

/** Carta de Correção Eletrônica (tpEvento 110110). Só antes de 30 dias. */
export function buildEventoCCe(input: {
  ambiente: 1 | 2; chave_nfe: string; cnpj_emit: string; uf: string;
  sequencia: number; correcao: string;
}): { xml: string; idEvento: string } {
  const dt = new Date().toISOString().replace(/\.\d{3}Z$/, "-03:00");
  const tpEvento = "110110";
  const nSeq = String(input.sequencia).padStart(2, "0");
  const idEvento = `ID${tpEvento}${input.chave_nfe}${nSeq}`;
  const cOrgao = getCUF(input.uf);
  const detEvento = `<detEvento versao="1.00"><descEvento>Carta de Correcao</descEvento>` +
    `<xCorrecao>${xmlEscape(input.correcao)}</xCorrecao>` +
    `<xCondUso>A Carta de Correcao e disciplinada pelo paragrafo 1o-A do art. 7o do Convenio S/N, de 15 de dezembro de 1970 e pode ser utilizada para regularizacao de erro ocorrido na emissao de documento fiscal, desde que o erro nao esteja relacionado com: I - as variaveis que determinam o valor do imposto tais como: base de calculo, aliquota, diferenca de preco, quantidade, valor da operacao ou da prestacao; II - a correcao de dados cadastrais que implique mudanca do remetente ou do destinatario; III - a data de emissao ou de saida.</xCondUso>` +
    `</detEvento>`;
  const infEvento = `<infEvento Id="${idEvento}">` +
    `<cOrgao>${cOrgao}</cOrgao><tpAmb>${input.ambiente}</tpAmb>` +
    `<CNPJ>${input.cnpj_emit.replace(/\D/g, "")}</CNPJ>` +
    `<chNFe>${input.chave_nfe}</chNFe><dhEvento>${dt}</dhEvento>` +
    `<tpEvento>${tpEvento}</tpEvento><nSeqEvento>${input.sequencia}</nSeqEvento>` +
    `<verEvento>1.00</verEvento>${detEvento}</infEvento>`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>` +
    `<evento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">${infEvento}</evento>`;
  return { xml, idEvento };
}

/** Consulta status do serviço por UF. */
export function buildConsStatServ(ambiente: 1 | 2, uf: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<consStatServ xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">` +
    `<tpAmb>${ambiente}</tpAmb><cUF>${getCUF(uf)}</cUF><xServ>STATUS</xServ></consStatServ>`;
}
