
import React, { useState, useMemo } from 'react';
import { PortfolioItem, Asset, AssetType } from '../types';
import { Plus, Trash2, Search, X, Loader2, Zap, AlertCircle, Building2, TrendingUp as StockIcon, Coins, Calendar } from 'lucide-react';
import { searchAssetDetails } from '../services/gemini';
import { B3_SUGGESTIONS } from '../constants';

interface PortfolioProps {
  portfolio: PortfolioItem[];
  onRemove: (id: string) => void;
  onAdd: (asset: Asset, quantity: number, price: number) => void;
  marketAssets: Asset[];
}

const Portfolio: React.FC<PortfolioProps> = ({ portfolio, onRemove, onAdd, marketAssets }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchingReal, setIsSearchingReal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [quantityInput, setQuantityInput] = useState('');
  const [priceInput, setPriceInput] = useState('');

  const filteredSuggestions = useMemo(() => {
    if (!searchTerm) return [];
    return B3_SUGGESTIONS.filter(s => 
      s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 6);
  }, [searchTerm]);

  const handleSelectSuggestion = (asset: Asset) => {
    setSelectedAsset(asset);
    setSearchTerm(asset.symbol);
    setPriceInput(asset.price.toString());
    setShowSuggestions(false);
  };

  const handleSearchClick = async () => {
    if (!searchTerm) return;
    setIsSearchingReal(true);
    setShowSuggestions(false);
    const result = await searchAssetDetails(searchTerm.toUpperCase());
    if (result) {
      setSelectedAsset(result);
      setPriceInput(result.price.toString());
    } else {
      alert("Ativo não encontrado na B3 via busca IA.");
    }
    setIsSearchingReal(false);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantityInput);
    const prc = parseFloat(priceInput);
    
    if (selectedAsset && !isNaN(qty) && !isNaN(prc) && qty > 0) {
      onAdd(selectedAsset, qty, prc);
      setIsAdding(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setSelectedAsset(null);
    setSearchTerm('');
    setQuantityInput('');
    setPriceInput('');
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">Minha Carteira</h2>
          <p className="text-slate-400">Detalhamento de Proventos e Custos</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
        >
          <Plus size={18} /> Novo Ativo
        </button>
      </div>

      <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-500 text-[9px] uppercase tracking-[0.2em] font-black border-b border-slate-800">
              <th className="px-8 py-6">Ativo / Tipo</th>
              <th className="px-6 py-6">Qtd</th>
              <th className="px-6 py-6">Preço / Var</th>
              <th className="px-6 py-6">Quanto Paga (R$)</th>
              <th className="px-6 py-6">Data Pagto.</th>
              <th className="px-6 py-6">Patrimônio</th>
              <th className="px-8 py-6 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {portfolio.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-8 py-24 text-center">
                  <div className="flex flex-col items-center gap-4 text-slate-500">
                    <AlertCircle size={48} className="opacity-10" />
                    <p className="font-bold">Sua carteira está vazia.</p>
                  </div>
                </td>
              </tr>
            ) : (
              portfolio.map((item) => {
                const currentAsset = marketAssets.find(a => a.symbol === item.asset.symbol) || item.asset;
                const currentValue = item.quantity * currentAsset.price;

                return (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-black text-indigo-400 text-xs border border-slate-700">
                          {item.asset.symbol.slice(0, 4)}
                        </div>
                        <div>
                          <p className="font-bold text-sm group-hover:text-indigo-400 transition-colors">{item.asset.symbol}</p>
                          <p className="text-[9px] text-slate-600 uppercase font-black">{item.asset.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-mono text-xs font-black">{item.quantity}</td>
                    <td className="px-6 py-6">
                      <p className="font-mono text-sm font-black">R$ {currentAsset.price.toFixed(2)}</p>
                      <span className={`text-[10px] font-black ${currentAsset.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {currentAsset.change >= 0 ? '▲' : '▼'} {Math.abs(currentAsset.change || 0).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      {currentAsset.lastDividendValue ? (
                        <div>
                          <p className="text-xs font-black text-emerald-400">R$ {currentAsset.lastDividendValue.toFixed(2)} /cota</p>
                          <p className="text-[9px] text-slate-600 font-bold uppercase">Último Provendo</p>
                        </div>
                      ) : <span className="text-slate-700 text-xs">-</span>}
                    </td>
                    <td className="px-6 py-6">
                       {currentAsset.nextPaymentDate ? (
                         <div className="flex items-center gap-2">
                            <Calendar size={12} className="text-indigo-500" />
                            <span className="text-xs font-bold text-slate-300">
                               {new Date(currentAsset.nextPaymentDate).toLocaleDateString('pt-BR')}
                            </span>
                         </div>
                       ) : <span className="text-slate-700 text-xs">Indefinida</span>}
                    </td>
                    <td className="px-6 py-6 font-black text-sm text-indigo-100">
                      R$ {currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button onClick={() => onRemove(item.id)} className="p-2.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
              <h3 className="text-xl font-bold uppercase tracking-tight">Novo Investimento</h3>
              <button onClick={() => { setIsAdding(false); resetForm(); }} className="p-2 hover:bg-slate-700 rounded-full"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-8 space-y-6">
              <div className="space-y-2 relative">
                <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Ativo (Ticker)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-4 text-slate-500" size={18} />
                    <input 
                      type="text" 
                      placeholder="PETR4, MXRF11..." 
                      className="w-full pl-12 pr-4 py-4 bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-bold text-sm"
                      value={searchTerm}
                      onFocus={() => setShowSuggestions(true)}
                      onChange={(e) => { setSearchTerm(e.target.value); setSelectedAsset(null); setShowSuggestions(true); }}
                    />
                    
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                        {filteredSuggestions.map((asset) => (
                          <button key={asset.symbol} type="button" onClick={() => handleSelectSuggestion(asset)} className="w-full px-5 py-3 flex items-center justify-between hover:bg-indigo-600 transition-colors border-b border-slate-700/50 last:border-none">
                            <div className="flex items-center gap-3">
                              {asset.type === AssetType.FII ? <Building2 size={14} /> : <StockIcon size={14} />}
                              <div className="text-left">
                                <p className="font-black text-xs">{asset.symbol}</p>
                                <p className="text-[10px] opacity-70">{asset.name}</p>
                              </div>
                            </div>
                            <p className="text-[10px] font-black">DY: {((asset.yield || 0) * 100).toFixed(1)}%</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={handleSearchClick} disabled={isSearchingReal || !searchTerm} className="px-5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl transition-all shadow-lg shadow-indigo-600/20">
                    {isSearchingReal ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                  </button>
                </div>
              </div>

              {selectedAsset ? (
                <div className="p-5 bg-emerald-600/10 border border-emerald-500/30 rounded-3xl animate-in slide-in-from-top-2">
                   <div className="flex justify-between items-center">
                    <div>
                      <p className="font-black text-lg">{selectedAsset.symbol}</p>
                      <p className="text-xs text-slate-400">Quanto Paga: R$ {selectedAsset.lastDividendValue?.toFixed(2) || '0.00'}</p>
                    </div>
                    <p className="text-xl font-black">R$ {selectedAsset.price.toFixed(2)}</p>
                  </div>
                </div>
              ) : searchTerm && !showSuggestions && <div className="p-4 bg-slate-800/50 rounded-2xl text-xs text-slate-500 flex items-center gap-2 italic"><Search size={14} /> Busque na B3 Oficial via IA...</div>}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Quantidade</label>
                  <input type="text" placeholder="0" className="w-full p-4 bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black" value={quantityInput} onChange={(e) => { const val = e.target.value; if (val === '' || /^\d*\.?\d*$/.test(val)) setQuantityInput(val); }} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Preço Pago</label>
                  <input type="text" placeholder="0.00" className="w-full p-4 bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black" value={priceInput} onChange={(e) => { const val = e.target.value; if (val === '' || /^\d*\.?\d*$/.test(val)) setPriceInput(val); }} />
                </div>
              </div>

              <button type="submit" disabled={!selectedAsset || !quantityInput || !priceInput} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-600/30">Salvar na Carteira</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
