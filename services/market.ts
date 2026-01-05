
import { Asset, AssetType, PortfolioItem } from "../types";

const BRAPI_URL = "https://brapi.dev/api/quote";

/**
 * BUSCA DE DADOS VIA BRAPI (Estável e Profissional)
 */
export async function fetchRealMarketData(symbols: string[]) {
  if (symbols.length === 0) return { data: [], sources: [] };
  
  try {
    // A Brapi permite múltiplos tickers separados por vírgula
    const tickers = symbols.map(s => s.toUpperCase()).join(',');
    const response = await fetch(`${BRAPI_URL}/${tickers}?token=`); // Token vazio funciona para consultas básicas
    const json = await response.json();
    
    if (!json.results) throw new Error("Sem resultados");

    const data = json.results.map((res: any) => ({
      symbol: res.symbol,
      price: res.regularMarketPrice || 0,
      change: res.regularMarketChangePercent || 0,
      name: res.longName || res.shortName || res.symbol,
      yield: (res.dividendYield / 100) || 0,
      lastDividendValue: res.lastDividend || 0,
      nextPaymentDate: "",
      type: res.symbol.endsWith('11') ? AssetType.FII : AssetType.STOCK
    }));

    return { 
      data, 
      sources: [{ title: "Brapi / B3", uri: "https://brapi.dev" }] 
    };
  } catch (error) {
    console.warn("Brapi falhou, usando fallback de constantes...");
    return { data: [], sources: [] };
  }
}

export async function searchAssetDetails(symbol: string): Promise<Asset | null> {
  try {
    const response = await fetch(`${BRAPI_URL}/${symbol.toUpperCase()}`);
    const json = await response.json();
    const res = json.results?.[0];

    if (!res) return null;

    return {
      symbol: res.symbol,
      name: res.longName || res.shortName || res.symbol,
      price: res.regularMarketPrice || 0,
      type: res.symbol.endsWith('11') ? AssetType.FII : AssetType.STOCK,
      change: res.regularMarketChangePercent || 0,
      yield: (res.dividendYield / 100) || 0,
      lastDividendValue: res.lastDividend || 0
    };
  } catch (e) {
    return null;
  }
}

export function getPortfolioAdvice(portfolio: PortfolioItem[]) {
  if (portfolio.length === 0) return { text: "Adicione ativos para receber uma análise estratégica da sua carteira." };
  
  const totalValue = portfolio.reduce((acc, p) => acc + (p.quantity * p.asset.price), 0);
  if (totalValue === 0) return { text: "Aguardando dados de mercado..." };

  const fiis = portfolio.filter(p => p.asset.type === AssetType.FII);
  const fiiWeight = (fiis.reduce((acc, p) => acc + (p.quantity * p.asset.price), 0) / totalValue) * 100;

  if (fiiWeight < 20) return { text: "Sua carteira tem poucos FIIs. Considere aumentar a exposição para gerar renda passiva mensal estável." };
  if (fiiWeight > 80) return { text: "Foco massivo em FIIs. Excelente para renda, mas lembre-se que ações podem oferecer maior proteção contra inflação no longo prazo." };

  return { text: "Equilíbrio sólido detectado. Continue aportando nos ativos que estão abaixo do seu preço teto." };
}

// Fixed: Corrected 'years' to 'anos' to resolve the 'Cannot find name' error
export function getSimulationInsight(total: number, aporte: number, anos: number) {
  return `O segredo da riqueza não é o timing, é o tempo. Em ${anos} anos, você colherá os frutos da sua disciplina de hoje.`;
}
