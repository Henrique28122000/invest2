
import React from 'react';
import { Asset } from '../types';
import { TrendingUp, TrendingDown, ExternalLink, Info, Activity } from 'lucide-react';

interface MarketProps {
  marketAssets: Asset[];
  sources?: {title: string, uri: string}[];
}

const Market: React.FC<MarketProps> = ({ marketAssets, sources }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity size={20} className="text-indigo-400" />
            <h2 className="text-3xl font-bold">Painel B3 Real</h2>
          </div>
          <p className="text-slate-400">Dados monitorados automaticamente via Google Finance & Gemini</p>
        </div>
        {sources && sources.length > 0 && (
          <div className="flex flex-wrap gap-2 max-w-md bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 mr-2 uppercase font-black">
              <Info size={12} /> Fontes Ativas:
            </div>
            {sources.slice(0, 4).map((source, i) => (
              <a 
                key={i} 
                href={source.uri} 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                • {source.title.split('|')[0].trim()}
              </a>
            ))}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {marketAssets.map((asset) => (
          <div key={asset.symbol} className="p-8 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] hover:border-indigo-500/50 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Activity size={80} className="text-indigo-400" />
            </div>
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-600/20 rounded-2xl flex items-center justify-center font-black text-indigo-400 text-sm shadow-inner">
                  {asset.symbol.substring(0, 4)}
                </div>
                <div>
                  <h4 className="font-bold text-xl group-hover:text-indigo-400 transition-colors">{asset.symbol}</h4>
                  <p className="text-xs text-slate-500 font-medium uppercase">{asset.name}</p>
                </div>
              </div>
              <a 
                href={`https://statusinvest.com.br/${asset.type === 'FII' ? 'fundos-imobiliarios' : 'acoes'}/${asset.symbol.toLowerCase()}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-slate-800/50 hover:bg-indigo-600 rounded-xl text-slate-400 hover:text-white transition-all"
              >
                <ExternalLink size={18} />
              </a>
            </div>

            <div className="flex items-end justify-between relative z-10">
              <div>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-1">Preço Agora</p>
                <p className="text-4xl font-black tracking-tighter">R$ {asset.price.toFixed(2)}</p>
                <div className={`flex items-center gap-1 text-sm font-bold mt-2 ${asset.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {asset.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                </div>
              </div>
              {asset.yield !== undefined && (
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">DY Anual</p>
                  <div className="px-3 py-1 bg-indigo-600/10 rounded-full border border-indigo-500/20">
                    <p className="text-indigo-400 font-black">{(asset.yield * 100).toFixed(1)}%</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-800/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Live Feed</span>
              </div>
              <button className="text-[10px] font-black text-indigo-500 hover:text-indigo-400 uppercase tracking-widest">
                Analisar Ativo
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Market;
