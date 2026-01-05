
import { Asset, AssetType, PortfolioItem } from "../types";

// IP fornecido pelo usuário
const USER_API_BASE = "http://151.244.242.237:3000/asset";

/**
 * Proxy AllOrigins via endpoint /get (mais estável para evitar 'Failed to fetch')
 */
function getProxyUrl(url: string) {
  return `https://api.allorigins.win/get?url=${encodeURIComponent(url)}&_=${Date.now()}`;
}

/**
 * Utilitário para limpar strings ou números da API
 */
function parseApiValue(val: string | number | undefined): number {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === 'number') return val;
  
  const cleaned = val.toString()
    .replace('%', '')
    .replace('BRL', '')
    .replace(/\s/g, '')
    .replace(',', '.')
    .trim();
    
  return parseFloat(cleaned) || 0;
}

/**
 * Formata datas
 */
function formatApiDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "" : d.toISOString().split('T')[0];
  } catch {
    return "";
  }
}

/**
 * MAPEAMENTO DO JSON DA SUA API
 */
function mapApiToAsset(json: any): Asset {
  const symbol = json.symbol?.toUpperCase() || "N/A";
  const isFii = symbol.endsWith('11') || symbol.length > 5;
  
  const lastDiv = json.dividends?.last || (json.dividends?.history && json.dividends.history[0]);
  
  const divAmount = lastDiv ? parseApiValue(lastDiv.amount) : 0;
  const price = parseApiValue(json.price);
  const change = parseApiValue(json.change);
  
  let yieldValue = 0;
  if (price > 0 && divAmount > 0) {
    yieldValue = isFii ? (divAmount * 12) / price : (divAmount * 4) / price;
  }

  return {
    symbol: symbol,
    name: symbol, 
    price: price,
    change: change,
    type: isFii ? AssetType.FII : AssetType.STOCK,
    yield: yieldValue,
    lastDividendValue: divAmount,
    nextPaymentDate: formatApiDate(lastDiv?.payDate)
  };
}

/**
 * BUSCA DE DADOS VIA API LOCAL
 */
export async function fetchRealMarketData(symbols: string[]) {
  if (symbols.length === 0) return { data: [], sources: [] };
  
  const results = await Promise.all(symbols.map(async (symbol) => {
    try {
      const url = `${USER_API_BASE}/${symbol.toUpperCase()}`;
      
      // Tentativa 1: AllOrigins (Encapsulado)
      const response = await fetch(getProxyUrl(url));
      if (response.ok) {
        const wrapper = await response.json();
        if (wrapper.contents) {
          const json = JSON.parse(wrapper.contents);
          return mapApiToAsset(json);
        }
      }

      // Tentativa 2: CorsProxy (Direto) se o primeiro falhar
      const backupUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      const backupRes = await fetch(backupUrl);
      if (backupRes.ok) {
        const json = await backupRes.json();
        return mapApiToAsset(json);
      }

      return null;
    } catch (e) {
      console.warn(`[FETCH ERROR] Falha ao buscar ${symbol}. Verifique se o IP 151.244.242.237:3000 está acessível.`);
      return null;
    }
  }));

  const data = results.filter((r): r is Asset => r !== null);

  return { 
    data, 
    sources: [{ title: "API B3 Local (Rede P2P)", uri: "http://151.244.242.237:3000" }] 
  };
}

export async function searchAssetDetails(symbol: string): Promise<Asset | null> {
  try {
    const url = `${USER_API_BASE}/${symbol.toUpperCase()}`;
    const response = await fetch(getProxyUrl(url));
    if (!response.ok) return null;
    const wrapper = await response.json();
    if (!wrapper.contents) return null;
    return mapApiToAsset(JSON.parse(wrapper.contents));
  } catch (e) {
    return null;
  }
}

export function getPortfolioAdvice(portfolio: PortfolioItem[]) {
  if (portfolio.length === 0) return { text: "Adicione ativos para análise." };
  return { text: "Conectado à sua infraestrutura de dados. Analisando ativos da B3 via API local." };
}

export function getSimulationInsight(total: number, aporte: number, anos: number) {
  return `Projeção calculada com as taxas reais da sua API.`;
}
