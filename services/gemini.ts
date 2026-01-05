
import { GoogleGenAI } from "@google/genai";
import { Asset, AssetType } from "../types";

// Helper para limpar a resposta da IA caso venha com markdown
const cleanAIResponse = (text: string) => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

export async function searchAssetDetails(symbol: string): Promise<Asset | null> {
  // Use process.env.API_KEY directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Aja como um terminal financeiro B3. Busque para o ticker ${symbol}:
  1. Cotação atual (R$).
  2. Último dividendo (valor em R$ por cota).
  3. Data de pagamento.
  4. Nome e tipo (Ação ou FII).
  Retorne EXCLUSIVAMENTE um JSON: 
  {"symbol": "${symbol.toUpperCase()}", "name": "Nome", "price": 0.00, "type": "Ação", "change": 0.0, "yield": 0.0, "lastDividendValue": 0.00, "nextPaymentDate": "YYYY-MM-DD"}`;

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
    console.error("Erro busca real:", error);
    return null;
  }
}

export async function fetchRealMarketData(symbols: string[]) {
  if (symbols.length === 0) return { data: [], sources: [] };
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Dados atuais para: ${symbols.join(', ')}. Retorne array JSON: [{"symbol": "TICKER", "price": 0.00, "change": 0.0, "yield": 0.0, "lastDividendValue": 0.00, "nextPaymentDate": "YYYY-MM-DD"}]`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    const text = cleanAIResponse(response.text || "[]");
    const jsonMatch = text.match(/\[.*\]/s);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    
    // Extract sources from grounding chunks as required by search grounding rules
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || 'B3 Data',
      uri: chunk.web?.uri || '#'
    })) || [];

    return { data, sources };
  } catch (error) {
    console.error("Erro ao buscar dados de mercado:", error);
    return { data: [], sources: [] };
  }
}

export async function getPortfolioAdvice(portfolio: any[]) {
  if (portfolio.length === 0) return { text: "Adicione ativos." };
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const summary = portfolio.map(p => `${p.asset.symbol}`).join(', ');
  const prompt = `Avalie brevemente esta carteira B3 focada em dividendos: ${summary}.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return { text: response.text || "Monitorando..." };
  } catch (error) {
    console.error("Erro ao obter conselhos:", error);
    return { text: "Processando dividendos..." };
  }
}

export async function getSimulationInsight(total: number, aporte: number, anos: number) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Fix: changed 'years' to 'anos' to match the function parameter name
  const prompt = `Efeito bola de neve para R$${total} e aportes de R$${aporte} em ${anos} anos.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Juros compostos são poderosos.";
  } catch (error) {
    console.error("Erro no insight de simulação:", error);
    return "Reinvestir dividendos é o segredo.";
  }
}
