// SEFAZ NF-e 4.00 — endpoints por UF (homologação e produção).
// Fonte: Portal Nacional NF-e (atualizado 2025-Q2). Ambiente 2 = homologação, 1 = produção.
// Cada UF tem seu "autorizador" (SVRS / SVAN / SP / MG / RS etc.).

export type Ambiente = 1 | 2;
export type NFeService =
  | "NfeAutorizacao"
  | "NfeRetAutorizacao"
  | "NfeStatusServico"
  | "NfeConsultaProtocolo"
  | "RecepcaoEvento"
  | "NfeInutilizacao";

interface UFConfig {
  autorizador: string;      // Nome do autorizador (ex.: SVRS, SP)
  cUF: string;              // Código IBGE (2 dígitos)
  endpoints: Record<Ambiente, Partial<Record<NFeService, string>>>;
}

// Base URLs comuns (SVRS atende a maioria dos estados)
const SVRS_HOM: Partial<Record<NFeService, string>> = {
  NfeAutorizacao: "https://nfe-homologacao.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx",
  NfeRetAutorizacao: "https://nfe-homologacao.svrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx",
  NfeStatusServico: "https://nfe-homologacao.svrs.rs.gov.br/ws/NfeStatusServico/NFeStatusServico4.asmx",
  NfeConsultaProtocolo: "https://nfe-homologacao.svrs.rs.gov.br/ws/NfeConsulta/NFeConsultaProtocolo4.asmx",
  RecepcaoEvento: "https://nfe-homologacao.svrs.rs.gov.br/ws/recepcaoevento/recepcaoevento4.asmx",
  NfeInutilizacao: "https://nfe-homologacao.svrs.rs.gov.br/ws/nfeinutilizacao/nfeinutilizacao4.asmx",
};
const SVRS_PROD: Partial<Record<NFeService, string>> = {
  NfeAutorizacao: "https://nfe.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx",
  NfeRetAutorizacao: "https://nfe.svrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx",
  NfeStatusServico: "https://nfe.svrs.rs.gov.br/ws/NfeStatusServico/NFeStatusServico4.asmx",
  NfeConsultaProtocolo: "https://nfe.svrs.rs.gov.br/ws/NfeConsulta/NFeConsultaProtocolo4.asmx",
  RecepcaoEvento: "https://nfe.svrs.rs.gov.br/ws/recepcaoevento/recepcaoevento4.asmx",
  NfeInutilizacao: "https://nfe.svrs.rs.gov.br/ws/nfeinutilizacao/nfeinutilizacao4.asmx",
};
const SP_HOM: Partial<Record<NFeService, string>> = {
  NfeAutorizacao: "https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx",
  NfeRetAutorizacao: "https://homologacao.nfe.fazenda.sp.gov.br/ws/nferetautorizacao4.asmx",
  NfeStatusServico: "https://homologacao.nfe.fazenda.sp.gov.br/ws/nfestatusservico4.asmx",
  NfeConsultaProtocolo: "https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeconsultaprotocolo4.asmx",
  RecepcaoEvento: "https://homologacao.nfe.fazenda.sp.gov.br/ws/nferecepcaoevento4.asmx",
  NfeInutilizacao: "https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeinutilizacao4.asmx",
};
const SP_PROD: Partial<Record<NFeService, string>> = {
  NfeAutorizacao: "https://nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx",
  NfeRetAutorizacao: "https://nfe.fazenda.sp.gov.br/ws/nferetautorizacao4.asmx",
  NfeStatusServico: "https://nfe.fazenda.sp.gov.br/ws/nfestatusservico4.asmx",
  NfeConsultaProtocolo: "https://nfe.fazenda.sp.gov.br/ws/nfeconsultaprotocolo4.asmx",
  RecepcaoEvento: "https://nfe.fazenda.sp.gov.br/ws/nferecepcaoevento4.asmx",
  NfeInutilizacao: "https://nfe.fazenda.sp.gov.br/ws/nfeinutilizacao4.asmx",
};

// Mapa UF → autorizador. Estados SVRS já cobrem a maioria.
const UF_MAP: Record<string, UFConfig> = {
  AC: { autorizador: "SVRS", cUF: "12", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  AL: { autorizador: "SVRS", cUF: "27", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  AP: { autorizador: "SVRS", cUF: "16", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  DF: { autorizador: "SVRS", cUF: "53", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  ES: { autorizador: "SVRS", cUF: "32", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  PB: { autorizador: "SVRS", cUF: "25", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  PI: { autorizador: "SVRS", cUF: "22", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  RJ: { autorizador: "SVRS", cUF: "33", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  RN: { autorizador: "SVRS", cUF: "24", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  RO: { autorizador: "SVRS", cUF: "11", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  RR: { autorizador: "SVRS", cUF: "14", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  RS: { autorizador: "SVRS", cUF: "43", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  SC: { autorizador: "SVRS", cUF: "42", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  SE: { autorizador: "SVRS", cUF: "28", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  TO: { autorizador: "SVRS", cUF: "17", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  // Estados com autorizador próprio
  SP: { autorizador: "SP", cUF: "35", endpoints: { 1: SP_PROD, 2: SP_HOM } },
  // Demais estados com WS próprio (MG, PR, MT, MS, BA, GO, PE, CE, PA, AM, MA) usam SVRS como fallback aqui.
  // Substituir por endpoints oficiais na fase de produção por UF.
  MG: { autorizador: "SVRS", cUF: "31", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  PR: { autorizador: "SVRS", cUF: "41", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  MT: { autorizador: "SVRS", cUF: "51", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  MS: { autorizador: "SVRS", cUF: "50", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  BA: { autorizador: "SVRS", cUF: "29", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  GO: { autorizador: "SVRS", cUF: "52", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  PE: { autorizador: "SVRS", cUF: "26", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  CE: { autorizador: "SVRS", cUF: "23", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  PA: { autorizador: "SVRS", cUF: "15", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  AM: { autorizador: "SVRS", cUF: "13", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
  MA: { autorizador: "SVRS", cUF: "21", endpoints: { 1: SVRS_PROD, 2: SVRS_HOM } },
};

export function getSefazEndpoint(uf: string, ambiente: Ambiente, service: NFeService): string {
  const cfg = UF_MAP[uf.toUpperCase()];
  if (!cfg) throw new Error(`uf_nao_suportada:${uf}`);
  const url = cfg.endpoints[ambiente]?.[service];
  if (!url) throw new Error(`endpoint_indisponivel:${uf}:${service}:${ambiente}`);
  return url;
}

export function getCUF(uf: string): string {
  const cfg = UF_MAP[uf.toUpperCase()];
  if (!cfg) throw new Error(`uf_nao_suportada:${uf}`);
  return cfg.cUF;
}

export function listUFs(): string[] {
  return Object.keys(UF_MAP);
}
