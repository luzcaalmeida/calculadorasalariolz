import React from 'react';
import { WorkerData, TaxRegime, MaritalStatus } from '../types';
import { Calculator, Settings2, User, Coins, Briefcase, Save } from 'lucide-react';

interface EmployeeFormProps {
  data: WorkerData;
  onChange: (data: WorkerData) => void;
  onCalculate: () => void;
  mode?: 'calendar' | 'calculator';
}

export default function EmployeeForm({ data, onChange, onCalculate, mode = 'calculator' }: EmployeeFormProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let parsedValue: any = value;
    
    if (type === 'number') {
      parsedValue = parseFloat(value) || 0;
    } else if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    }

    onChange({
      ...data,
      [name]: parsedValue
    });
  };

  return (
    <div className="bg-neutral-800 rounded-none border border-neutral-700 overflow-hidden">
      <div className="p-4 border-b border-neutral-700 bg-neutral-950 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-100 flex items-center gap-2 tracking-wide uppercase">
          <Settings2 className="w-5 h-5 text-cyan-500" />
          {mode === 'calendar' ? 'Taxas & Situação Fiscal' : 'Parâmetros da Calculadora'}
        </h2>
        {mode === 'calendar' && (
          <span className="text-xs text-cyan-400 bg-cyan-950/50 px-2 py-1 border border-cyan-900/50 uppercase tracking-widest">
            Cálculo Automático pelo Calendário
          </span>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Valores de Hora e Diária */}
        <section>
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Coins className="w-4 h-4 text-cyan-600" /> Valores Base
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">Valor Hora (€/h)</label>
              <input 
                type="number" 
                name="hourlyRate" 
                value={data.hourlyRate || ''} 
                onChange={handleChange} 
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-none focus:outline-none focus:border-cyan-500 text-neutral-100 transition-colors" 
              />
            </div>

            {mode === 'calendar' ? (
              <div className="bg-cyan-950/30 border border-cyan-900/60 p-3 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">Horas do Calendário</span>
                <span className="text-2xl font-black text-cyan-300">{data.hoursWorked || 0}h</span>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">Horas Trabalhadas</label>
                <input 
                  type="number" 
                  name="hoursWorked" 
                  value={data.hoursWorked || ''} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 text-lg font-bold bg-cyan-950/30 border border-cyan-900/60 rounded-none focus:outline-none focus:border-cyan-500 text-cyan-300 transition-colors" 
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">Valor da Diária (€)</label>
              <input 
                type="number" 
                name="dailyAllowance" 
                value={data.dailyAllowance || ''} 
                onChange={handleChange} 
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-none focus:outline-none focus:border-indigo-500 text-neutral-100 transition-colors" 
              />
            </div>

            {mode === 'calendar' ? (
              <div className="bg-indigo-950/30 border border-indigo-900/60 p-3 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Diárias do Calendário</span>
                <span className="text-2xl font-black text-indigo-300">{data.daysWorked || 0} {data.daysWorked === 1 ? 'dia' : 'dias'}</span>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">Dias com Diária</label>
                <input 
                  type="number" 
                  name="daysWorked" 
                  value={data.daysWorked || ''} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 text-lg font-bold bg-indigo-950/30 border border-indigo-900/60 rounded-none focus:outline-none focus:border-indigo-500 text-indigo-300 transition-colors" 
                />
              </div>
            )}
          </div>
        </section>

        {/* Situação Fiscal (IRS) */}
        <section>
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-600" /> Situação Fiscal (IRS & SS)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">Estado Civil</label>
              <select name="maritalStatus" value={data.maritalStatus} onChange={handleChange} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-none focus:outline-none focus:border-cyan-500 text-neutral-100 transition-colors appearance-none">
                <option value="Não Casado">Não Casado</option>
                <option value="Casado (Único Titular)">Casado (Único Titular)</option>
                <option value="Casado (Dois Titulares)">Casado (Dois Titulares)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">Nº Dependentes</label>
              <input type="number" name="dependents" min="0" value={data.dependents} onChange={handleChange} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-none focus:outline-none focus:border-cyan-500 text-neutral-100 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1 uppercase tracking-wider">Regime Fiscal</label>
              <select name="taxRegime" value={data.taxRegime} onChange={handleChange} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-none focus:outline-none focus:border-cyan-500 text-neutral-100 transition-colors appearance-none">
                <option value="Normal">Normal</option>
                <option value="RNH">RNH</option>
                <option value="IRS Jovem">IRS Jovem</option>
              </select>
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" name="hasDisability" checked={data.hasDisability} onChange={handleChange} className="w-4 h-4 text-cyan-500 bg-neutral-950 border-neutral-800 rounded-none focus:ring-0 focus:ring-offset-0 transition-colors" />
                <span className="text-sm font-medium text-neutral-400 group-hover:text-neutral-200 transition-colors">Portador de Deficiência</span>
              </label>
            </div>
          </div>
        </section>

      </div>
      <div className="p-4 bg-neutral-950 border-t border-neutral-800">
        <button 
          onClick={onCalculate}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-cyan-500 text-black font-bold uppercase tracking-wider rounded-none hover:bg-cyan-400 transition-colors"
        >
          <Save className="w-5 h-5" />
          Salvar Dados
        </button>
      </div>
    </div>
  );
}
