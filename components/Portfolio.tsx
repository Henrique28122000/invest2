
import React, { useState, useMemo } from 'react';
import { PortfolioItem, Asset, AssetType } from '../types';
import { Plus, Trash2, Search, X, Loader2, Zap, AlertCircle, Building2, TrendingUp as StockIcon, Calendar } from 'lucide-react';
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
    ).slice(0, 5);
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
      alert("Ativo não encontrado.");
    }
    setIsSearchingReal(false);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantityInput);
    const prc = parseFloat(priceInput);
    if (selectedAsset && !isNaN(qty) && !isNaN(prc)) {
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase">Carteira</h2>
          <p className="text-xs md:text-sm text-slate-500">Seus ativos custodiados.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
        >
          <Plus size={16} /> Novo
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="text-slate-500 text-[9px] uppercase tracking-[0.2em] font-black border-b border-slate-800 bg-slate-900/50">
                <th className="px-6 py-5">Ativo</th>
                <th className="px-6 py-5">Qtd</th>
                <th className="px-6 py-5">Cotação</th>
                <th className="px-6 py-5">Prov.</th>
                <th className="px-6 py-5">Próx. Pagto.</th>
                <th className="px-6 py-5 text-right">Patrimônio</th>
                <th className="px-6 py-5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {portfolio.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-20 text-center text-slate-600 font-bold italic text-sm">Vazio. Adicione um ativo para começar.</td></tr>
              ) : (
                portfolio.map((item) => {
                  const currentAsset = marketAssets.find(a => a.symbol === item.asset.symbol) || item.asset;
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center font-black text-indigo-400 text-[10px] border border-slate-700">
                            {item.asset.symbol.slice(0, 4)}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{item.asset.symbol}</p>
                            <p className="text-[8px] text-slate-600 uppercase font-black">{item.asset.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-mono text-xs font-black text-slate-400">{item.quantity}</td>
                      <td className="px-6 py-5">
                        <p className="font-mono text-xs font-black">R$ {currentAsset.price.toFixed(2)}</p>
                        <span className={`text-[9px] font-black ${currentAsset.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {currentAsset.change >= 0 ? '+' : ''}{currentAsset.change.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-6 py-5 text-xs text-emerald-400 font-black">
                        {currentAsset.lastDividendValue ? `R$ ${currentAsset.lastDividendValue.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-6 py-5">
                         <span className="text-[10px] font-bold text-slate-500">
                           {currentAsset.nextPaymentDate ? new Date(currentAsset.nextPaymentDate).toLocaleDateString('pt-BR') : '-'}
                         </span>
                      </td>
                      <td className="px-6 py-5 text-right font-black text-xs text-indigo-100">
                        R$ {(item.quantity * currentAsset.price).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button onClick={() => onRemove(item.id)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors">
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
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4 md:p-6 bg-slate-950/90 backdrop-blur-xl">
          <div className="bg-slate-900 border border-slate-800 rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-black uppercase tracking-tight text-sm">Novo Ativo</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 bg-slate-800 rounded-full"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      placeholder="TICKER B3" 
                      className="w-full p-4 bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-bold text-xs"
                      value={searchTerm}
                      onFocus={() => setShowSuggestions(true)}
                      onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
                    />
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                        {filteredSuggestions.map((asset) => (
                          <button key={asset.symbol} type="button" onClick={() => handleSelectSuggestion(asset)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-indigo-600 transition-colors border-b border-slate-700/50 last:border-none">
                            <span className="font-black text-[10px]">{asset.symbol}</span>
                            <span className="text-[9px] opacity-60 uppercase">{asset.name.slice(0, 15)}...</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={handleSearchClick} className="px-4 bg-indigo-600 rounded-xl"><Zap size={18} /></button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Qtd" className="w-full p-4 bg-slate-800 border-none rounded-xl font-black text-xs" value={quantityInput} onChange={(e) => setQuantityInput(e.target.value)} />
                <input type="text" placeholder="Preço Médio" className="w-full p-4 bg-slate-800 border-none rounded-xl font-black text-xs" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} />
              </div>

              <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-indigo-600/20">
                Confirmar Aporte
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
