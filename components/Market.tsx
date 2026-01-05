
import React from 'react';
import { Asset } from '../types';
import { TrendingUp, TrendingDown, ExternalLink, Activity, Globe, Zap } from 'lucide-react';

interface MarketProps {
  marketAssets: Asset[];
  sources?: {title: string, uri: string}[];
}

const Market: React.FC<MarketProps> = ({ marketAssets, sources }) => {
  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Mercado B3</h2>
          <p className="text-slate-500 font-medium">Cotações reais via Yahoo Finance API</p>
        </div>
        
        <div className="flex items-center gap-3 bg-indigo-600/5 px-6 py-4 rounded-3xl border border-indigo-500/10">
          <Zap size={20} className="text-indigo-400" />
          <div>
            <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest leading-none mb-1">Status</p>
            <p className="text-sm font-bold text-slate-300">Sincronizado</p>
          </div>
        </div>
      </header>

      {sources && sources.length > 0 && (
        <div className="bg-slate-900/40 p-5 rounded-[2rem] border border-slate-800">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4 flex items-center gap-2">
            <Globe size={14} /> Fonte dos Dados
          </p>
          <div className="flex flex-wrap gap-2">
            {sources.map((source, i) => (
              <a 
                key={i} 
                href={source.uri} 
                target="_blank" 
                rel="noreferrer"
                className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-indigo-400 transition-all flex items-center gap-2"
              >
                <ExternalLink size={12} />
                {source.title}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {marketAssets.map((asset) => (
          <div key={asset.symbol} className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] hover:border-indigo-500/30 transition-all group">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center font-black text-indigo-500 text-sm border border-indigo-500/10 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  {asset.symbol.substring(0, 4)}
                </div>
                <div>
                  <h4 className="font-black text-xl">{asset.symbol}</h4>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest truncate max-w-[120px]">{asset.name}</p>
                </div>
              </div>
              <a 
                href={`https://statusinvest.com.br/${asset.symbol.length === 6 ? 'fundos-imobiliarios' : 'acoes'}/${asset.symbol.toLowerCase()}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-all"
              >
                <ExternalLink size={18} />
              </a>
            </div>

            <div className="flex items-end justify-between">
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
                <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-1">DY Anual</p>
                <div className="px-4 py-2 bg-indigo-500/10 rounded-2xl">
                  <p className="text-indigo-400 font-black text-sm">{(asset.yield! * 100).toFixed(1)}%</p>
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
