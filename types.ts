
export enum AssetType {
  STOCK = 'Ação',
  FII = 'FII',
  CRYPTO = 'Cripto',
  FIXED_INCOME = 'Renda Fixa'
}

export interface Asset {
  symbol: string;
  name: string;
  type: AssetType;
  price: number;
  change: number;
  yield?: number; // Dividend Yield %
  lastDividendValue?: number; // Valor em R$ por cota
  nextPaymentDate?: string; // Data do próximo pagamento (YYYY-MM-DD)
}

export interface PortfolioItem {
  id: string;
  asset: Asset;
  quantity: number;
  averagePrice: number;
  purchaseDate: string;
}

export interface MarketHistory {
  time: string;
  value: number;
}

export interface SimulationResults {
  labels: string[];
  totalInvested: number[];
  totalWithInterest: number[];
}
