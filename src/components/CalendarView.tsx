import React, { useState } from 'react';
import { motion } from 'motion/react';
import { DateTime } from 'luxon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faWallet, faArrowTrendDown, faFileInvoiceDollar, faCalendarDays, faCalendarWeek, faCalendarDay } from '@fortawesome/free-solid-svg-icons';
import { Income } from './IncomeModal';
import { Debt } from './DebtModal';
import { Bill } from './BillModal';
import { cn } from '../lib/utils';

interface CalendarViewProps {
  incomes: Income[];
  debts: Debt[];
  bills?: Bill[];
  calendarStartDate?: string;
  debtStartDate?: string;
  targetMonths: number;
}

type ViewMode = 'month' | 'week' | 'day';

export const CalendarView: React.FC<CalendarViewProps> = ({ incomes, debts, bills = [], calendarStartDate, debtStartDate, targetMonths }) => {
  const [currentDate, setCurrentDate] = useState(DateTime.now());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const getDays = () => {
    let start, end;
    if (viewMode === 'month') {
      start = currentDate.startOf('month').startOf('week');
      end = currentDate.endOf('month').endOf('week');
    } else if (viewMode === 'week') {
      start = currentDate.startOf('week');
      end = currentDate.endOf('week');
    } else {
      start = currentDate.startOf('day');
      end = currentDate.endOf('day');
    }

    const days = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = day.plus({ days: 1 });
    }
    return days;
  };

  const days = getDays();

  const prev = () => {
    if (viewMode === 'month') setCurrentDate(currentDate.minus({ months: 1 }));
    else if (viewMode === 'week') setCurrentDate(currentDate.minus({ weeks: 1 }));
    else setCurrentDate(currentDate.minus({ days: 1 }));
  };

  const next = () => {
    if (viewMode === 'month') setCurrentDate(currentDate.plus({ months: 1 }));
    else if (viewMode === 'week') setCurrentDate(currentDate.plus({ weeks: 1 }));
    else setCurrentDate(currentDate.plus({ days: 1 }));
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

  const calculateMonthlyPaymentForDebt = (debt: Debt, months: number) => {
    if (debt.type === 'credit_card') {
      return debt.mandatoryPayment || 0;
    } else if (debt.type === 'installment') {
      return debt.amount / (debt.remainingMonths || 1);
    } else {
      const r = debt.rate / 100 / 12;
      const n = months;
      return r === 0 ? debt.amount / n : (debt.amount * r) / (1 - Math.pow(1 + r, -n));
    }
  };

  const calStart = calendarStartDate ? DateTime.fromISO(calendarStartDate).startOf('day') : null;
  const debtStart = debtStartDate ? DateTime.fromISO(debtStartDate).startOf('day') : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bento-panel p-4 md:p-8 rounded-3xl flex-1 flex flex-col min-h-[600px]"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <h2 className="text-xl md:text-2xl font-medium font-mono text-[var(--color-swamp-green-light)] capitalize">
          {viewMode === 'month' && currentDate.toFormat('LLLL yyyy', { locale: 'ru' })}
          {viewMode === 'week' && `Неделя ${currentDate.startOf('week').toFormat('d MMM')} - ${currentDate.endOf('week').toFormat('d MMM yyyy', { locale: 'ru' })}`}
          {viewMode === 'day' && currentDate.toFormat('d LLLL yyyy', { locale: 'ru' })}
        </h2>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="flex bg-[rgba(0,0,0,0.2)] p-1 rounded-xl border border-[var(--color-border-line)]">
            <button onClick={() => setViewMode('month')} className={cn("px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all", viewMode === 'month' ? "bg-[var(--color-panel)] text-white" : "text-[var(--color-text-muted)] hover:text-white")} title="Месяц">
              <FontAwesomeIcon icon={faCalendarDays} />
            </button>
            <button onClick={() => setViewMode('week')} className={cn("px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all", viewMode === 'week' ? "bg-[var(--color-panel)] text-white" : "text-[var(--color-text-muted)] hover:text-white")} title="Неделя">
              <FontAwesomeIcon icon={faCalendarWeek} />
            </button>
            <button onClick={() => setViewMode('day')} className={cn("px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all", viewMode === 'day' ? "bg-[var(--color-panel)] text-white" : "text-[var(--color-text-muted)] hover:text-white")} title="День">
              <FontAwesomeIcon icon={faCalendarDay} />
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={prev} className="p-2 bg-[rgba(0,0,0,0.2)] hover:bg-[rgba(0,0,0,0.4)] rounded-xl transition-colors">
              <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button onClick={next} className="p-2 bg-[rgba(0,0,0,0.2)] hover:bg-[rgba(0,0,0,0.4)] rounded-xl transition-colors">
              <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className={cn("grid gap-2 md:gap-4 flex-1", viewMode === 'day' ? "grid-cols-1" : "grid-cols-7")}>
        {viewMode !== 'day' && ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
          <div key={d} className="text-center text-xs md:text-sm text-[var(--color-text-muted)] font-medium mb-1 md:mb-2">{d}</div>
        ))}
        
        {days.map((d, i) => {
          const isCurrentMonth = d.month === currentDate.month;
          const isToday = d.hasSame(DateTime.now(), 'day');
          const dStart = d.startOf('day');
          
          let dayIncomes: any[] = [];
          if (!calStart || dStart >= calStart) {
            dayIncomes = incomes.flatMap(inc => {
              if (Array.isArray(inc.dates)) {
                if (inc.dates.includes(d.day)) {
                  return [{ ...inc, displayAmount: inc.amount / inc.dates.length, displayLabel: inc.name }];
                }
              } else if (inc.dates.type === 'fixed' && inc.dates.payments) {
                const payments = inc.dates.payments.filter(p => p.date === d.day);
                return payments.map(p => ({ ...inc, displayAmount: p.amount, displayLabel: p.label || inc.name }));
              } else if (inc.dates.type === 'interval' && inc.dates.interval) {
                const intv = inc.dates.interval;
                const start = DateTime.fromISO(intv.startDate).startOf('day');
                const current = d.startOf('day');
                if (current >= start) {
                  if (intv.intervalType === 'months') {
                    const diffMonths = Math.round(current.diff(start, 'months').months);
                    if (diffMonths >= 0 && diffMonths % intv.intervalValue === 0) {
                      const expectedDate = start.plus({ months: diffMonths });
                      if (current.hasSame(expectedDate, 'day')) {
                        return [{ ...inc, displayAmount: intv.amount, displayLabel: intv.label || inc.name }];
                      }
                    }
                  } else {
                    const diffDays = Math.round(current.diff(start, 'days').days);
                    if (diffDays >= 0 && diffDays % (intv.intervalValue || intv.intervalDays || 1) === 0) {
                      return [{ ...inc, displayAmount: intv.amount, displayLabel: intv.label || inc.name }];
                    }
                  }
                }
              }
              return [];
            });
          }

          let dayDebts: any[] = [];
          if ((!calStart || dStart >= calStart) && (!debtStart || dStart >= debtStart)) {
            dayDebts = debts.flatMap(debt => {
              if (debt.startDate && dStart < DateTime.fromISO(debt.startDate).startOf('day')) return [];

              if (debt.type === 'split' && debt.schedule) {
                const scheduleItems = debt.schedule.filter(item => {
                  const itemDate = DateTime.fromISO(item.date);
                  return d.hasSame(itemDate, 'day');
                });
                return scheduleItems.map(item => ({ ...debt, displayAmount: item.amount }));
              } else if (debt.paymentDate === d.day) {
                const payment = calculateMonthlyPaymentForDebt(debt, targetMonths);
                return [{ ...debt, displayAmount: payment }];
              }
              return [];
            });
          }

          let dayBills: any[] = [];
          if (!calStart || dStart >= calStart) {
            dayBills = bills.filter(bill => bill.dueDate === d.day).map(bill => ({
              ...bill,
              displayAmount: bill.amount,
              displayLabel: bill.name
            }));
          }

          return (
            <div 
              key={i} 
              className={cn(
                "p-1.5 md:p-3 rounded-xl md:rounded-2xl border transition-colors flex flex-col gap-1",
                viewMode === 'day' ? "min-h-[400px]" : viewMode === 'week' ? "min-h-[200px]" : "min-h-[80px] md:min-h-[100px]",
                isCurrentMonth || viewMode !== 'month' ? "bg-[rgba(0,0,0,0.2)] border-[var(--color-border-line)]" : "bg-transparent border-transparent opacity-30",
                isToday && "border-[var(--color-swamp-green-light)] bg-[rgba(82,99,84,0.1)]"
              )}
            >
              <div className={cn("text-right font-mono text-xs md:text-sm mb-1", isToday ? "text-[var(--color-swamp-green-light)] font-bold" : "text-[var(--color-text-muted)]")}>
                {viewMode === 'day' ? d.toFormat('dd MMMM yyyy', { locale: 'ru' }) : d.day}
              </div>
              
              <div className={cn("flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar", viewMode === 'day' && "gap-3")}>
                {dayIncomes.map((inc, idx) => (
                  <div key={`inc-${inc.id}-${idx}`} className={cn("rounded-md md:rounded-lg bg-[var(--color-swamp-green-dark)] text-[var(--color-swamp-green-light)] flex flex-col group relative", viewMode === 'day' ? "p-3 text-sm" : "p-1.5 text-[10px] md:text-xs gap-0.5")} title={inc.displayLabel}>
                    <span className="truncate mr-1 font-medium"><FontAwesomeIcon icon={faWallet} className={cn("inline mr-1", viewMode === 'day' ? "w-4 h-4" : "w-2 h-2 md:w-3 md:h-3")}/>{inc.displayLabel}</span>
                    <span className={cn("font-mono opacity-80", viewMode === 'day' ? "text-lg mt-1" : "text-[9px] md:text-[10px]")}>{formatCurrency(inc.displayAmount)}</span>
                  </div>
                ))}
                {dayDebts.map((debt, idx) => (
                  <div key={`debt-${debt.id}-${idx}`} className={cn("rounded-md md:rounded-lg bg-[var(--color-ash-red-dark)] text-[var(--color-ash-red-light)] flex flex-col group relative", viewMode === 'day' ? "p-3 text-sm" : "p-1.5 text-[10px] md:text-xs gap-0.5")} title={debt.name}>
                    <span className="truncate mr-1 font-medium"><FontAwesomeIcon icon={faArrowTrendDown} className={cn("inline mr-1", viewMode === 'day' ? "w-4 h-4" : "w-2 h-2 md:w-3 md:h-3")}/>{debt.name}</span>
                    {debt.displayAmount > 0 && (
                      <span className={cn("font-mono opacity-80", viewMode === 'day' ? "text-lg mt-1" : "text-[9px] md:text-[10px]")}>{formatCurrency(debt.displayAmount)}</span>
                    )}
                  </div>
                ))}
                {dayBills.map((bill, idx) => (
                  <div key={`bill-${bill.id}-${idx}`} className={cn("rounded-md md:rounded-lg bg-[rgba(140,100,74,0.3)] text-yellow-400/90 flex flex-col group relative", viewMode === 'day' ? "p-3 text-sm" : "p-1.5 text-[10px] md:text-xs gap-0.5")} title={bill.displayLabel}>
                    <span className="truncate mr-1 font-medium"><FontAwesomeIcon icon={faFileInvoiceDollar} className={cn("inline mr-1", viewMode === 'day' ? "w-4 h-4" : "w-2 h-2 md:w-3 md:h-3")}/>{bill.displayLabel}</span>
                    <span className={cn("font-mono opacity-80", viewMode === 'day' ? "text-lg mt-1" : "text-[9px] md:text-[10px]")}>{formatCurrency(bill.displayAmount)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
