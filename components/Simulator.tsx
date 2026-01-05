
import React, { useState, useMemo, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { PortfolioItem } from '../types';
import { Sparkles, Calculator, Coins, TrendingUp } from 'lucide-react';
import { getSimulationInsight } from '../services/gemini';

interface SimulatorProps {
  portfolio: PortfolioItem[];
}

const Simulator: React.FC<SimulatorProps> = ({ portfolio }) => {
  const currentTotal = portfolio.reduce((acc, item) => acc + (item.quantity * item.asset.price), 0);
  
  // FIX: Usando string states para inputs ficarem limpos ao apagar
  const [initialCapital, setInitialCapital] = useState((currentTotal || 1000).toString());
  const [monthlyAport, setMonthlyAport] = useState('500');
  const [annualRate, setAnnualRate] = useState('12');
  const [years, setYears] = useState(10);
  const [aiInsight, setAiInsight] = useState('Analizando projeção...');

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

  useEffect(() => {
    getSimulationInsight(parseFloat(initialCapital) || 0, parseFloat(monthlyAport) || 0, years).then(setAiInsight);
  }, [initialCapital, monthlyAport, years]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header>
        <h2 className="text-3xl font-bold">Simulador de Futuro</h2>
        <p className="text-slate-400">Projeção matemática de juros compostos</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-[3rem] space-y-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <Calculator size={20} className="text-white" />
            </div>
            <h4 className="text-xl font-bold">Variáveis</h4>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Capital Inicial (R$)</label>
              <input 
                type="text" 
                className="w-full p-4 bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                value={initialCapital}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) setInitialCapital(val);
                }}
                placeholder="Ex: 1000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Aporte Mensal (R$)</label>
              <input 
                type="text" 
                className="w-full p-4 bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                value={monthlyAport}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) setMonthlyAport(val);
                }}
                placeholder="Ex: 500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Rentabilidade Anual (%)</label>
              <input 
                type="text" 
                className="w-full p-4 bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                value={annualRate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) setAnnualRate(val);
                }}
                placeholder="Ex: 12"
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-[10px] uppercase font-black text-slate-500">
                <span>Prazo</span>
                <span className="text-indigo-400 font-black">{years} Anos</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="50"
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800">
            <div className="p-6 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2rem] shadow-xl shadow-indigo-600/20">
              <p className="text-[10px] text-indigo-200 uppercase font-black tracking-widest mb-1">Montante Final</p>
              <p className="text-3xl font-black text-white">R$ {finalResult.total.toLocaleString('pt-BR')}</p>
              <div className="mt-4 flex items-center gap-2 text-[10px] text-indigo-100/60 font-bold">
                <TrendingUp size={12} />
                <span>Lucro Bruto: R$ {(finalResult.total - finalResult.invested).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-[3rem] h-[480px] shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-lg font-bold">Projeção de Longo Prazo</h4>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                  <span className="text-xs text-slate-400">Total</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-700 rounded-full" />
                  <span className="text-xs text-slate-400">Investido</span>
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
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }} 
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area name="Total" type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={4} fill="url(#simColor)" />
                <Area name="Investido" type="monotone" dataKey="invested" stroke="#334155" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-8 bg-indigo-600/10 border border-indigo-500/20 rounded-[2.5rem] relative overflow-hidden group shadow-lg">
            <div className="absolute top-[-20%] right-[-10%] opacity-5 group-hover:rotate-12 transition-transform duration-1000">
              <Sparkles size={240} className="text-indigo-400" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <Sparkles size={18} className="text-white" />
              </div>
              <h4 className="text-lg font-bold">Dica da IA B3</h4>
            </div>
            <p className="text-indigo-100/70 leading-relaxed italic text-lg">
              "{aiInsight}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
