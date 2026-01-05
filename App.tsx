
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
  Globe,
  ShieldCheck
} from 'lucide-react';
import { Asset, PortfolioItem } from './types';
import { INITIAL_PORTFOLIO, B3_SUGGESTIONS } from './constants';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import Market from './components/Market';
import Simulator from './components/Simulator';
import { fetchRealMarketData } from './services/gemini'; // Nome mantido no import por consistência de ref, mas lógica é nova

const App: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [marketAssets, setMarketAssets] = useState<Asset[]>(B3_SUGGESTIONS.slice(0, 15));
  const [cashBalance] = useState<number>(0);
  const [sources, setSources] = useState<{title: string, uri: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    try {
      const initialized = INITIAL_PORTFOLIO.map(item => {
        const asset = B3_SUGGESTIONS.find(a => a.symbol === item.symbol);
        return asset ? { ...item, asset } as PortfolioItem : null;
      }).filter((item): item is PortfolioItem => item !== null);

      setPortfolio(initialized);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  }, []);

  const syncAllAssets = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    
    const allSymbols = Array.from(new Set([
      ...marketAssets.map(a => a.symbol),
      ...portfolio.map(p => p.asset.symbol)
    ])).filter(Boolean);

    try {
      const result = await fetchRealMarketData(allSymbols);
      if (result.data && result.data.length > 0) {
        setMarketAssets(prev => {
          const updated = [...prev];
          result.data.forEach((realAsset: any) => {
            const index = updated.findIndex(a => a.symbol === realAsset.symbol);
            if (index !== -1) {
              updated[index] = { ...updated[index], ...realAsset };
            } else {
              updated.push(realAsset);
            }
          });
          return updated;
        });
        setSources(result.sources || []);
      }
    } catch (err) {
      console.error("Erro na sincronização:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, marketAssets, portfolio]);

  useEffect(() => {
    if (!loading) syncAllAssets();
  }, [loading]);

  const addAssetToPortfolio = (asset: Asset, quantity: number, averagePrice: number) => {
    const newItem: PortfolioItem = {
      id: Math.random().toString(36).substring(2, 11),
      asset, quantity, averagePrice,
      purchaseDate: new Date().toISOString().split('T')[0],
    };
    setPortfolio(prev => [...prev, newItem]);
  };

  const removeAssetFromPortfolio = (id: string) => {
    setPortfolio(prev => prev.filter(item => item.id !== id));
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4 text-indigo-500">
        <RefreshCcw className="animate-spin" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">B3 Terminal Loading</p>
      </div>
    </div>
  );

  return (
    <Router>
      <div className="flex flex-col lg:flex-row h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 bg-slate-900/40 border-r border-slate-800 p-8 shrink-0">
          <div className="flex items-center gap-3 mb-12">
            <div className="p-2.5 bg-indigo-600 rounded-xl">
              <TrendingUp size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">B3 Master</h1>
          </div>
          
          <nav className="flex-1 space-y-2">
            <SidebarLink to="/" icon={<LayoutDashboard size={20} />} label="Início" />
            <SidebarLink to="/portfolio" icon={<Wallet size={20} />} label="Patrimônio" />
            <SidebarLink to="/market" icon={<Activity size={20} />} label="Cotações" />
            <SidebarLink to="/simulator" icon={<Calculator size={20} />} label="Projeções" />
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-800">
            <div className="p-4 bg-slate-800/40 rounded-2xl mb-4">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span className="text-[9px] font-black uppercase text-slate-500">Motor de Dados</span>
              </div>
              <p className="text-xs font-bold text-slate-300">B3 Online (Yahoo)</p>
            </div>
            <button 
              onClick={syncAllAssets} 
              disabled={isSyncing}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20"
            >
              <RefreshCcw size={14} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Sincronizando' : 'Atualizar Tudo'}
            </button>
          </div>
        </aside>

        {/* Mobile Nav */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
           <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-500" />
            <h1 className="text-sm font-black uppercase tracking-tighter">B3 Master</h1>
          </div>
          <button onClick={syncAllAssets} disabled={isSyncing} className="p-2 bg-slate-800 rounded-xl active:scale-95 transition-transform">
            <RefreshCcw size={16} className={isSyncing ? 'animate-spin text-indigo-400' : 'text-slate-400'} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 lg:pb-0 relative custom-scrollbar">
          <div className="max-w-6xl mx-auto p-6 md:p-10 lg:p-16">
            <Routes>
              <Route path="/" element={<Dashboard portfolio={portfolio} marketAssets={marketAssets} cashBalance={cashBalance} />} />
              <Route path="/portfolio" element={<Portfolio portfolio={portfolio} onRemove={removeAssetFromPortfolio} onAdd={addAssetToPortfolio} marketAssets={marketAssets} />} />
              <Route path="/market" element={<Market marketAssets={marketAssets} sources={sources} />} />
              <Route path="/simulator" element={<Simulator portfolio={portfolio} />} />
            </Routes>
          </div>
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 px-2 py-3 flex justify-around items-center z-50">
          <MobileNavLink to="/" icon={<LayoutDashboard size={22} />} label="Home" />
          <MobileNavLink to="/portfolio" icon={<Wallet size={22} />} label="Ativos" />
          <MobileNavLink to="/market" icon={<Activity size={22} />} label="Bolsa" />
          <MobileNavLink to="/simulator" icon={<Calculator size={22} />} label="Futuro" />
        </nav>
      </div>
    </Router>
  );
};

const SidebarLink: React.FC<{to: string, icon: any, label: string}> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${isActive ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30' : 'text-slate-500 hover:bg-slate-800/60 hover:text-slate-200'}`}>
      {icon} <span className="text-sm">{label}</span>
    </Link>
  );
};

const MobileNavLink: React.FC<{to: string, icon: any, label: string}> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex flex-col items-center gap-1 min-w-[60px] ${isActive ? 'text-indigo-400' : 'text-slate-600'}`}>
      <div className={`${isActive ? 'bg-indigo-500/10 p-2 rounded-xl' : 'p-2'}`}>{icon}</div>
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </Link>
  );
};

export default App;
