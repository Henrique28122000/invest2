
import { GoogleGenAI } from "@google/genai";
import { Asset, AssetType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Busca dados reais de qualquer ticker da B3 incluindo proventos exatos.
 */
export async function searchAssetDetails(symbol: string): Promise<Asset | null> {
  const prompt = `Aja como um terminal financeiro Bloomberg. Busque agora:
  1. Cotação atual da B3 para ${symbol}.
  2. Último dividendo/rendimento pago (valor em R$).
  3. Data prevista do próximo pagamento.
  
  Retorne EXCLUSIVAMENTE um JSON: 
  {
    "symbol": "${symbol.toUpperCase()}", 
    "name": "Nome da Empresa/Fundo", 
    "price": 0.00, 
    "type": "Ação" ou "FII", 
    "change": 0.0, 
    "yield": 0.0, 
    "lastDividendValue": 0.00,
    "nextPaymentDate": "YYYY-MM-DD"
  }`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return {
        symbol: data.symbol.toUpperCase(),
        name: data.name,
        price: Number(data.price),
        type: data.type.includes('FII') ? AssetType.FII : AssetType.STOCK,
        change: Number(data.change || 0),
        yield: Number(data.yield || 0),
        lastDividendValue: Number(data.lastDividendValue || 0),
        nextPaymentDate: data.nextPaymentDate
      };
    }
    return null;
  } catch (error) {
    console.error("Erro na busca real:", error);
    return null;
  }
}

/**
 * Sincroniza proventos e cotações para múltiplos ativos.
 */
export async function fetchRealMarketData(symbols: string[]) {
  const prompt = `Para os ativos B3: ${symbols.join(', ')}, retorne um array JSON com cotação atual, variação, dividend yield, o valor do último dividendo pago (R$) e a data do próximo pagamento.
  Formato: [{"symbol": "TICKER", "price": 0.00, "change": 0.0, "yield": 0.0, "lastDividendValue": 0.00, "nextPaymentDate": "YYYY-MM-DD"}]`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    const text = response.text || "[]";
    const jsonMatch = text.match(/\[.*\]/s);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || 'B3 Info',
      uri: chunk.web?.uri || '#'
    })) || [];

    return { data, sources };
  } catch (error) {
    return { data: [], sources: [] };
  }
}

export async function getPortfolioAdvice(portfolio: any[]) {
  if (portfolio.length === 0) return { text: "Adicione ativos para análise." };
  const summary = portfolio.map(p => `${p.asset.symbol}: ${p.quantity} unidades`).join(', ');
  const prompt = `Analise esta carteira B3 focando em geração de renda mensal e dividendos: ${summary}. Dê uma dica curta de rebalanceamento ou oportunidade.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return { text: response.text };
  } catch {
    return { text: "A IA está monitorando os proventos da sua carteira..." };
  }
}

export async function getSimulationInsight(total: number, aporte: number, anos: number) {
  const prompt = `Mostre o efeito bola de neve de R$${total} + R$${aporte}/mês em ${anos} anos na B3, focando em como os dividendos aceleram a liberdade financeira.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch {
    return "Reinvestir dividendos é o segredo do crescimento exponencial.";
  }
}
