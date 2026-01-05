
import { Asset, AssetType, PortfolioItem } from "../types";

/**
 * BUSCA DE DADOS DE MERCADO (Yahoo Finance API)
 */
export async function fetchRealMarketData(symbols: string[]) {
  if (symbols.length === 0) return { data: [], sources: [] };
  
  try {
    const yahooSymbols = symbols.map(s => s.endsWith('.SA') ? s : `${s}.SA`).join(',');
    const proxyUrl = `https://api.allorigins.win/raw?url=`;
    const targetUrl = encodeURIComponent(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooSymbols}`);
    
    const response = await fetch(`${proxyUrl}${targetUrl}`);
    if (!response.ok) throw new Error("Erro na rede");
    
    const json = await response.json();
    const results = json?.quoteResponse?.result || [];
    
    const data = results.map((res: any) => ({
      symbol: res.symbol.replace('.SA', ''),
      price: res.regularMarketPrice || 0,
      change: res.regularMarketChangePercent || 0,
      name: res.longName || res.shortName || res.symbol,
      yield: (res.trailingAnnualDividendYield) || 0,
      lastDividendValue: res.trailingAnnualDividendRate || 0,
      nextPaymentDate: "" 
    }));

    return { 
      data, 
      sources: [{ title: "B3 / Yahoo Finance", uri: "https://finance.yahoo.com" }] 
    };
  } catch (error) {
    console.error("Erro ao buscar mercado:", error);
    return { data: [], sources: [] };
  }
}

export async function searchAssetDetails(symbol: string): Promise<Asset | null> {
  try {
    const cleanSymbol = symbol.trim().toUpperCase().replace('.SA', '');
    if (!cleanSymbol) return null;

    const proxyUrl = `https://api.allorigins.win/raw?url=`;
    const targetUrl = encodeURIComponent(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${cleanSymbol}.SA`);
    
    const response = await fetch(`${proxyUrl}${targetUrl}`);
    const json = await response.json();
    const res = json?.quoteResponse?.result?.[0];

    if (!res) return null;

    return {
      symbol: cleanSymbol,
      name: res.longName || res.shortName || cleanSymbol,
      price: res.regularMarketPrice || 0,
      type: cleanSymbol.length === 6 ? AssetType.FII : AssetType.STOCK,
      change: res.regularMarketChangePercent || 0,
      yield: res.trailingAnnualDividendYield || 0,
      lastDividendValue: res.trailingAnnualDividendRate || 0,
      nextPaymentDate: ""
    };
  } catch (e) {
    return null;
  }
}

/**
 * MOTOR ESTRATÉGICO B3 (Substitui a IA Gemini)
 * Analisa a carteira localmente e gera insights baseados em métricas financeiras.
 */
export function getPortfolioAdvice(portfolio: PortfolioItem[]) {
  if (portfolio.length === 0) return { text: "Adicione ativos para receber uma análise estratégica da sua carteira." };
  
  const stocks = portfolio.filter(p => p.asset.type === AssetType.STOCK);
  const fiis = portfolio.filter(p => p.asset.type === AssetType.FII);
  const totalValue = portfolio.reduce((acc, p) => acc + (p.quantity * p.asset.price), 0);
  
  const stockWeight = stocks.reduce((acc, p) => acc + (p.quantity * p.asset.price), 0) / totalValue;
  const fiiWeight = fiis.reduce((acc, p) => acc + (p.quantity * p.asset.price), 0) / totalValue;

  // Lógica de Insights
  if (stockWeight > 0.8) {
    return { text: "Sua carteira está muito exposta a Ações. Considere aumentar a posição em FIIs para reduzir a volatilidade e gerar renda passiva mensal." };
  }
  if (fiiWeight > 0.8) {
    return { text: "Foco total em FIIs! Ótimo para renda, mas não esqueça que Ações podem oferecer maior potencial de crescimento de capital a longo prazo." };
  }
  if (portfolio.length < 5) {
    return { text: "A diversificação é o único 'almoço grátis' no mercado financeiro. Considere adicionar mais setores para proteger seu patrimônio." };
  }
  
  const highYielders = portfolio.filter(p => (p.asset.yield || 0) > 0.10);
  if (highYielders.length > 0) {
    return { text: `Você possui ativos de alto Yield como ${highYielders[0].asset.symbol}. Reinvista esses dividendos para acelerar o efeito dos juros compostos.` };
  }

  return { text: "Sua carteira parece bem equilibrada. Continue mantendo aportes constantes e foque no longo prazo." };
}

export function getSimulationInsight(total: number, aporte: number, anos: number) {
  if (total > 1000000) {
    return `Com este planejamento, você alcançará o patamar de Milionário em ${anos} anos. A disciplina é sua maior aliada.`;
  }
  if (aporte > 2000) {
    return `Seus aportes de R$ ${aporte} são agressivos! Isso reduzirá drasticamente o tempo necessário para sua liberdade financeira.`;
  }
  return `O segredo não é quanto você ganha, mas quanto você aporta. Em ${anos} anos, seu esforço será recompensado.`;
}
