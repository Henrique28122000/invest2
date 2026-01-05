
import React, { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PortfolioItem, Asset } from '../types';
import { TrendingUp, Sparkles, Coins, Calendar, Wallet } from 'lucide-react';
import { getPortfolioAdvice } from '../services/gemini';

interface DashboardProps {
  portfolio: PortfolioItem[];
  marketAssets: Asset[];
  cashBalance: number;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

const Dashboard: React.FC<DashboardProps> = ({ portfolio, marketAssets, cashBalance }) => {
  const [advice, setAdvice] = useState<string>('Aguardando sincronização de mercado...');

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
      
      if (currentAsset.yield) {
        estimatedAnnualDividends += itemValue * currentAsset.yield;
      }

      if (currentAsset.nextPaymentDate && currentAsset.lastDividendValue) {
        upcomingPayments.push({
          symbol: currentAsset.symbol,
          date: currentAsset.nextPaymentDate,
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black mb-1 tracking-tighter uppercase">Minha B3</h2>
          <p className="text-slate-400">Patrimônio Líquido Atualizado</p>
        </div>
        <div className="flex gap-4">
          <div className="px-5 py-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
             <div className="p-2 bg-emerald-600/20 rounded-lg"><Wallet size={16} className="text-emerald-400" /></div>
             <div>
               <p className="text-[9px] uppercase font-black text-slate-500">Saldo Acumulado</p>
               <p className="text-sm font-black text-emerald-400">R$ {cashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
             </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-600/20">
          <p className="text-[10px] uppercase font-black text-indigo-100/60 tracking-widest mb-1">Patrimônio Total</p>
          <h3 className="text-2xl font-black text-white">R$ {summary.netWorth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className="text-[10px] text-indigo-200 mt-2 font-bold">Investido: R$ {summary.currentAssetsValue.toLocaleString('pt-BR')}</p>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl">
          <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Projeção Anual (Renda)</p>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-black text-emerald-400">R$ {summary.estimatedAnnualDividends.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <Coins size={16} className="text-emerald-500" />
          </div>
          <p className="text-[10px] text-slate-500 font-bold mt-1">~R$ {(summary.estimatedAnnualDividends / 12).toLocaleString('pt-BR')} /mês</p>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl">
          <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Resultado Líquido</p>
          <h3 className={`text-2xl font-black ${summary.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            R$ {summary.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-500 mt-1 font-bold">{summary.profitPercentage.toFixed(2)}% total</p>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl">
          <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Capital Aplicado</p>
          <h3 className="text-2xl font-black text-slate-400">R$ {summary.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className="text-[10px] text-slate-500 mt-1 font-bold">Custo Médio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem]">
          <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Calendar size={20} className="text-indigo-400" />
            Agenda de Recebimentos
          </h4>
          <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {summary.upcomingPayments.length > 0 ? (
              summary.upcomingPayments.map((payment, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600/10 rounded-xl flex flex-col items-center justify-center border border-indigo-500/20">
                       <p className="text-[8px] font-black text-indigo-400 uppercase">{new Date(payment.date).toLocaleDateString('pt-BR', {month: 'short'})}</p>
                       <p className="text-lg font-black text-indigo-300">{new Date(payment.date).getDate() + 1}</p>
                    </div>
                    <div>
                      <p className="text-sm font-black">{payment.symbol}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Previsão de Crédito</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-emerald-400">R$ {payment.total.toFixed(2)}</p>
                    <p className="text-[9px] text-slate-600 font-black">PROVENTO ESTIMADO</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20">
                <p className="text-slate-600 font-bold italic">Buscando novos dividendos na B3...</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem]">
          <h4 className="text-lg font-bold mb-8">Composição do Patrimônio</h4>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={[
                    {name: 'Investido', value: summary.currentAssetsValue}, 
                    {name: 'Saldo', value: cashBalance}
                  ]} 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={8} 
                  dataKey="value"
                >
                  <Cell fill="#6366f1" stroke="none" />
                  <Cell fill="#10b981" stroke="none" />
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-indigo-500 rounded-full" /><span className="text-xs text-slate-400">Mercado (Ações/FIIs)</span></div>
                <span className="text-xs font-black">R$ {summary.currentAssetsValue.toLocaleString('pt-BR')}</span>
             </div>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full" /><span className="text-xs text-slate-400">Saldo Líquido</span></div>
                <span className="text-xs font-black">R$ {cashBalance.toLocaleString('pt-BR')}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="p-8 bg-indigo-600/10 border border-indigo-500/20 rounded-[2.5rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
          <Sparkles size={140} className="text-indigo-400" />
        </div>
        <div className="relative z-10 flex items-start gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/30">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-white mb-2">Análise Estratégica B3</h4>
            <p className="text-indigo-100/70 leading-relaxed italic text-lg max-w-4xl">
              {advice}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
