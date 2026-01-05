
import React, { useState, useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { PortfolioItem } from '../types';
import { Calculator, ShieldCheck, TrendingUp } from 'lucide-react';
import { getSimulationInsight } from '../services/gemini';

interface SimulatorProps {
  portfolio: PortfolioItem[];
}

const Simulator: React.FC<SimulatorProps> = ({ portfolio }) => {
  const currentTotal = portfolio.reduce((acc, item) => acc + (item.quantity * item.asset.price), 0);
  
  const [initialCapital, setInitialCapital] = useState((currentTotal || 1000).toString());
  const [monthlyAport, setMonthlyAport] = useState('500');
  const [annualRate, setAnnualRate] = useState('12');
  const [years, setYears] = useState(10);

  const simulationData = useMemo(() => {
    const data = [];
    const initial = parseFloat(initialCapital) || 0;
    const aport = parseFloat(monthlyAport) || 0;
    const rate = parseFloat(annualRate) || 0;

    let balance = initial;
    let totalInvested = initial;
    const monthlyRate = Math.pow(1 + rate / 100, 1 / 12) - 1;

    for (let i = 0; i <= years * 12; i++) {
      if (i % 12 === 0) {
        data.push({
          month: i / 12,
          total: Number(balance.toFixed(2)),
          invested: Number(totalInvested.toFixed(2))
        });
      }
      balance = balance * (1 + monthlyRate) + aport;
      totalInvested += aport;
    }
    return data;
  }, [initialCapital, monthlyAport, annualRate, years]);

  const finalResult = simulationData[simulationData.length - 1];
  const aiInsight = useMemo(() => 
    getSimulationInsight(finalResult.total, parseFloat(monthlyAport) || 0, years), 
  [finalResult.total, monthlyAport, years]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header>
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Simulador de Futuro</h2>
        <p className="text-slate-500 font-medium">Projete o crescimento do seu patrimônio com juros compostos.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] space-y-8 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl">
              <Calculator size={24} className="text-white" />
            </div>
            <h4 className="text-2xl font-black uppercase tracking-tighter">Parâmetros</h4>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] ml-1">Patrimônio Atual (R$)</label>
              <input 
                type="text" 
                className="w-full p-5 bg-slate-800 border-none rounded-[1.5rem] focus:ring-2 focus:ring-indigo-500 outline-none font-black text-lg"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] ml-1">Aporte Mensal (R$)</label>
              <input 
                type="text" 
                className="w-full p-5 bg-slate-800 border-none rounded-[1.5rem] focus:ring-2 focus:ring-indigo-500 outline-none font-black text-lg"
                value={monthlyAport}
                onChange={(e) => setMonthlyAport(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] ml-1">Rentabilidade Anual (%)</label>
              <input 
                type="text" 
                className="w-full p-5 bg-slate-800 border-none rounded-[1.5rem] focus:ring-2 focus:ring-indigo-500 outline-none font-black text-lg"
                value={annualRate}
                onChange={(e) => setAnnualRate(e.target.value)}
              />
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex justify-between text-[11px] uppercase font-black text-slate-400">
                <span>Prazo de Investimento</span>
                <span className="text-indigo-400">{years} Anos</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="50"
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800">
            <div className="p-8 bg-indigo-600 rounded-[2.5rem] shadow-xl shadow-indigo-600/30">
              <p className="text-[10px] text-indigo-100/60 uppercase font-black tracking-widest mb-2">Montante Projetado</p>
              <p className="text-3xl font-black text-white">R$ {finalResult.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <div className="mt-5 pt-5 border-t border-white/10 flex items-center justify-between text-[10px] text-white font-black uppercase tracking-widest">
                <span>Rendimento Líquido</span>
                <span>R$ {(finalResult.total - finalResult.invested).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] h-[520px] shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-10 relative z-10">
              <h4 className="text-2xl font-black uppercase tracking-tighter">Projeção Geométrica</h4>
              <div className="flex gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-indigo-500 rounded-full" />
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Patrimônio</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-slate-700 rounded-full" />
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Aportes</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="80%">
              <AreaChart data={simulationData}>
                <defs>
                  <linearGradient id="simColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#475569" fontSize={10} tickFormatter={(v) => `${v}a`} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000)}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '24px', padding: '15px' }} 
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
                />
                <Area name="Total Acumulado" type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={5} fill="url(#simColor)" />
                <Area name="Total Investido" type="monotone" dataKey="invested" stroke="#334155" strokeWidth={2} fill="transparent" strokeDasharray="8 8" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-10 bg-emerald-500/10 border border-emerald-500/20 rounded-[3rem] relative overflow-hidden group">
            <div className="absolute top-[-30%] right-[-10%] opacity-5">
              <ShieldCheck size={280} className="text-emerald-400" />
            </div>
            <div className="flex items-center gap-4 mb-5 relative z-10">
              <div className="p-3 bg-emerald-600 rounded-2xl">
                <ShieldCheck size={24} className="text-white" />
              </div>
              <h4 className="text-xl font-black uppercase tracking-tighter">Insight de Futuro</h4>
            </div>
            <p className="text-emerald-100/80 leading-relaxed italic text-xl font-medium relative z-10 max-w-4xl">
              "{aiInsight}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
