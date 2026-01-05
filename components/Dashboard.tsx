
import React, { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PortfolioItem, Asset } from '../types';
import { TrendingUp, Sparkles, Coins, Calendar, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getPortfolioAdvice } from '../services/gemini';

interface DashboardProps {
  portfolio: PortfolioItem[];
  marketAssets: Asset[];
  cashBalance: number;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

const Dashboard: React.FC<DashboardProps> = ({ portfolio, marketAssets, cashBalance }) => {
  const [advice, setAdvice] = useState<string>('Sincronizando sua carteira com a B3...');

  const summary = useMemo(() => {
    let totalInvested = 0;
    let currentAssetsValue = 0;
    let estimatedAnnualDividends = 0;
    const upcomingPayments: any[] = [];

    portfolio.forEach(item => {
      if (!item.asset) return;
      const currentAsset = marketAssets.find(a => a.symbol === item.asset.symbol) || item.asset;
      const itemValue = item.quantity * currentAsset.price;
      
      totalInvested += item.quantity * item.averagePrice;
      currentAssetsValue += itemValue;
      
      // Cálculo de dividend yield projetado
      if (currentAsset.yield) {
        estimatedAnnualDividends += itemValue * currentAsset.yield;
      }

      // Detalhamento do pagamento por cota
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

    return { totalInvested, netWorth, profit, profitPercentage, estimatedAnnualDividends, upcomingPayments, currentAssetsValue };
  }, [portfolio, marketAssets, cashBalance]);

  useEffect(() => {
    if (portfolio.length > 0) {
      getPortfolioAdvice(portfolio).then(res => setAdvice(res.text));
    }
  }, [portfolio.length]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-5xl font-black mb-2 tracking-tighter uppercase leading-none">Visão Geral</h2>
          <p className="text-slate-400 font-medium text-lg">Seu progresso rumo à liberdade financeira.</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-[2rem] border border-slate-800">
           <div className="p-3 bg-emerald-600/20 rounded-2xl">
             <Wallet size={24} className="text-emerald-400" />
           </div>
           <div>
             <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em]">Saldo Acumulado</p>
             <p className="text-xl font-black text-emerald-400">R$ {cashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
           </div>
        </div>
      </header>

      {/* Cards Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-8 bg-indigo-600 rounded-[2.5rem] shadow-2xl shadow-indigo-600/30 relative overflow-hidden group">
          <TrendingUp className="absolute top-[-10%] right-[-10%] text-white/10 w-32 h-32 group-hover:scale-110 transition-transform duration-1000" />
          <p className="text-[10px] uppercase font-black text-indigo-100/60 tracking-widest mb-2">Patrimônio Líquido</p>
          <h3 className="text-3xl font-black text-white tracking-tight">R$ {summary.netWorth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full text-white font-black">MERCADO + SALDO</span>
          </div>
        </div>

        <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem]">
          <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2">Renda Passiva Anual</p>
          <div className="flex items-center gap-3">
            <h3 className="text-3xl font-black text-emerald-400 tracking-tight">R$ {summary.estimatedAnnualDividends.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <Coins size={24} className="text-emerald-500" />
          </div>
          <p className="text-[10px] text-slate-500 font-bold mt-3 uppercase tracking-wider">Média de R$ {(summary.estimatedAnnualDividends / 12).toLocaleString('pt-BR')} / mês</p>
        </div>

        <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem]">
          <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2">Retorno Total (P/L)</p>
          <div className="flex items-center gap-2">
             <h3 className={`text-3xl font-black tracking-tight ${summary.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
               R$ {summary.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
             </h3>
             {summary.profit >= 0 ? <ArrowUpRight className="text-emerald-500" /> : <ArrowDownRight className="text-rose-500" />}
          </div>
          <p className={`text-[11px] mt-2 font-black ${summary.profit >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
            {summary.profitPercentage.toFixed(2)}% sobre o capital
          </p>
        </div>

        <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem]">
          <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2">Capital de Risco</p>
          <h3 className="text-3xl font-black text-slate-400 tracking-tight">R$ {summary.currentAssetsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className="text-[10px] text-slate-500 mt-3 font-bold uppercase tracking-wider">Valor em Ações e FIIs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Próximos Dividendos */}
        <div className="lg:col-span-2 p-10 bg-slate-900 border border-slate-800 rounded-[3rem] shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              <Calendar size={28} className="text-indigo-500" />
              Proventos Provisionados
            </h4>
            <span className="text-[10px] font-black text-slate-500 uppercase bg-slate-800 px-3 py-1 rounded-full">Agenda B3</span>
          </div>
          <div className="space-y-4 overflow-y-auto max-h-[380px] pr-4 custom-scrollbar">
            {summary.upcomingPayments.length > 0 ? (
              summary.upcomingPayments.map((payment, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-slate-800/30 rounded-3xl border border-slate-700/50 hover:border-indigo-500/30 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex flex-col items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-600/20 transition-all">
                       <p className="text-[10px] font-black text-indigo-400 uppercase">{new Date(payment.date).toLocaleDateString('pt-BR', {month: 'short'})}</p>
                       <p className="text-2xl font-black text-indigo-300">{new Date(payment.date).getDate() + 1}</p>
                    </div>
                    <div>
                      <p className="text-xl font-black group-hover:text-white transition-colors">{payment.symbol}</p>
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">R$ {payment.perShare.toFixed(2)} por cota</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-emerald-400 tracking-tight">R$ {payment.total.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">A Receber</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-24 bg-slate-800/20 rounded-[2rem] border border-dashed border-slate-700">
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs italic">Nenhum pagamento detectado no radar da B3...</p>
              </div>
            )}
          </div>
        </div>

        {/* Composição */}
        <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] flex flex-col items-center">
          <h4 className="text-xl font-black uppercase tracking-tighter mb-10 w-full text-left">Estrutura de Riqueza</h4>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={[
                    {name: 'Em Bolsa', value: summary.currentAssetsValue}, 
                    {name: 'Liquidez', value: cashBalance}
                  ]} 
                  innerRadius={70} 
                  outerRadius={100} 
                  paddingAngle={10} 
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#6366f1" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '20px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 m-auto flex flex-col items-center justify-center pointer-events-none">
               <p className="text-[10px] font-black text-slate-500 uppercase">Diversificação</p>
               <p className="text-lg font-black">{((summary.currentAssetsValue / summary.netWorth) * 100).toFixed(0)}% / {((cashBalance / summary.netWorth) * 100).toFixed(0)}%</p>
            </div>
          </div>
          <div className="mt-10 space-y-4 w-full">
             <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-3"><div className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" /><span className="text-xs font-bold text-slate-300">Ações e FIIs</span></div>
                <span className="text-xs font-black">R$ {summary.currentAssetsValue.toLocaleString('pt-BR')}</span>
             </div>
             <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-3"><div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" /><span className="text-xs font-bold text-slate-300">Dividendos em Conta</span></div>
                <span className="text-xs font-black">R$ {cashBalance.toLocaleString('pt-BR')}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Insight IA */}
      <div className="p-10 bg-indigo-600/10 border border-indigo-500/20 rounded-[3rem] relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-1000 scale-150">
          <Sparkles size={140} className="text-indigo-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-600/40">
            <Sparkles size={32} className="text-white" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Gemini Finance Insight</h4>
            <p className="text-indigo-100/70 leading-relaxed italic text-xl max-w-5xl font-medium">
              "{advice}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
