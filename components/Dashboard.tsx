
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PortfolioItem, Asset, AssetType } from '../types';
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Layers, ShieldCheck, Calendar } from 'lucide-react';
import { getPortfolioAdvice } from '../services/market';

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
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="p-8 bg-indigo-600 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <TrendingUp className="absolute top-[-5%] right-[-5%] text-white/10 w-32 h-32" />
          <p className="text-[10px] uppercase font-black text-indigo-100/60 tracking-widest mb-2">Patrimônio Líquido</p>
          <h3 className="text-3xl font-black text-white tracking-tight">R$ {summary.netWorth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>

        <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem]">
          <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2">Proventos (Ano)</p>
          <h3 className="text-3xl font-black text-emerald-400 tracking-tight">R$ {summary.estimatedAnnualDividends.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className="text-[9px] text-slate-500 font-bold mt-2 uppercase">~R$ {(summary.estimatedAnnualDividends / 12).toLocaleString('pt-BR')}/mês</p>
        </div>

        <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem]">
          <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2">Lucro / Prejuízo</p>
          <div className="flex items-center gap-2">
             <h3 className={`text-3xl font-black tracking-tight ${summary.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
               R$ {Math.abs(summary.profit).toLocaleString('pt-BR')}
             </h3>
             {summary.profit >= 0 ? <ArrowUpRight className="text-emerald-500" size={20} /> : <ArrowDownRight className="text-rose-500" size={20} />}
          </div>
          <p className="text-[10px] mt-2 font-black text-slate-500">{summary.profitPercentage.toFixed(2)}% de retorno</p>
        </div>

        <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem]">
          <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2">Total Investido</p>
          <h3 className="text-3xl font-black text-slate-400 tracking-tight">R$ {summary.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
      </div>

      <div className="p-8 md:p-10 bg-indigo-600/10 border border-indigo-500/20 rounded-[3rem] relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="p-5 bg-indigo-600 rounded-[2rem] shrink-0">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <div>
            <h4 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Análise da Carteira</h4>
            <p className="text-indigo-100/80 leading-relaxed italic text-lg font-medium">
              "{advice.text}"
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-8 bg-slate-900 border border-slate-800 rounded-[3rem]">
          <h4 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 mb-8">
            <Calendar size={24} className="text-indigo-500" /> Proventos Anunciados
          </h4>
          {summary.upcomingPayments.length > 0 ? (
            <div className="space-y-4">
              {summary.upcomingPayments.map((payment, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-slate-800/30 rounded-[2rem] border border-slate-700/50">
                  <div className="flex items-center gap-5">
                    <p className="font-black text-xl">{payment.symbol}</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase">Data: {new Date(payment.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <p className="text-2xl font-black text-emerald-400">R$ {payment.total.toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-600 font-bold uppercase text-xs tracking-widest">Sem anúncios no momento</div>
          )}
        </div>

        <div className="p-8 bg-slate-900 border border-slate-800 rounded-[3rem] flex flex-col items-center">
          <h4 className="w-full text-xl font-black uppercase tracking-tighter mb-10 flex items-center gap-3">
            <Layers size={22} className="text-indigo-500" /> Alocação
          </h4>
          <div className="h-[280px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={summary.chartData} innerRadius={80} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                  {summary.chartData.map((entry, index) => <Cell key={index} fill={(entry as any).color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
