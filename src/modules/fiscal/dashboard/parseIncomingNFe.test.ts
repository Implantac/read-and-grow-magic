import { describe, expect, it } from 'vitest';
import { parseIncomingNFe } from './parseIncomingNFe';

const xml = `<nfeProc><NFe><infNFe Id="NFe${'1'.repeat(44)}"><ide><nNF>24</nNF><serie>1</serie><dhEmi>2026-09-30T10:00:00-03:00</dhEmi></ide><emit><CNPJ>12345678000190</CNPJ><xNome>Fornecedor</xNome></emit><det><prod><cProd>SKU-1</cProd><xProd>Produto</xProd><NCM>12345678</NCM><CFOP>5102</CFOP><uCom>UN</uCom><qCom>2</qCom><vUnCom>10</vUnCom><vProd>20</vProd></prod></det><total><ICMSTot><vNF>20</vNF></ICMSTot></total></infNFe></NFe><protNFe><infProt><chNFe>${'1'.repeat(44)}</chNFe><cStat>100</cStat></infProt></protNFe></nfeProc>`;

describe('leitura de nota de entrada', () => {
  it('lê somente valores reais da nota autorizada', () => {
    const data = parseIncomingNFe(xml);
    expect(data.products[0]).toMatchObject({ code: 'SKU-1', qCom: 2, vProd: 20 });
    expect(data.total).toBe(20);
    expect(data.purchaseOrderId).toBeUndefined();
  });
  it('rejeita XML inválido e notas sem autorização correspondente', () => {
    expect(() => parseIncomingNFe('<invalid>')).toThrow();
    expect(() => parseIncomingNFe(xml.replace('<cStat>100</cStat>', '<cStat>101</cStat>'))).toThrow();
    expect(() => parseIncomingNFe(xml.replace('<chNFe>', '<chNFe>0'))).toThrow();
  });
});