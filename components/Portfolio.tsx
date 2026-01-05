
import React, { useState, useMemo } from 'react';
import { PortfolioItem, Asset, AssetType } from '../types';
import { Plus, Trash2, Search, X, Zap } from 'lucide-react';
import { searchAssetDetails } from '../services/market';
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
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [quantityInput, setQuantityInput] = useState('');
  const [priceInput, setPriceInput] = useState('');

  const filteredSuggestions = useMemo(() => {
    if (!searchTerm) return [];
    return B3_SUGGESTIONS.filter(s => 
      s.symbol.toLowerCase().includes(searchTerm.toLowerCase())
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
    const result = await searchAssetDetails(searchTerm.toUpperCase());
    if (result) {
      setSelectedAsset(result);
      setPriceInput(result.price.toString());
    } else {
      alert("Ativo não encontrado na Brapi.");
    }
    setShowSuggestions(false);
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
        <h2 className="text-2xl md:text-4xl font-black uppercase">Minha Carteira</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
        >
          <Plus size={16} /> Adicionar
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase font-black border-b border-slate-800 bg-slate-900/50">
                <th className="px-6 py-5">Ativo</th>
                <th className="px-6 py-5">Quantidade</th>
                <th className="px-6 py-5">Cotação Atual</th>
                <th className="px-6 py-5">DY</th>
                <th className="px-6 py-5 text-right">Patrimônio</th>
                <th className="px-6 py-5 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {portfolio.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-600 font-bold uppercase text-xs">Carteira vazia</td></tr>
              ) : (
                portfolio.map((item) => {
                  const currentAsset = marketAssets.find(a => a.symbol === item.asset.symbol) || item.asset;
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/20">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-black text-indigo-400 text-xs border border-slate-700">
                            {item.asset.symbol.slice(0, 4)}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{item.asset.symbol}</p>
                            <p className="text-[8px] text-slate-500 uppercase font-black">{item.asset.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-mono text-xs">{item.quantity}</td>
                      <td className="px-6 py-5">
                        <p className="font-bold text-xs">R$ {currentAsset.price.toFixed(2)}</p>
                      </td>
                      <td className="px-6 py-5 text-xs text-emerald-400 font-black">
                        {currentAsset.yield ? `${(currentAsset.yield * 100).toFixed(2)}%` : '-'}
                      </td>
                      <td className="px-6 py-5 text-right font-black text-xs text-indigo-100">
                        R$ {(item.quantity * currentAsset.price).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button onClick={() => onRemove(item.id)} className="p-2 text-slate-600 hover:text-rose-500">
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-black uppercase tracking-tight text-sm">Novo Aporte</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 bg-slate-800 rounded-full"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
              <div className="flex gap-2 relative">
                <input 
                  type="text" 
                  placeholder="TICKER (EX: VALE3)" 
                  className="w-full p-4 bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-bold text-xs"
                  value={searchTerm}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
                />
                <button type="button" onClick={handleSearchClick} className="px-4 bg-indigo-600 rounded-xl"><Search size={18} /></button>
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl z-50 overflow-hidden shadow-2xl">
                    {filteredSuggestions.map((asset) => (
                      <button key={asset.symbol} type="button" onClick={() => handleSelectSuggestion(asset)} className="w-full px-4 py-3 text-left hover:bg-indigo-600 font-black text-[10px] border-b border-slate-700 last:border-none">
                        {asset.symbol} - {asset.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Quantidade" className="w-full p-4 bg-slate-800 rounded-xl font-bold text-xs" value={quantityInput} onChange={(e) => setQuantityInput(e.target.value)} />
                <input type="text" placeholder="Preço Pago" className="w-full p-4 bg-slate-800 rounded-xl font-bold text-xs" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} />
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase tracking-widest transition-all">
                Salvar Ativo
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
