import React from 'react';
import { PayrollCalculation } from '../types';
import { Wallet, PieChart, TrendingDown, Receipt } from 'lucide-react';

interface PayrollResultProps {
  result: PayrollCalculation | null;
}

export default function PayrollResult({ result }: PayrollResultProps) {
  if (!result) {
    return (
      <div className="bg-neutral-800 border border-neutral-700 p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
        <PieChart className="w-16 h-16 text-neutral-800 mb-4" />
        <h3 className="text-lg font-medium text-neutral-400">AGUARDANDO PROCESSAMENTO</h3>
        <p className="text-neutral-600 mt-2 max-w-sm text-sm">
          Preencha os dados do funcionário e clique em "Processar Salário" para ver os resultados.
        </p>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(val);
  };

  // Simple percentages for the visual bar (based on Gross + TaxFreeIncome)
  const totalIncoming = result.grossSalary;
  const irsPct = (result.irsRetention / totalIncoming) * 100 || 0;
  const ssPct = (result.socialSecurity / totalIncoming) * 100 || 0;
  const netPct = (result.netSalary / totalIncoming) * 100 || 0;

  return (
    <div className="bg-neutral-800 rounded-none border border-neutral-700 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-neutral-700 bg-neutral-950">
        <h2 className="text-lg font-semibold text-neutral-100 flex items-center gap-2 uppercase tracking-wide">
          <Receipt className="w-5 h-5 text-cyan-500" />
          Recibo de Vencimento
        </h2>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-6">
        
        {/* Main Highlight */}
        <div className="bg-gradient-to-br from-cyan-900 to-indigo-950 rounded-none p-6 text-white border border-cyan-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-cyan-400 opacity-5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-2 text-cyan-200 mb-2">
            <Wallet className="w-5 h-5" />
            <span className="font-medium text-sm tracking-widest uppercase">Salário Líquido a Receber</span>
          </div>
          <div className="text-5xl font-extrabold tracking-tight text-cyan-50">
            {formatCurrency(result.netSalary)}
          </div>
        </div>

        {/* Breakdown List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-neutral-800">
            <span className="text-neutral-400 text-sm tracking-wide">Remuneração Base</span>
            <span className="font-medium text-neutral-200">{formatCurrency(result.basePay)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-neutral-800">
            <span className="text-neutral-400 text-sm tracking-wide">Ajudas de Custo Totais</span>
            <span className="font-medium text-neutral-200">{formatCurrency(result.totalAllowances)}</span>
          </div>
          
          <div className="pt-2 mt-2">
            <div className="flex justify-between items-center py-2">
              <span className="text-neutral-200 font-semibold tracking-wide uppercase text-sm">Remuneração Bruta Total</span>
              <span className="font-bold text-cyan-400">{formatCurrency(result.grossSalary)}</span>
            </div>
          </div>
        </div>

        {/* Deductions */}
        <div className="bg-red-950/20 rounded-none p-4 border border-red-900/50 mt-auto">
          <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2 uppercase tracking-widest">
            <TrendingDown className="w-4 h-4" /> Descontos
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-red-300/70 tracking-wide">Retenção de IRS</span>
              <span className="font-medium text-red-400">-{formatCurrency(result.irsRetention)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-red-300/70 tracking-wide">Segurança Social (11%)</span>
              <span className="font-medium text-red-400">-{formatCurrency(result.socialSecurity)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-semibold border-t border-red-900/50 pt-2 mt-2">
              <span className="text-red-400 tracking-wide uppercase">Total Descontos</span>
              <span className="text-red-500">-{formatCurrency(result.irsRetention + result.socialSecurity)}</span>
            </div>
          </div>
        </div>

        {/* Visual Bar */}
        <div>
          <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2">Distribuição do Bruto</h4>
          <div className="h-2 w-full bg-neutral-800 rounded-none flex overflow-hidden">
            <div 
              style={{ width: `${netPct}%` }} 
              className="bg-cyan-500 h-full"
              title={`Líquido: ${netPct.toFixed(1)}%`}
            ></div>
            <div 
              style={{ width: `${irsPct}%` }} 
              className="bg-red-500 h-full"
              title={`IRS: ${irsPct.toFixed(1)}%`}
            ></div>
            <div 
              style={{ width: `${ssPct}%` }} 
              className="bg-indigo-500 h-full"
              title={`Segurança Social: ${ssPct.toFixed(1)}%`}
            ></div>
          </div>
          <div className="flex gap-4 mt-3 text-xs tracking-wide text-neutral-400 uppercase">
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-none bg-cyan-500"></div> Líquido</div>
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-none bg-red-500"></div> IRS</div>
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-none bg-indigo-500"></div> Seg. Soc.</div>
          </div>
        </div>

      </div>
    </div>
  );
}
