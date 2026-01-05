
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  TrendingUp, 
  Calculator, 
  User, 
  RefreshCcw,
  Zap,
  Activity,
  CheckCircle2,
  Coins,
  AlertTriangle
} from 'lucide-react';
import { Asset, PortfolioItem } from './types';
import { MOCK_ASSETS, INITIAL_PORTFOLIO, B3_SUGGESTIONS } from './constants';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import Market from './components/Market';
import Simulator from './components/Simulator';
import { fetchRealMarketData } from './services/gemini';

const App: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [marketAssets, setMarketAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [sources, setSources] = useState<{title: string, uri: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  // Inicialização segura com tratamento de erro para evitar tela preta
  useEffect(() => {
    try {
      const initialized = INITIAL_PORTFOLIO.map(item => {
        const asset = B3_SUGGESTIONS.find(a => a.symbol === item.symbol) || 
                      MOCK_ASSETS.find(a => a.symbol === item.symbol);
        
        if (!asset) return null;
        
        const { symbol, ...props } = item as any;
        return { ...props, asset } as PortfolioItem;
      }).filter((item): item is PortfolioItem => item !== null);

      setPortfolio(initialized);
      
      // Verifica se a API KEY existe (exigência do ambiente Vercel)
      if (!process.env.API_KEY) {
        console.warn("API_KEY não detectada. Algumas funções de IA podem falhar.");
      }

      setLoading(false);
    } catch (err) {
      console.error("Erro na inicialização:", err);
      setError("Falha ao carregar dados iniciais. Tente recarregar a página.");
      setLoading(false);
    }
  }, []);

  // Adiciona um ativo à carteira
  const addAssetToPortfolio = (asset: Asset, quantity: number, averagePrice: number) => {
    const newItem: PortfolioItem = {
      id: Math.random().toString(36).substring(2, 11),
      asset,
      quantity,
      averagePrice,
      purchaseDate: new Date().toISOString().split('T')[0],
    };
    setPortfolio(prev => [...prev, newItem]);
  };

  // Remove um ativo da carteira
  const removeAssetFromPortfolio = (id: string) => {
    setPortfolio(prev => prev.filter(item => item.id !== id));
  };

  const syncAllAssets = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    
    const allSymbols = Array.from(new Set([
      ...marketAssets.map(a => a?.symbol),
      ...portfolio.map(p => p?.asset?.symbol)
    ])).filter((s): s is string => !!s);
    
    if (allSymbols.length === 0) {
      setIsSyncing(false);
      return;
    }

    try {
      const result = await fetchRealMarketData(allSymbols);
      
      if (result.data && result.data.length > 0) {
        setMarketAssets(prev => {
          const updated = [...prev];
          result.data.forEach((realAsset: any) => {
            const index = updated.findIndex(a => a.symbol === realAsset.symbol);
            const assetData = {
              price: Number(realAsset.price) || 0, 
              change: Number(realAsset.change) || 0,
              yield: Number(realAsset.yield) || 0,
              lastDividendValue: Number(realAsset.lastDividendValue) || 0,
              nextPaymentDate: realAsset.nextPaymentDate
            };

            if (index !== -1) {
              updated[index] = { ...updated[index], ...assetData };
            } else {
              const pItem = portfolio.find(p => p.asset.symbol === realAsset.symbol);
              if (pItem) {
                updated.push({ ...pItem.asset, ...assetData });
              }
            }
          });
          return updated;
        });
        setSources(result.sources || []);
        setLastSync(new Date());

        // Processamento de Dividendos (Pagamento no dia)
        const today = new Date().toISOString().split('T')[0];
        let totalReceivedToday = 0;
        
        portfolio.forEach(item => {
          const mAsset = result.data.find((a: any) => a.symbol === item.asset.symbol);
          if (mAsset && mAsset.nextPaymentDate === today && mAsset.lastDividendValue > 0) {
            totalReceivedToday += item.quantity * mAsset.lastDividendValue;
          }
        });

        if (totalReceivedToday > 0) {
          setCashBalance(prev => prev + totalReceivedToday);
        }
      }
    } catch (err) {
      console.error("Erro na sincronização:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!loading && !error && portfolio.length > 0) {
      syncAllAssets();
    }
  }, [loading, error, portfolio.length]);

  // Engine de Preços em tempo real para feedback visual
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSyncing && !loading && !error) {
        setMarketAssets(prev => prev.map(asset => ({
          ...asset,
          price: Math.max(0.01, asset.price + (Math.random() - 0.5) * (asset.price * 0.0001))
        })));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isSyncing, loading, error]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-rose-500 p-8 text-center">
        <div className="max-w-md">
          <AlertTriangle size={48} className="mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Ops! Algo deu errado.</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">Recarregar App</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <RefreshCcw className="animate-spin text-indigo-500" size={40} />
          <p className="text-slate-500 font-black tracking-widest text-xs animate-pulse uppercase">Conectando ao Terminal B3...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex flex-col w-64 bg-slate-900/40 border-r border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-600/30">
              <TrendingUp size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase">B3 Master</h1>
          </div>

          <nav className="flex-1 space-y-2">
            <SidebarLink to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
            <SidebarLink to="/portfolio" icon={<Wallet size={18} />} label="Minha Carteira" />
            <SidebarLink to="/market" icon={<Activity size={18} />} label="Monitor B3" />
            <SidebarLink to="/simulator" icon={<Calculator size={18} />} label="Simulador" />
          </nav>

          <div className="mt-4 p-5 bg-emerald-600/10 rounded-3xl border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Coins size={14} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saldo Dividendos</span>
            </div>
            <p className="text-lg font-black text-emerald-400">R$ {cashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800">
            <button 
              onClick={syncAllAssets}
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-[10px] font-black uppercase text-white transition-all disabled:opacity-50"
            >
              {isSyncing ? <RefreshCcw className="animate-spin" size={14} /> : <Zap size={14} />}
              Atualizar Dados
            </button>
            <p className="text-[9px] text-center text-slate-600 mt-3 font-bold">Última Ref: {lastSync.toLocaleTimeString()}</p>
          </div>
        </aside>

        {/* Mobile Nav Overlay (Simples) */}
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-2 p-2 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl">
           <MobileNavLink to="/" icon={<LayoutDashboard size={20} />} />
           <MobileNavLink to="/portfolio" icon={<Wallet size={20} />} />
           <MobileNavLink to="/market" icon={<Activity size={20} />} />
           <MobileNavLink to="/simulator" icon={<Calculator size={20} />} />
        </div>

        <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
          <div className="max-w-7xl mx-auto p-6 lg:p-12">
            <Routes>
              <Route path="/" element={<Dashboard portfolio={portfolio} marketAssets={marketAssets} cashBalance={cashBalance} />} />
              <Route path="/portfolio" element={<Portfolio portfolio={portfolio} onRemove={removeAssetFromPortfolio} onAdd={addAssetToPortfolio} marketAssets={marketAssets} />} />
              <Route path="/market" element={<Market marketAssets={marketAssets} sources={sources} />} />
              <Route path="/simulator" element={<Simulator portfolio={portfolio} />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
};

const SidebarLink: React.FC<{to: string, icon: any, label: string}> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${isActive ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-slate-800/40'}`}>
      {icon} <span className="text-sm">{label}</span>
    </Link>
  );
};

const MobileNavLink: React.FC<{to: string, icon: any}> = ({ to, icon }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`p-4 rounded-xl transition-all ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
      {icon}
    </Link>
  );
};

export default App;
