
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  TrendingUp, 
  Calculator, 
  RefreshCcw,
  Activity,
  ShieldCheck,
  LogOut,
  Lock,
  User
} from 'lucide-react';
import { Asset, PortfolioItem } from './types';
import { INITIAL_PORTFOLIO, B3_SUGGESTIONS } from './constants';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import Market from './components/Market';
import Simulator from './components/Simulator';
import { fetchRealMarketData } from './services/market';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('b3_auth') === 'true';
  });
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [marketAssets, setMarketAssets] = useState<Asset[]>(B3_SUGGESTIONS.slice(0, 15));
  const [sources, setSources] = useState<{title: string, uri: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as any;
    if (form.username.value === 'admin' && form.password.value === '1234') {
      setIsAuthenticated(true);
      localStorage.setItem('b3_auth', 'true');
    } else {
      alert("Credenciais inválidas! Use admin / 1234");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('b3_auth');
  };

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
    if (isSyncing || !isAuthenticated) return;
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
              updated.push(realAsset as Asset);
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
  }, [isSyncing, marketAssets, portfolio, isAuthenticated]);

  useEffect(() => {
    if (!loading && isAuthenticated) syncAllAssets();
  }, [loading, isAuthenticated]);

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

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 p-6">
        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center">
            <div className="inline-flex p-4 bg-indigo-600 rounded-3xl mb-6 shadow-2xl shadow-indigo-600/40">
              <TrendingUp size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white">B3 Master</h1>
            <p className="text-slate-500 mt-2 font-medium">Faça login para gerenciar seus ativos</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 backdrop-blur-xl">
            <div className="relative">
              <User className="absolute left-4 top-4 text-slate-500" size={20} />
              <input name="username" type="text" placeholder="Usuário" className="w-full p-4 pl-12 bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-white font-bold" required />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-4 text-slate-500" size={20} />
              <input name="password" type="password" placeholder="Senha" className="w-full p-4 pl-12 bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-white font-bold" required />
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all">
              Entrar no Terminal
            </button>
            <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">Acesso padrão: admin / 1234</p>
          </form>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <RefreshCcw className="animate-spin text-indigo-500" size={40} />
    </div>
  );

  return (
    <Router>
      <div className="flex flex-col lg:flex-row h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 bg-slate-900/40 border-r border-slate-800 p-8 shrink-0">
          <div className="flex items-center gap-3 mb-12">
            <TrendingUp size={28} className="text-indigo-500" />
            <h1 className="text-2xl font-black uppercase tracking-tighter">B3 Master</h1>
          </div>
          
          <nav className="flex-1 space-y-2">
            <SidebarLink to="/" icon={<LayoutDashboard size={20} />} label="Resumo" />
            <SidebarLink to="/portfolio" icon={<Wallet size={20} />} label="Carteira" />
            <SidebarLink to="/market" icon={<Activity size={20} />} label="Mercado" />
            <SidebarLink to="/simulator" icon={<Calculator size={20} />} label="Simulador" />
          </nav>

          <div className="mt-auto space-y-4">
            <button 
              onClick={handleLogout}
              className="w-full py-3 flex items-center justify-center gap-2 text-slate-500 hover:text-rose-400 font-bold uppercase text-[10px] tracking-widest"
            >
              <LogOut size={14} /> Sair do App
            </button>
            <button 
              onClick={syncAllAssets} 
              disabled={isSyncing}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg"
            >
              <RefreshCcw size={14} className={isSyncing ? 'animate-spin' : ''} />
            </button>
          </div>
        </aside>

        {/* Mobile Nav */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <h1 className="text-sm font-black uppercase tracking-tighter">B3 Master</h1>
          <button onClick={handleLogout} className="text-slate-500"><LogOut size={18} /></button>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 lg:pb-0 custom-scrollbar">
          <div className="max-w-6xl mx-auto p-6 md:p-10 lg:p-16">
            <Routes>
              <Route path="/" element={<Dashboard portfolio={portfolio} marketAssets={marketAssets} cashBalance={0} />} />
              <Route path="/portfolio" element={<Portfolio portfolio={portfolio} onRemove={removeAssetFromPortfolio} onAdd={addAssetToPortfolio} marketAssets={marketAssets} />} />
              <Route path="/market" element={<Market marketAssets={marketAssets} sources={sources} />} />
              <Route path="/simulator" element={<Simulator portfolio={portfolio} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-2 py-3 flex justify-around items-center z-50">
          <MobileNavLink to="/" icon={<LayoutDashboard size={22} />} label="Início" />
          <MobileNavLink to="/portfolio" icon={<Wallet size={22} />} label="Carteira" />
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
    <Link to={to} className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${isActive ? 'bg-indigo-600 text-white font-bold' : 'text-slate-500 hover:bg-slate-800/60'}`}>
      {icon} <span className="text-sm">{label}</span>
    </Link>
  );
};

const MobileNavLink: React.FC<{to: string, icon: any, label: string}> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex flex-col items-center gap-1 min-w-[60px] ${isActive ? 'text-indigo-400' : 'text-slate-600'}`}>
      {icon}
      <span className="text-[9px] font-black uppercase">{label}</span>
    </Link>
  );
};

export default App;
