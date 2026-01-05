
import { Asset, AssetType, PortfolioItem } from "../types";

/**
 * SCRAPER STATUSINVEST
 * Captura dados reais diretamente do HTML do site StatusInvest
 */
async function scrapeStatusInvest(symbol: string): Promise<Partial<Asset> | null> {
  const isFii = symbol.endsWith('11') && symbol.length >= 5;
  const category = isFii ? 'fundos-imobiliarios' : 'acoes';
  const url = `https://statusinvest.com.br/${category}/${symbol.toLowerCase()}`;
  
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const html = await response.text();

    // Regex para extrair Preço Atual
    const priceMatch = html.match(/title="Valor atual">[\s\S]*?<strong class="value">([\d,.]+)<\/strong>/);
    // Regex para extrair Dividend Yield
    const yieldMatch = html.match(/title="Dividend Yield">[\s\S]*?<strong class="value">([\d,.]+)<\/strong>/);
    // Regex para extrair Nome da Empresa/Fundo
    const nameMatch = html.match(/<h1 class="lh-4">([\s\S]*?)<small>/);
    // Regex para Variação (Dia)
    const changeMatch = html.match(/<span>Variação \(dia\)<\/span>[\s\S]*?<b class="[^"]*">([\d,.-]+)%<\/b>/);

    if (!priceMatch) return null;

    const price = parseFloat(priceMatch[1].replace('.', '').replace(',', '.'));
    const dy = yieldMatch ? parseFloat(yieldMatch[1].replace(',', '.')) / 100 : 0;
    const name = nameMatch ? nameMatch[1].trim() : symbol;
    const change = changeMatch ? parseFloat(changeMatch[1].replace(',', '.')) : 0;

    return {
      symbol: symbol.toUpperCase(),
      name,
      price,
      yield: dy,
      change,
      type: isFii ? AssetType.FII : AssetType.STOCK
    };
  } catch (error) {
    console.error(`Erro ao scrapar ${symbol}:`, error);
    return null;
  }
}

/**
 * BUSCA DE DADOS DE MERCADO (StatusInvest Scraper)
 */
export async function fetchRealMarketData(symbols: string[]) {
  if (symbols.length === 0) return { data: [], sources: [] };
  
  // Para evitar lentidão extrema e bloqueio de proxy, limitamos a 8 ativos por vez 
  // priorizando os primeiros da lista (geralmente os da carteira)
  const symbolsToFetch = symbols.slice(0, 10);
  const results = await Promise.all(symbolsToFetch.map(s => scrapeStatusInvest(s)));
  
  const data = results.filter((r): r is Asset => r !== null);

  return { 
    data, 
    sources: [{ title: "StatusInvest (Real-time Scraping)", uri: "https://statusinvest.com.br" }] 
  };
}

export async function searchAssetDetails(symbol: string): Promise<Asset | null> {
  const result = await scrapeStatusInvest(symbol);
  return result as Asset || null;
}

/**
 * MOTOR ESTRATÉGICO B3 (Local)
 */
export function getPortfolioAdvice(portfolio: PortfolioItem[]) {
  if (portfolio.length === 0) return { text: "Adicione ativos para receber uma análise estratégica da sua carteira." };
  
  const stocks = portfolio.filter(p => p.asset.type === AssetType.STOCK);
  const fiis = portfolio.filter(p => p.asset.type === AssetType.FII);
  const totalValue = portfolio.reduce((acc, p) => acc + (p.quantity * p.asset.price), 0);
  
  if (totalValue === 0) return { text: "Aguardando atualização de preços para análise..." };

  const stockWeight = stocks.reduce((acc, p) => acc + (p.quantity * p.asset.price), 0) / totalValue;
  const fiiWeight = fiis.reduce((acc, p) => acc + (p.quantity * p.asset.price), 0) / totalValue;

  if (stockWeight > 0.7) return { text: "Sua carteira está focada em crescimento (Ações). Considere FIIs para gerar renda mensal isenta." };
  if (fiiWeight > 0.7) return { text: "Foco total em dividendos! Considere Ações de valor para não perder o crescimento do PIB." };
  
  return { text: "Bela diversificação! Sua carteira segue um modelo equilibrado entre renda e crescimento." };
}

export function getSimulationInsight(total: number, aporte: number, anos: number) {
  return `O tempo é o senhor da razão. Com R$ ${aporte.toLocaleString()} mensais, você terá um império em ${anos} anos.`;
}
