import React, { useState, useEffect } from 'react';
import { User, WorkerData, PayrollCalculation } from '../types';
import { calculatePayroll } from '../utils/payroll';
import EmployeeForm from './EmployeeForm';
import DailyHoursCalendar from './DailyHoursCalendar';
import PayrollResult from './PayrollResult';
import ReportTab from './ReportTab';
import TaxTables from './TaxTables';
import { Calculator, LogOut, Calendar, FileSpreadsheet, SlidersHorizontal, Landmark, Check } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firebaseError';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const defaultWorkerData: WorkerData = {
  hourlyRate: 10,
  hoursWorked: 0,
  dailyAllowance: 60,
  daysWorked: 0,
  seniority: 0,
  bonuses: 0,
  expenses: 0,
  monthlyHolidaySubsidy: 0,
  monthlyChristmasSubsidy: 0,
  taxRegime: 'Normal',
  maritalStatus: 'Não Casado',
  dependents: 0,
  hasDisability: false,
};

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'calendar' | 'calculator' | 'report' | 'taxes'>('calendar');
  
  // Data for Calendar View
  const [calendarWorkerData, setCalendarWorkerData] = useState<WorkerData>({ ...defaultWorkerData });
  const [calendarResult, setCalendarResult] = useState<PayrollCalculation | null>(null);

  // Data for Standalone Calculator View
  const [manualWorkerData, setManualWorkerData] = useState<WorkerData>({
    ...defaultWorkerData,
    hoursWorked: 160,
    daysWorked: 20,
  });
  const [manualResult, setManualResult] = useState<PayrollCalculation | null>(null);

  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Load saved settings from Firestore
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.workerSettings) {
            setCalendarWorkerData(prev => ({ ...prev, ...data.workerSettings, hoursWorked: prev.hoursWorked, daysWorked: prev.daysWorked }));
            setManualWorkerData(prev => ({ ...prev, ...data.workerSettings }));
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, [user.id]);

  // Auto-calculate for Calendar View whenever calendar data changes
  useEffect(() => {
    const res = calculatePayroll(calendarWorkerData);
    setCalendarResult(res);
  }, [calendarWorkerData]);

  // Auto-calculate initial manual result
  useEffect(() => {
    const res = calculatePayroll(manualWorkerData);
    setManualResult(res);
  }, [manualWorkerData]);

  const handleApplyCalendarTotals = (totalHours: number, totalAllowanceDays: number) => {
    setCalendarWorkerData(prev => ({
      ...prev,
      hoursWorked: totalHours,
      daysWorked: totalAllowanceDays,
    }));
  };

  const handleSaveWorkerData = async (data: WorkerData, isManual: boolean) => {
    try {
      // Save to Firebase
      await setDoc(doc(db, 'users', user.id), { workerSettings: data }, { merge: true });
      
      // Update results
      if (isManual) {
        setManualResult(calculatePayroll(data));
      } else {
        setCalendarResult(calculatePayroll(data));
      }

      // Show temporary success feedback
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans selection:bg-cyan-500/30 relative">
      {/* Toast Notification */}
      {showSaveSuccess && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-emerald-950 border border-emerald-900 text-emerald-400 px-6 py-3 shadow-lg shadow-emerald-900/20 flex items-center gap-3">
            <Check className="w-5 h-5" />
            <span className="text-sm font-bold tracking-wider uppercase">Dados Salvos com Sucesso</span>
          </div>
        </div>
      )}

      <header className="bg-neutral-950 border-b border-neutral-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-950 border border-cyan-800 rounded-none flex items-center justify-center">
              <Calculator className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-100 leading-tight tracking-tight uppercase">Calculadora de Salários</h1>
              <p className="text-xs text-neutral-500 font-medium hidden sm:block tracking-widest uppercase">Cálculo de Vencimentos & Diárias</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-neutral-300">{user.name}</p>
              <p className="text-xs text-neutral-500">{user.company}</p>
            </div>
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-400 hover:text-cyan-400 hover:bg-cyan-950/30 rounded-none border border-transparent hover:border-cyan-900 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">TERMINAR SESSÃO</span>
            </button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-8 border-t border-neutral-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-3 text-xs tracking-widest uppercase font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'calendar' 
                ? 'border-cyan-400 text-cyan-400' 
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Registro de Horas (Calendário)
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`py-3 text-xs tracking-widest uppercase font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'calculator' 
                ? 'border-cyan-400 text-cyan-400' 
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Calculadora Directa
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`py-3 text-xs tracking-widest uppercase font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'report' 
                ? 'border-cyan-400 text-cyan-400' 
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Planilha & Relatório
          </button>
          <button
            onClick={() => setActiveTab('taxes')}
            className={`py-3 text-xs tracking-widest uppercase font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'taxes' 
                ? 'border-cyan-400 text-cyan-400' 
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Landmark className="w-4 h-4" />
            Tabelas de Impostos
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <DailyHoursCalendar 
                userId={user.id} 
                onApplyTotals={handleApplyCalendarTotals} 
              />
              
              <EmployeeForm 
                data={calendarWorkerData} 
                onChange={setCalendarWorkerData} 
                onCalculate={() => handleSaveWorkerData(calendarWorkerData, false)} 
                mode="calendar"
              />
            </div>
            
            <div className="lg:col-span-4">
              <div className="sticky top-24">
                <PayrollResult result={calendarResult} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <EmployeeForm 
                data={manualWorkerData} 
                onChange={setManualWorkerData} 
                onCalculate={() => handleSaveWorkerData(manualWorkerData, true)} 
                mode="calculator"
              />
            </div>
            
            <div className="lg:col-span-4">
              <div className="sticky top-24">
                <PayrollResult result={manualResult} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <ReportTab 
            userId={user.id} 
            result={calendarResult || manualResult} 
            workerData={calendarWorkerData} 
          />
        )}

        {activeTab === 'taxes' && (
          <TaxTables result={calendarResult || manualResult} />
        )}
      </main>
    </div>
  );
}
