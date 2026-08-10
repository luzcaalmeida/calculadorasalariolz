import React from 'react';
import { Info, Receipt, FileText, Landmark, Calculator } from 'lucide-react';
import { PayrollCalculation } from '../types';

interface TaxTablesProps {
  result: PayrollCalculation | null;
}

export default function TaxTables({ result }: TaxTablesProps) {
  const [simulatorValue, setSimulatorValue] = React.useState<string>('');
  const [bracketResult, setBracketResult] = React.useState<{ limit: string, rate: string } | null>(null);
  
  const totalTaxes = result ? (result.irsAmount + result.socialSecurityAmount) : 0;

  const handleCheckBracket = () => {
    const val = parseFloat(simulatorValue);
    if (isNaN(val) || val <= 0) {
      setBracketResult(null);
      return;
    }
    
    if (val <= 1000) setBracketResult({ limit: "Até 1.000,00", rate: "14,50%" });
    else if (val <= 2000) setBracketResult({ limit: "Até 2.000,00", rate: "28,50%" });
    else if (val <= 3000) setBracketResult({ limit: "Até 3.000,00", rate: "37,00%" });
    else if (val <= 4000) setBracketResult({ limit: "Até 4.000,00", rate: "43,50%" });
    else if (val <= 5000) setBracketResult({ limit: "Até 5.000,00", rate: "45,00%" });
    else setBracketResult({ limit: "Mais de 5.000,00...", rate: "48,00% (Máxima)" });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Segurança Social */}
        <div className="bg-neutral-800 border border-neutral-700 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-neutral-700 bg-neutral-950 flex items-center gap-3">
            <Receipt className="w-5 h-5 text-cyan-500" />
            <h3 className="text-lg font-bold text-neutral-100 uppercase tracking-widest">Segurança Social</h3>
          </div>
          <div className="p-6 flex-1">
            <p className="text-sm text-neutral-400 mb-6">
              A Taxa Social Única (TSU) é a contribuição a pagar à Segurança Social pelos trabalhadores e entidades empregadoras.
            </p>
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-900 text-neutral-500 uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-4 py-3 font-semibold">Regime Geral</th>
                  <th className="px-4 py-3 font-semibold text-right">Taxa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700/50">
                <tr>
                  <td className="px-4 py-3 text-neutral-300 font-medium">Trabalhador (Retenção)</td>
                  <td className="px-4 py-3 text-cyan-400 font-bold text-right">11,00%</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-neutral-300 font-medium">Entidade Empregadora</td>
                  <td className="px-4 py-3 text-cyan-400 font-bold text-right">23,75%</td>
                </tr>
                <tr className="bg-neutral-900/50">
                  <td className="px-4 py-3 text-neutral-100 font-bold">Taxa Global (TSU)</td>
                  <td className="px-4 py-3 text-cyan-300 font-black text-right">34,75%</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-6 flex items-start gap-3 bg-cyan-950/20 p-4 border border-cyan-900/30">
              <Info className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
              <p className="text-xs text-neutral-400">
                A contribuição do trabalhador (11%) é descontada diretamente no recibo de vencimento, incidindo sobre a remuneração ilíquida sujeita.
              </p>
            </div>
          </div>
        </div>

        {/* IRS - Retenção na Fonte */}
        <div className="bg-neutral-800 border border-neutral-700 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-neutral-700 bg-neutral-950 flex items-center gap-3">
            <FileText className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-neutral-100 uppercase tracking-widest">IRS (Retenção na Fonte)</h3>
          </div>
          <div className="p-6 flex-1">
            <p className="text-sm text-neutral-400 mb-6">
              Exemplo de taxas de retenção na fonte para Trabalhadores por Conta de Outrem (Não Casados, Sem Dependentes). 
              <br/><span className="text-xs text-neutral-500">Valores de referência - Tabelas 2024 Continente.</span>
            </p>

            <div className="mb-6 bg-indigo-950/30 border border-indigo-900/50 p-4">
              <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Simulador de Escalão IRS</label>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <input
                  type="number"
                  value={simulatorValue}
                  onChange={(e) => setSimulatorValue(e.target.value)}
                  placeholder="Ex: 1500"
                  className="w-full sm:w-auto flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 focus:border-indigo-500 focus:outline-none text-neutral-200"
                />
                <button 
                  onClick={handleCheckBracket}
                  className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold tracking-wider uppercase transition-colors"
                >
                  Consultar Escalão
                </button>
              </div>
            </div>
            
            {bracketResult && (
              <div className="bg-neutral-900 border border-indigo-500/30 p-4 flex justify-between items-center animate-in fade-in zoom-in duration-300">
                <div>
                  <p className="text-xs text-neutral-400 uppercase tracking-widest mb-1">Escalão Aplicável</p>
                  <p className="text-lg font-bold text-neutral-200">{bracketResult.limit}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-400 uppercase tracking-widest mb-1">Taxa Máxima</p>
                  <p className="text-2xl font-black text-indigo-400">{bracketResult.rate}</p>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-start gap-3 bg-indigo-950/20 p-4 border border-indigo-900/30">
              <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-xs text-neutral-400">
                A partir de 2023, o modelo de retenção na fonte em Portugal passou a funcionar através de taxas marginais (semelhante ao cálculo anual do IRS), o que garante que aumentos brutos resultam sempre em aumentos líquidos.
              </p>
            </div>
          </div>
        </div>

        {/* Informações sobre Isenções */}
        <div className="bg-neutral-800 border border-neutral-700 overflow-hidden lg:col-span-2">
           <div className="p-4 border-b border-neutral-700 bg-neutral-950 flex items-center gap-3">
            <Info className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-bold text-neutral-100 uppercase tracking-widest">Informações de Isenção (Ajudas de Custo e Diárias)</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-bold text-neutral-300 uppercase tracking-wider mb-3">Diárias / Ajudas de Custo</h4>
              <p className="text-sm text-neutral-400 mb-4">
                As ajudas de custo diárias atribuídas para compensar despesas de deslocação estão isentas de IRS e Segurança Social até determinados limites legais.
              </p>
              <ul className="space-y-2 text-sm text-neutral-300">
                <li className="flex justify-between border-b border-neutral-700/50 pb-2">
                  <span>Deslocações Nacionais</span>
                  <span className="font-bold text-emerald-400">62,75 € / dia</span>
                </li>
                <li className="flex justify-between border-b border-neutral-700/50 pb-2">
                  <span>Deslocações Internacionais</span>
                  <span className="font-bold text-emerald-400">148,91 € / dia</span>
                </li>
              </ul>
              <p className="text-xs text-neutral-500 mt-3">
                Os valores que ultrapassem estes limites estão sujeitos a tributação de IRS e Segurança Social na parte excedente.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-bold text-neutral-300 uppercase tracking-wider mb-3">Subsídio de Refeição</h4>
              <p className="text-sm text-neutral-400 mb-4">
                O subsídio de refeição também beneficia de isenção de impostos até determinados tetos máximos (valores em 2024).
              </p>
              <ul className="space-y-2 text-sm text-neutral-300">
                <li className="flex justify-between border-b border-neutral-700/50 pb-2">
                  <span>Pago em Dinheiro</span>
                  <span className="font-bold text-emerald-400">6,00 € / dia</span>
                </li>
                <li className="flex justify-between border-b border-neutral-700/50 pb-2">
                  <span>Cartão ou Vale Refeição</span>
                  <span className="font-bold text-emerald-400">9,60 € / dia</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
