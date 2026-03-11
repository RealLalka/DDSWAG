import React, { useState } from 'react';
import { motion } from 'motion/react';
import { DateTime } from 'luxon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faWallet, faArrowTrendDown, faFileInvoiceDollar, faCalendarDays, faCalendarWeek, faCalendarDay, faList } from '@fortawesome/free-solid-svg-icons';
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

type ViewMode = 'month' | 'week' | 'day' | 'schedule';

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
    } else if (viewMode === 'day') {
      start = currentDate.startOf('day');
      end = currentDate.endOf('day');
    } else {
      // For schedule view, we might just want to show the current month's days that have events
      start = currentDate.startOf('month');
      end = currentDate.endOf('month');
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
    if (viewMode === 'month' || viewMode === 'schedule') setCurrentDate(currentDate.minus({ months: 1 }));
    else if (viewMode === 'week') setCurrentDate(currentDate.minus({ weeks: 1 }));
    else setCurrentDate(currentDate.minus({ days: 1 }));
  };

  const next = () => {
    if (viewMode === 'month' || viewMode === 'schedule') setCurrentDate(currentDate.plus({ months: 1 }));
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

  const renderScheduleView = () => {
    const scheduleItems: { date: DateTime; items: any[] }[] = [];

    days.forEach(d => {
      const dStart = d.startOf('day');
      const items: any[] = [];

      // Incomes
      if (!calStart || dStart >= calStart) {
        incomes.forEach(inc => {
          if (Array.isArray(inc.dates)) {
            if (inc.dates.includes(d.day)) {
              items.push({ type: 'income', ...inc, displayAmount: inc.amount / inc.dates.length, displayLabel: inc.name });
            }
          } else if (inc.dates.type === 'fixed' && inc.dates.payments) {
            const payments = inc.dates.payments.filter(p => p.date === d.day);
            payments.forEach(p => items.push({ type: 'income', ...inc, displayAmount: p.amount, displayLabel: p.label || inc.name }));
          } else if (inc.dates.type === 'interval' && (inc.dates as any).interval) {
            const intv = (inc.dates as any).interval;
            const start = DateTime.fromISO(intv.startDate).startOf('day');
            const current = d.startOf('day');
            if (current >= start) {
              if (intv.intervalType === 'months') {
                const diffMonths = Math.round(current.diff(start, 'months').months);
                if (diffMonths >= 0 && diffMonths % intv.intervalValue === 0) {
                  const expectedDate = start.plus({ months: diffMonths });
                  if (current.hasSame(expectedDate, 'day')) {
                    items.push({ type: 'income', ...inc, displayAmount: intv.amount, displayLabel: intv.label || inc.name });
                  }
                }
              } else {
                const diffDays = Math.round(current.diff(start, 'days').days);
                if (diffDays >= 0 && diffDays % (intv.intervalValue || intv.intervalDays || 1) === 0) {
                  items.push({ type: 'income', ...inc, displayAmount: intv.amount, displayLabel: intv.label || inc.name });
                }
              }
            }
          }
        });
      }

      // Debts
      if ((!calStart || dStart >= calStart) && (!debtStart || dStart >= debtStart)) {
        debts.forEach(debt => {
          if (debt.startDate && dStart < DateTime.fromISO(debt.startDate).startOf('day')) return;

          if (debt.type === 'split' && debt.schedule) {
            const splitItems = debt.schedule.filter(item => d.hasSame(DateTime.fromISO(item.date), 'day'));
            splitItems.forEach(item => items.push({ type: 'debt', ...debt, displayAmount: item.amount }));
          } else if (debt.paymentDate === d.day) {
            const payment = calculateMonthlyPaymentForDebt(debt, targetMonths);
            items.push({ type: 'debt', ...debt, displayAmount: payment });
          }
        });
      }

      // Bills
      if (!calStart || dStart >= calStart) {
        bills.filter(bill => bill.dueDate === d.day).forEach(bill => {
          items.push({ type: 'bill', ...bill, displayAmount: bill.amount, displayLabel: bill.name });
        });
      }

      if (items.length > 0) {
        scheduleItems.push({ date: d, items });
      }
    });

    if (scheduleItems.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center text-[var(--color-text-muted)]">
          Нет событий в этом месяце
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
        {scheduleItems.map((group, i) => (
          <div key={i} className="flex gap-4">
            <div className="w-16 shrink-0 flex flex-col items-center">
              <span className="text-sm font-medium text-[var(--color-text-muted)] uppercase">{group.date.toFormat('ccc', { locale: 'ru' })}</span>
              <span className={cn("text-2xl font-light", group.date.hasSame(DateTime.now(), 'day') ? "text-[var(--color-swamp-green-light)] font-medium bg-[rgba(82,99,84,0.2)] w-10 h-10 rounded-full flex items-center justify-center" : "text-[var(--color-text-main)]")}>
                {group.date.toFormat('d')}
              </span>
            </div>
            <div className="flex-1 space-y-2 pt-1">
              {group.items.map((item, idx) => (
                <div key={idx} className={cn(
                  "p-3 rounded-xl flex justify-between items-center",
                  item.type === 'income' ? "bg-[var(--color-swamp-green-dark)] text-[var(--color-swamp-green-light)]" :
                  item.type === 'debt' ? "bg-[var(--color-ash-red-dark)] text-[var(--color-ash-red-light)]" :
                  "bg-[rgba(140,100,74,0.3)] text-yellow-400/90"
                )}>
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={item.type === 'income' ? faWallet : item.type === 'debt' ? faArrowTrendDown : faFileInvoiceDollar} className="w-4 h-4 opacity-80" />
                    <span className="font-medium">{item.displayLabel || item.name}</span>
                  </div>
                  <span className="font-mono font-medium">{formatCurrency(item.displayAmount)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bento-panel p-4 md:p-8 rounded-3xl flex-1 flex flex-col min-h-[600px]"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <h2 className="text-xl md:text-2xl font-medium font-mono text-[var(--color-swamp-green-light)] capitalize">
          {(viewMode === 'month' || viewMode === 'schedule') && currentDate.toFormat('LLLL yyyy', { locale: 'ru' })}
          {viewMode === 'week' && `Неделя ${currentDate.startOf('week').toFormat('d MMM')} - ${currentDate.endOf('week').toFormat('d MMM yyyy', { locale: 'ru' })}`}
          {viewMode === 'day' && currentDate.toFormat('d LLLL yyyy', { locale: 'ru' })}
        </h2>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="flex bg-[rgba(0,0,0,0.2)] p-1 rounded-xl border border-[var(--color-border-line)] overflow-x-auto hide-scrollbar">
            <button onClick={() => setViewMode('schedule')} className={cn("px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap", viewMode === 'schedule' ? "bg-[var(--color-panel)] text-white" : "text-[var(--color-text-muted)] hover:text-white")} title="Расписание">
              <FontAwesomeIcon icon={faList} className="md:mr-2" /> <span className="hidden md:inline">Расписание</span>
            </button>
            <button onClick={() => setViewMode('month')} className={cn("px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap", viewMode === 'month' ? "bg-[var(--color-panel)] text-white" : "text-[var(--color-text-muted)] hover:text-white")} title="Месяц">
              <FontAwesomeIcon icon={faCalendarDays} className="md:mr-2" /> <span className="hidden md:inline">Месяц</span>
            </button>
            <button onClick={() => setViewMode('week')} className={cn("px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap", viewMode === 'week' ? "bg-[var(--color-panel)] text-white" : "text-[var(--color-text-muted)] hover:text-white")} title="Неделя">
              <FontAwesomeIcon icon={faCalendarWeek} className="md:mr-2" /> <span className="hidden md:inline">Неделя</span>
            </button>
            <button onClick={() => setViewMode('day')} className={cn("px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap", viewMode === 'day' ? "bg-[var(--color-panel)] text-white" : "text-[var(--color-text-muted)] hover:text-white")} title="День">
              <FontAwesomeIcon icon={faCalendarDay} className="md:mr-2" /> <span className="hidden md:inline">День</span>
            </button>
          </div>

          <div className="flex gap-2 shrink-0">
            <button onClick={prev} className="p-2 bg-[rgba(0,0,0,0.2)] hover:bg-[rgba(0,0,0,0.4)] rounded-xl transition-colors">
              <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button onClick={next} className="p-2 bg-[rgba(0,0,0,0.2)] hover:bg-[rgba(0,0,0,0.4)] rounded-xl transition-colors">
              <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'schedule' ? renderScheduleView() : (
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
                } else if (inc.dates.type === 'interval' && (inc.dates as any).interval) {
                  const intv = (inc.dates as any).interval;
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
                onClick={() => {
                  if (viewMode === 'month' || viewMode === 'week') {
                    setCurrentDate(d);
                    setViewMode('day');
                  }
                }}
                className={cn(
                  "p-1.5 md:p-3 rounded-xl md:rounded-2xl border transition-colors flex flex-col gap-1",
                  (viewMode === 'month' || viewMode === 'week') && "cursor-pointer hover:border-[var(--color-swamp-green-light)]",
                  viewMode === 'day' ? "min-h-[400px]" : viewMode === 'week' ? "min-h-[200px]" : "min-h-[80px] md:min-h-[100px]",
                  isCurrentMonth || viewMode !== 'month' ? "bg-[rgba(0,0,0,0.2)] border-[var(--color-border-line)]" : "bg-transparent border-transparent opacity-30",
                  isToday && "border-[var(--color-swamp-green-light)] bg-[rgba(82,99,84,0.1)]"
                )}
              >
                <div className={cn("text-right font-mono text-xs md:text-sm mb-1", isToday ? "text-[var(--color-swamp-green-light)] font-bold" : "text-[var(--color-text-muted)]")}>
                  {viewMode === 'day' ? d.toFormat('dd MMMM yyyy', { locale: 'ru' }) : d.day}
                </div>
                
                <div className={cn("flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar", viewMode === 'day' && "gap-3", viewMode === 'month' && "max-md:flex-row max-md:flex-wrap max-md:content-start max-md:justify-center")}>
                  {dayIncomes.map((inc, idx) => (
                    <div key={`inc-${inc.id}-${idx}`} className={cn("rounded-md md:rounded-lg bg-[var(--color-swamp-green-dark)] text-[var(--color-swamp-green-light)] flex flex-col group relative", viewMode === 'day' ? "p-3 text-sm" : "p-1.5 text-[10px] md:text-xs gap-0.5", viewMode === 'month' && "max-md:p-0 max-md:bg-transparent max-md:w-1.5 max-md:h-1.5 max-md:rounded-full max-md:bg-[var(--color-swamp-green-light)]")} title={inc.displayLabel}>
                      <span className={cn("truncate mr-1 font-medium", viewMode === 'month' && "max-md:hidden")}><FontAwesomeIcon icon={faWallet} className={cn("inline mr-1", viewMode === 'day' ? "w-4 h-4" : "w-2 h-2 md:w-3 md:h-3")}/>{inc.displayLabel}</span>
                      <span className={cn("font-mono opacity-80", viewMode === 'day' ? "text-lg mt-1" : "text-[9px] md:text-[10px]", viewMode === 'month' && "max-md:hidden")}>{formatCurrency(inc.displayAmount)}</span>
                    </div>
                  ))}
                  {dayDebts.map((debt, idx) => (
                    <div key={`debt-${debt.id}-${idx}`} className={cn("rounded-md md:rounded-lg bg-[var(--color-ash-red-dark)] text-[var(--color-ash-red-light)] flex flex-col group relative", viewMode === 'day' ? "p-3 text-sm" : "p-1.5 text-[10px] md:text-xs gap-0.5", viewMode === 'month' && "max-md:p-0 max-md:bg-transparent max-md:w-1.5 max-md:h-1.5 max-md:rounded-full max-md:bg-[var(--color-ash-red-light)]")} title={debt.name}>
                      <span className={cn("truncate mr-1 font-medium", viewMode === 'month' && "max-md:hidden")}><FontAwesomeIcon icon={faArrowTrendDown} className={cn("inline mr-1", viewMode === 'day' ? "w-4 h-4" : "w-2 h-2 md:w-3 md:h-3")}/>{debt.name}</span>
                      {debt.displayAmount > 0 && (
                        <span className={cn("font-mono opacity-80", viewMode === 'day' ? "text-lg mt-1" : "text-[9px] md:text-[10px]", viewMode === 'month' && "max-md:hidden")}>{formatCurrency(debt.displayAmount)}</span>
                      )}
                    </div>
                  ))}
                  {dayBills.map((bill, idx) => (
                    <div key={`bill-${bill.id}-${idx}`} className={cn("rounded-md md:rounded-lg bg-[rgba(140,100,74,0.3)] text-yellow-400/90 flex flex-col group relative", viewMode === 'day' ? "p-3 text-sm" : "p-1.5 text-[10px] md:text-xs gap-0.5", viewMode === 'month' && "max-md:p-0 max-md:bg-transparent max-md:w-1.5 max-md:h-1.5 max-md:rounded-full max-md:bg-yellow-500")} title={bill.displayLabel}>
                      <span className={cn("truncate mr-1 font-medium", viewMode === 'month' && "max-md:hidden")}><FontAwesomeIcon icon={faFileInvoiceDollar} className={cn("inline mr-1", viewMode === 'day' ? "w-4 h-4" : "w-2 h-2 md:w-3 md:h-3")}/>{bill.displayLabel}</span>
                      <span className={cn("font-mono opacity-80", viewMode === 'day' ? "text-lg mt-1" : "text-[9px] md:text-[10px]", viewMode === 'month' && "max-md:hidden")}>{formatCurrency(bill.displayAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
