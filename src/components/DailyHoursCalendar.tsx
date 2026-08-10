import React, { useState, useEffect } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  parseISO,
  isWeekend
} from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Check, X, Calendar as CalendarIcon, Clock, Briefcase } from 'lucide-react';
import { DailyLogEntry } from '../types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { db } from '../firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firebaseError';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface DailyHoursCalendarProps {
  userId: string;
  onApplyTotals: (totalHours: number, totalAllowanceDays: number) => void;
}

export default function DailyHoursCalendar({ userId, onApplyTotals }: DailyHoursCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<Record<string, DailyLogEntry>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Modal state
  const [modalHours, setModalHours] = useState<number>(8);
  const [modalAllowance, setModalAllowance] = useState<boolean>(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const q = query(collection(db, 'users', userId, 'hoursLog'));
        const snapshot = await getDocs(q);
        const fetchedLogs: Record<string, DailyLogEntry> = {};
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          fetchedLogs[data.date] = data as DailyLogEntry;
        });
        setLogs(fetchedLogs);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${userId}/hoursLog`);
      }
    };
    fetchLogs();
  }, [userId]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    const dateKey = format(day, 'yyyy-MM-dd');
    const existing = logs[dateKey];
    if (existing) {
      setModalHours(existing.normalHours);
      setModalAllowance(existing.hasDailyAllowance ?? existing.normalHours > 0);
    } else {
      const defaultHours = isWeekend(day) ? 0 : 8;
      setModalHours(defaultHours);
      setModalAllowance(defaultHours > 0);
    }
  };

  const handleHoursInputChange = (val: number) => {
    setModalHours(val);
    if (val > 0) {
      setModalAllowance(true);
    } else {
      setModalAllowance(false);
    }
  };

  const handleSaveModal = async () => {
    if (!selectedDate) return;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    
    try {
      if (modalHours === 0 && !modalAllowance) {
        await deleteDoc(doc(db, 'users', userId, 'hoursLog', dateKey));
        setLogs(prev => {
          const next = { ...prev };
          delete next[dateKey];
          return next;
        });
      } else {
        const entryData = {
          date: dateKey,
          normalHours: modalHours,
          hasDailyAllowance: modalAllowance,
          userId,
          updatedAt: serverTimestamp()
        };
        await setDoc(doc(db, 'users', userId, 'hoursLog', dateKey), entryData);
        setLogs(prev => ({
          ...prev,
          [dateKey]: { ...entryData, updatedAt: new Date().toISOString() } as unknown as DailyLogEntry
        }));
      }
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, `users/${userId}/hoursLog/${dateKey}`);
    }
    
    setSelectedDate(null);
  };

  const fillWeekdays = async () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    let day = start;
    
    try {
      const batch = writeBatch(db);
      const newLogs = { ...logs };
      
      while (day <= end) {
        if (!isWeekend(day)) {
          const dateKey = format(day, 'yyyy-MM-dd');
          const entryData = {
            date: dateKey,
            normalHours: 8,
            hasDailyAllowance: true,
            userId,
            updatedAt: serverTimestamp()
          };
          batch.set(doc(db, 'users', userId, 'hoursLog', dateKey), entryData);
          newLogs[dateKey] = { ...entryData, updatedAt: new Date().toISOString() } as unknown as DailyLogEntry;
        }
        day = addDays(day, 1);
      }
      
      await batch.commit();
      setLogs(newLogs);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}/hoursLog`);
    }
  };

  const clearMonth = async () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    let day = start;
    
    try {
      const batch = writeBatch(db);
      const newLogs = { ...logs };
      
      while (day <= end) {
        const dateKey = format(day, 'yyyy-MM-dd');
        if (newLogs[dateKey]) {
          batch.delete(doc(db, 'users', userId, 'hoursLog', dateKey));
          delete newLogs[dateKey];
        }
        day = addDays(day, 1);
      }
      
      await batch.commit();
      setLogs(newLogs);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}/hoursLog`);
    }
  };

  const currentMonthLogs = (Object.values(logs) as DailyLogEntry[]).filter(log => {
    const d = parseISO(log.date);
    return isSameMonth(d, currentDate);
  });

  const totalMonthlyHours = currentMonthLogs.reduce((acc, log) => acc + log.normalHours, 0);
  const totalMonthlyAllowanceDays = currentMonthLogs.filter(log => log.hasDailyAllowance && log.normalHours > 0).length;

  useEffect(() => {
    onApplyTotals(totalMonthlyHours, totalMonthlyAllowanceDays);
  }, [totalMonthlyHours, totalMonthlyAllowanceDays, currentDate]);

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const dateFormat = 'd';
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const dateKey = format(day, 'yyyy-MM-dd');
        const log = logs[dateKey];
        
        days.push(
          <div
            key={day.toString()}
            onClick={() => handleDayClick(cloneDay)}
            className={cn(
              "p-2 border border-neutral-800 h-24 flex flex-col justify-between cursor-pointer transition-all duration-300",
              !isSameMonth(day, monthStart) ? "bg-neutral-950 text-neutral-600" : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800",
              isSameDay(day, new Date()) && "border-cyan-500 bg-cyan-950/20"
            )}
          >
            <div className="flex justify-between items-start">
              <span className={cn("font-medium text-sm", isSameDay(day, new Date()) && "text-cyan-400")}>
                {formattedDate}
              </span>
              {log?.hasDailyAllowance && (
                <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-cyan-950 text-cyan-400 border border-cyan-800" title="Ajudas de Custo">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </div>
            {log?.normalHours > 0 && (
              <div className="text-xs font-semibold text-cyan-400 bg-cyan-950/50 rounded-sm px-1 py-0.5 self-end border border-cyan-900/50">
                {log.normalHours}h
              </div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return rows;
  };

  return (
    <div className="bg-neutral-800 rounded-none border border-neutral-700 overflow-hidden">
      <div className="p-4 border-b border-neutral-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-cyan-500" />
          <h2 className="text-lg font-semibold text-neutral-100 tracking-wide">CALENDÁRIO DE HORAS</h2>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-1 hover:bg-neutral-800 rounded-none text-neutral-400 transition-colors border border-transparent hover:border-neutral-700">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-medium text-neutral-200 w-32 text-center capitalize tracking-wider text-sm">
            {format(currentDate, 'MMMM yyyy', { locale: pt })}
          </span>
          <button onClick={nextMonth} className="p-1 hover:bg-neutral-800 rounded-none text-neutral-400 transition-colors border border-transparent hover:border-neutral-700">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Large Total Hours and Allowance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-neutral-950 border-b border-neutral-800">
        <div className="bg-neutral-900/90 border border-cyan-900/60 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block mb-1">
              Total de Horas no Mês
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-cyan-400 tracking-tight">
                {totalMonthlyHours}
              </span>
              <span className="text-base font-bold text-cyan-500/80 uppercase tracking-wider">horas</span>
            </div>
          </div>
          <div className="p-3 bg-cyan-950/80 rounded-none border border-cyan-800/60 text-cyan-400">
            <Clock className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-neutral-900/90 border border-indigo-900/60 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block mb-1">
              Total de Diárias no Mês
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-indigo-400 tracking-tight">
                {totalMonthlyAllowanceDays}
              </span>
              <span className="text-base font-bold text-indigo-500/80 uppercase tracking-wider">
                {totalMonthlyAllowanceDays === 1 ? 'diária' : 'diárias'}
              </span>
            </div>
          </div>
          <div className="p-3 bg-indigo-950/80 rounded-none border border-indigo-800/60 text-indigo-400">
            <Briefcase className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2">
          <button onClick={fillWeekdays} className="text-xs tracking-wide px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-none hover:border-cyan-500 text-neutral-300 font-medium transition-colors">
            PREENCHER DIAS ÚTEIS
          </button>
          <button onClick={clearMonth} className="text-xs tracking-wide px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-none hover:border-red-500 hover:text-red-400 text-neutral-300 font-medium transition-colors">
            LIMPAR MÊS
          </button>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-7 border-b border-neutral-800 bg-neutral-950">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="py-2 text-center text-xs font-semibold text-neutral-500 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>
        <div>
          {renderCells()}
        </div>
      </div>

      {selectedDate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 shadow-2xl w-full max-w-sm overflow-hidden rounded-none">
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950">
              <h3 className="font-semibold text-neutral-100 tracking-wide uppercase text-sm">
                {format(selectedDate, "d 'de' MMMM", { locale: pt })}
              </h3>
              <button onClick={() => setSelectedDate(null)} className="text-neutral-500 hover:text-cyan-400 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-neutral-300">Horas Trabalhadas</label>
                  <div className="flex gap-2">
                    {[10, 8, 6].map(h => (
                      <button 
                        key={h}
                        onClick={() => handleHoursInputChange(h)}
                        className={cn(
                          "text-xs px-2 py-1 rounded-sm border transition-colors",
                          modalHours === h 
                            ? "border-cyan-500 text-cyan-400 bg-cyan-950" 
                            : "border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-500"
                        )}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>
                <input 
                  type="number" 
                  min="0" 
                  max="24" 
                  step="1"
                  value={modalHours}
                  onChange={(e) => handleHoursInputChange(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-none focus:outline-none focus:border-cyan-500 text-neutral-100"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={modalAllowance}
                  onChange={(e) => setModalAllowance(e.target.checked)}
                  className="w-4 h-4 text-cyan-500 bg-neutral-900 border-neutral-700 rounded-none focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-sm font-medium text-neutral-400 group-hover:text-neutral-200 transition-colors">Inclui Ajudas de Custo (Diária)</span>
              </label>
            </div>
            <div className="p-4 border-t border-neutral-800 flex justify-end gap-2 bg-neutral-950">
              <button 
                onClick={() => setSelectedDate(null)}
                className="px-4 py-2 text-sm font-medium text-neutral-400 border border-neutral-700 rounded-none hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveModal}
                className="px-4 py-2 text-sm font-medium text-black bg-cyan-400 rounded-none hover:bg-cyan-300 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
