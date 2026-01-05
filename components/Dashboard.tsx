
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PortfolioItem, Asset, AssetType } from '../types';
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Layers, ShieldCheck, Calendar } from 'lucide-react';
import { getPortfolioAdvice } from '../services/gemini';

interface DashboardProps {
  portfolio: PortfolioItem[];
  marketAssets: Asset[];
  cashBalance: number;
}

const CHART_COLORS = {
  STOCK: '#6366f1',
  FII: '#f59e0b',
  CASH: '#10b981',
  EMPTY: '#1e293b'
};

const Dashboard: React.FC<DashboardProps> = ({ portfolio, marketAssets, cashBalance }) => {
  const summary = useMemo(() => {
    let totalInvested = 0;
    let currentAssetsValue = 0;
    let stocksValue = 0;
    let fiisValue = 0;
    let estimatedAnnualDividends = 0;
    const upcomingPayments: any[] = [];

    portfolio.forEach(item => {
      if (!item.asset) return;
      const currentAsset = marketAssets.find(a => a.symbol === item.asset.symbol) || item.asset;
      const itemValue = item.quantity * currentAsset.price;
      
      totalInvested += item.quantity * item.averagePrice;
      currentAssetsValue += itemValue;
      
      if (item.asset.type === AssetType.STOCK) {
        stocksValue += itemValue;
      } else if (item.asset.type === AssetType.FII) {
        fiisValue += itemValue;
      }
      
      if (currentAsset.yield) {
        estimatedAnnualDividends += itemValue * currentAsset.yield;
      }

      if (currentAsset.nextPaymentDate && currentAsset.lastDividendValue) {
        upcomingPayments.push({
          symbol: currentAsset.symbol,
          date: currentAsset.nextPaymentDate,
          perShare: currentAsset.lastDividendValue,
          total: item.quantity * currentAsset.lastDividendValue
        });
      }
    });

    upcomingPayments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const netWorth = currentAssetsValue + cashBalance;
    const profit = netWorth - totalInvested;
    const profitPercentage = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

    const chartData = [
      { name: 'Ações', value: stocksValue, color: CHART_COLORS.STOCK },
      { name: 'FIIs', value: fiisValue, color: CHART_COLORS.FII },
      { name: 'Liquidez', value: cashBalance, color: CHART_COLORS.CASH }
    ].filter(d => d.value > 0);

    if (chartData.length === 0) chartData.push({ name: 'Vazio', value: 1, color: CHART_COLORS.EMPTY });

    return { 
      totalInvested, netWorth, profit, profitPercentage, 
      estimatedAnnualDividends, upcomingPayments, currentAssetsValue,
      chartData, stocksValue, fiisValue
    };
  }, [portfolio, marketAssets, cashBalance]);

  const advice = useMemo(() => getPortfolioAdvice(portfolio), [portfolio]);

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-1 tracking-tighter uppercase leading-none">Visão Geral</h2>
          <p className="text-slate-400 font-medium text-sm md:text-lg">Gestão profissional da sua carteira B3.</p>
        </div>
        <div className="hidden md:flex items-center gap-4 bg-slate-900/50 p-5 rounded-[2rem] border border-slate-800">
           <div className="p-3 bg-emerald-600/20 rounded-2xl">
             <Wallet size={24} className="text-emerald-400" />
           </div>
           <div>
             <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Caixa em Aberto</p>
             <p className="text-xl font-black text-emerald-400">R$ {cashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="p-8 bg-indigo-600 rounded-[2.5rem] shadow-2xl shadow-indigo-600/30 relative overflow-hidden">
          <TrendingUp className="absolute top-[-5%] right-[-5%] text-white/10 w-32 h-32" />
          <p className="text-[10px] uppercase font-black text-indigo-100/60 tracking-widest mb-2">Patrimônio Líquido</p>
          <h3 className="text-3xl font-black text-white tracking-tight">R$ {summary.netWorth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[9px] bg-white/20 px-2 py-1 rounded-full text-white font-black">VALOR DE MERCADO</span>
          </div>
        </div>

        <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem]">
          <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2">Proventos (Ano)</p>
          <h3 className="text-3xl font-black text-emerald-400 tracking-tight">R$ {summary.estimatedAnnualDividends.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className="text-[9px] text-slate-500 font-bold mt-2 uppercase tracking-widest">R$ {(summary.estimatedAnnualDividends / 12).toLocaleString('pt-BR')}/mês</p>
        </div>

        <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem]">
          <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2">Lucro / Prejuízo</p>
          <div className="flex items-center gap-2">
             <h3 className={`text-3xl font-black tracking-tight ${summary.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
               R$ {Math.abs(summary.profit).toLocaleString('pt-BR')}
             </h3>
             {summary.profit >= 0 ? <ArrowUpRight className="text-emerald-500" size={20} /> : <ArrowDownRight className="text-rose-500" size={20} />}
          </div>
          <p className={`text-[10px] mt-2 font-black ${summary.profit >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
            {summary.profitPercentage.toFixed(2)}% de rentabilidade
          </p>
        </div>

        <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem]">
          <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2">Total Investido</p>
          <h3 className="text-3xl font-black text-slate-400 tracking-tight">R$ {summary.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className="text-[9px] text-slate-500 mt-2 font-bold uppercase tracking-widest">Preço de custo</p>
        </div>
      </div>

      {/* Insight Panel Local */}
      <div className="p-8 md:p-10 bg-indigo-600/10 border border-indigo-500/20 rounded-[3rem] relative overflow-hidden shadow-2xl">
        <div className="absolute top-[-20%] right-[-10%] opacity-5">
           <ShieldCheck size={280} className="text-indigo-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-600/40 shrink-0">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <div>
            <h4 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Análise Estratégica Master</h4>
            <p className="text-indigo-100/80 leading-relaxed italic text-lg font-medium max-w-4xl">
              "{advice.text}"
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-8 bg-slate-900 border border-slate-800 rounded-[3rem]">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              <Calendar size={24} className="text-indigo-500" />
              Proventos Anunciados
            </h4>
          </div>
          <div className="space-y-4">
            {summary.upcomingPayments.length > 0 ? (
              summary.upcomingPayments.map((payment, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-slate-800/30 rounded-[2rem] border border-slate-700/50">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex flex-col items-center justify-center border border-indigo-500/20">
                       <p className="text-[8px] font-black text-indigo-400 uppercase">{new Date(payment.date).toLocaleDateString('pt-BR', {month: 'short'})}</p>
                       <p className="text-xl font-black text-indigo-300">{new Date(payment.date).getDate() + 1}</p>
                    </div>
                    <div>
                      <p className="font-black text-xl">{payment.symbol}</p>
                      <p className="text-[10px] text-slate-500 font-black uppercase">R$ {payment.perShare.toFixed(2)} por cota</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-emerald-400">R$ {payment.total.toFixed(2)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center">
                 <p className="text-slate-600 font-black uppercase text-xs tracking-[0.2em]">Sem anúncios de dividendos no momento</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 bg-slate-900 border border-slate-800 rounded-[3rem] flex flex-col items-center">
          <h4 className="w-full text-xl font-black uppercase tracking-tighter mb-10 flex items-center gap-3">
            <Layers size={22} className="text-indigo-500" />
            Alocação
          </h4>
          
          <div className="h-[280px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={summary.chartData} innerRadius={80} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                  {summary.chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 m-auto flex flex-col items-center justify-center pointer-events-none">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</p>
               <p className="text-2xl font-black tracking-tighter">100%</p>
            </div>
          </div>

          <div className="mt-8 space-y-3 w-full">
             {summary.chartData.filter(d => d.name !== 'Vazio').map((d, i) => (
               <div key={i} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                 <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-xs font-black text-slate-300 uppercase tracking-widest">{d.name}</span>
                 </div>
                 <p className="text-sm font-black text-white">{((d.value / summary.netWorth) * 100).toFixed(1)}%</p>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
