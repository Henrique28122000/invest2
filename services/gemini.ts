
import { GoogleGenAI } from "@google/genai";
import { Asset, AssetType } from "../types";

// Função utilitária para limpar o JSON retornado pela IA (remove blocos de markdown)
const cleanAIResponse = (text: string) => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

/**
 * Busca dados reais de qualquer ticker da B3 incluindo proventos exatos.
 */
export async function searchAssetDetails(symbol: string): Promise<Asset | null> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Aja como um terminal financeiro B3. Busque agora para o ticker ${symbol}:
  1. Cotação atual (R$).
  2. Último dividendo ou rendimento (valor exato em R$ por cota).
  3. Data de pagamento deste último ou do próximo previsto.
  4. Nome oficial e tipo (Ação ou FII).
  
  Retorne EXCLUSIVAMENTE um JSON sem explicações: 
  {
    "symbol": "${symbol.toUpperCase()}", 
    "name": "Nome", 
    "price": 0.00, 
    "type": "Ação", 
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

    const text = cleanAIResponse(response.text || "");
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return {
        symbol: data.symbol.toUpperCase(),
        name: data.name || data.symbol,
        price: Number(data.price) || 0,
        type: String(data.type).toLowerCase().includes('fii') ? AssetType.FII : AssetType.STOCK,
        change: Number(data.change) || 0,
        yield: Number(data.yield) || 0,
        lastDividendValue: Number(data.lastDividendValue) || 0,
        nextPaymentDate: data.nextPaymentDate || ""
      };
    }
    return null;
  } catch (error) {
    console.error("Erro na busca real:", error);
    return null;
  }
}

/**
 * Sincroniza proventos e cotações para múltiplos ativos de uma vez.
 */
export async function fetchRealMarketData(symbols: string[]) {
  const apiKey = process.env.API_KEY;
  if (!apiKey || symbols.length === 0) return { data: [], sources: [] };
  
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Forneça dados atuais para: ${symbols.join(', ')}.
  Para cada um, preciso de: preço (R$), variação (%), dividend yield (decimal), valor do último dividendo pago (R$) e data do próximo/último pagamento (YYYY-MM-DD).
  Retorne EXCLUSIVAMENTE um array JSON: [{"symbol": "TICKER", "price": 0.00, "change": 0.0, "yield": 0.0, "lastDividendValue": 0.00, "nextPaymentDate": "YYYY-MM-DD"}]`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    const text = cleanAIResponse(response.text || "[]");
    const jsonMatch = text.match(/\[.*\]/s);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || 'B3 Market Data',
      uri: chunk.web?.uri || '#'
    })) || [];

    return { data, sources };
  } catch (error) {
    console.error("Erro fetchRealMarketData:", error);
    return { data: [], sources: [] };
  }
}

export async function getPortfolioAdvice(portfolio: any[]) {
  const apiKey = process.env.API_KEY;
  if (!apiKey || portfolio.length === 0) return { text: "Adicione ativos para análise de proventos." };
  
  const ai = new GoogleGenAI({ apiKey });

  const summary = portfolio.map(p => `${p.asset.symbol}: ${p.quantity} cotas`).join(', ');
  const prompt = `Como analista da B3, avalie esta carteira focada em dividendos: ${summary}. Cite o potencial de renda passiva e se há concentração perigosa. Seja breve e encorajador.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return { text: response.text || "Monitorando seus dividendos..." };
  } catch {
    return { text: "A IA está processando as datas de corte da B3..." };
  }
}

export async function getSimulationInsight(total: number, aporte: number, anos: number) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "A estratégia de reinvestimento de dividendos acelera o seu patrimônio.";
  
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Explique brevemente o 'Efeito Bola de Neve' de dividendos para um capital de R$${total} e aportes de R$${aporte} em ${anos} anos. Foque em como os proventos comprando novas cotas reduzem o tempo para a independência financeira.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Os juros compostos são a oitava maravilha do mundo.";
  } catch {
    return "Reinvestir dividendos é o segredo dos grandes investidores da B3.";
  }
}
