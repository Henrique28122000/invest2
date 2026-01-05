
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
import { Calculator, ShieldCheck } from 'lucide-react';
import { getSimulationInsight } from '../services/market';

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
  const insight = getSimulationInsight(finalResult.total, parseFloat(monthlyAport) || 0, years);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header>
        <h2 className="text-4xl font-black uppercase tracking-tighter">Projeção de Futuro</h2>
        <p className="text-slate-500">Quanto você terá investindo com consistência?</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl"><Calculator size={24} /></div>
            <h4 className="text-2xl font-black uppercase tracking-tighter">Variáveis</h4>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-slate-500">Patrimônio Inicial (R$)</label>
              <input type="text" className="w-full p-4 bg-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={initialCapital} onChange={(e) => setInitialCapital(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-slate-500">Aporte Mensal (R$)</label>
              <input type="text" className="w-full p-4 bg-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={monthlyAport} onChange={(e) => setMonthlyAport(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-slate-500">Taxa Anual (%)</label>
              <input type="text" className="w-full p-4 bg-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase">
                <span>Prazo</span>
                <span className="text-indigo-400">{years} Anos</span>
              </div>
              <input type="range" min="1" max="50" className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" value={years} onChange={(e) => setYears(Number(e.target.value))} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={simulationData}>
                <defs>
                  <linearGradient id="simColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={4} fill="url(#simColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-10 bg-emerald-500/10 border border-emerald-500/20 rounded-[3rem]">
            <div className="flex items-center gap-4 mb-4">
              <ShieldCheck size={24} className="text-emerald-400" />
              <h4 className="text-xl font-black uppercase text-emerald-400">Projeção Final</h4>
            </div>
            <p className="text-2xl font-black text-white">R$ {finalResult.total.toLocaleString('pt-BR')}</p>
            <p className="text-slate-500 text-sm mt-2">"{insight}"</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
