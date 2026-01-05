
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  TrendingUp, 
  Calculator, 
  RefreshCcw,
  Zap,
  Activity,
  Coins,
  AlertTriangle,
  LogOut
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

  useEffect(() => {
    try {
      const initialized = INITIAL_PORTFOLIO.map(item => {
        const asset = B3_SUGGESTIONS.find(a => a.symbol === item.symbol) || 
                      MOCK_ASSETS.find(a => a.symbol === item.symbol);
        
        if (!asset) return null;
        
        return { 
          id: item.id, 
          asset, 
          quantity: item.quantity, 
          averagePrice: item.averagePrice, 
          purchaseDate: item.purchaseDate 
        } as PortfolioItem;
      }).filter((item): item is PortfolioItem => item !== null);

      setPortfolio(initialized);
      setLoading(false);
    } catch (err) {
      setError("Falha ao inicializar banco de dados local.");
      setLoading(false);
    }
  }, []);

  const syncAllAssets = useCallback(async () => {
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
              if (pItem) updated.push({ ...pItem.asset, ...assetData });
            }
          });
          return updated;
        });
        setSources(result.sources || []);
        setLastSync(new Date());

        const todayStr = new Date().toISOString().split('T')[0];
        let dailyEarnings = 0;
        
        portfolio.forEach(item => {
          const mAsset = result.data.find((a: any) => a.symbol === item.asset.symbol);
          if (mAsset && mAsset.nextPaymentDate === todayStr && mAsset.lastDividendValue > 0) {
            dailyEarnings += item.quantity * mAsset.lastDividendValue;
          }
        });

        if (dailyEarnings > 0) {
          setCashBalance(prev => prev + dailyEarnings);
        }
      }
    } catch (err) {
      console.error("Erro na sincronização:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, marketAssets, portfolio]);

  useEffect(() => {
    if (!loading && !error) syncAllAssets();
  }, [loading, error]);

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

  const removeAssetFromPortfolio = (id: string) => {
    setPortfolio(prev => prev.filter(item => item.id !== id));
  };

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-rose-500 text-center p-8">
        <div>
          <AlertTriangle size={64} className="mx-auto mb-6" />
          <h2 className="text-2xl font-black mb-4 uppercase">Erro de Renderização</h2>
          <p className="text-slate-400 mb-8">{error}</p>
          <button onClick={() => window.location.reload()} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase">Tentar Novamente</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-6">
          <RefreshCcw className="animate-spin text-indigo-500" size={64} />
          <p className="text-slate-500 font-black tracking-widest text-xs uppercase animate-pulse">Iniciando Terminal B3...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
        <aside className="hidden lg:flex flex-col w-72 bg-slate-900/50 border-r border-slate-800 p-8">
          <div className="flex items-center gap-3 mb-12 px-2">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl">
              <TrendingUp size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase">B3 Master</h1>
            </div>
          </div>
          <nav className="flex-1 space-y-3">
            <SidebarLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
            <SidebarLink to="/portfolio" icon={<Wallet size={20} />} label="Carteira" />
            <SidebarLink to="/market" icon={<Activity size={20} />} label="Mercado" />
            <SidebarLink to="/simulator" icon={<Calculator size={20} />} label="Simulador" />
          </nav>
          <div className="mt-6 p-6 bg-emerald-600/10 rounded-[2rem] border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Coins size={16} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Saldo Disponível</span>
            </div>
            <p className="text-2xl font-black text-emerald-400">R$ {cashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800">
            <button onClick={syncAllAssets} disabled={isSyncing} className="w-full flex items-center justify-center gap-3 py-4 bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-300">
              {isSyncing ? <RefreshCcw className="animate-spin" size={16} /> : <Zap size={16} />} Atualizar B3
            </button>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto bg-slate-950 pb-32 lg:pb-0 relative">
          <div className="max-w-6xl mx-auto p-8 lg:p-16">
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
    <Link to={to} className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${isActive ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800/40'}`}>
      {icon} <span className="text-sm">{label}</span>
    </Link>
  );
};

const MobileNavLink: React.FC<{to: string, icon: any}> = ({ to, icon }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`p-4 rounded-2xl transition-all ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
      {icon}
    </Link>
  );
};

export default App;
