
import React from 'react';
import { Asset, AssetType } from '../types';
import { TrendingUp, TrendingDown, ExternalLink, Activity, Globe, Zap, Search } from 'lucide-react';

interface MarketProps {
  marketAssets: Asset[];
  sources?: {title: string, uri: string}[];
}

const Market: React.FC<MarketProps> = ({ marketAssets, sources }) => {
  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Radar StatusInvest</h2>
          <p className="text-slate-500 font-medium">Extração de dados em tempo real direto da fonte.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-emerald-500/10 px-6 py-4 rounded-3xl border border-emerald-500/20">
          <Zap size={20} className="text-emerald-400" />
          <div>
            <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest leading-none mb-1">Fonte</p>
            <p className="text-sm font-bold text-slate-300">Scraper Ativo</p>
          </div>
        </div>
      </header>

      {sources && sources.length > 0 && (
        <div className="bg-slate-900/40 p-5 rounded-[2rem] border border-slate-800">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4 flex items-center gap-2">
            <Globe size={14} /> Origem dos Dados
          </p>
          <div className="flex flex-wrap gap-2">
            {sources.map((source, i) => (
              <a 
                key={i} 
                href={source.uri} 
                target="_blank" 
                rel="noreferrer"
                className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-emerald-400 transition-all flex items-center gap-2"
              >
                <Search size={12} />
                {source.title}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {marketAssets.map((asset) => (
          <div key={asset.symbol} className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] hover:border-emerald-500/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
               <div className="text-[40px] font-black text-slate-700 select-none">#B3</div>
            </div>
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-sm border transition-all ${asset.type === AssetType.FII ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white' : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white'}`}>
                  {asset.symbol.slice(0, 4)}
                </div>
                <div>
                  <h4 className="font-black text-xl">{asset.symbol}</h4>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest truncate max-w-[120px]">{asset.name}</p>
                </div>
              </div>
              <a 
                href={`https://statusinvest.com.br/${asset.type === AssetType.FII ? 'fundos-imobiliarios' : 'acoes'}/${asset.symbol.toLowerCase()}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-all shadow-lg"
              >
                <ExternalLink size={18} />
              </a>
            </div>

            <div className="flex items-end justify-between relative z-10">
              <div>
                <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] mb-1">Preço Atual</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black">R$ {asset.price.toFixed(2)}</span>
                </div>
                <div className={`flex items-center gap-1 text-sm font-black mt-2 ${asset.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {asset.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-1">Yield (DY)</p>
                <div className="px-4 py-2 bg-emerald-500/10 rounded-2xl border border-emerald-500/10">
                  <p className="text-emerald-400 font-black text-sm">{(asset.yield! * 100).toFixed(2)}%</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Market;
