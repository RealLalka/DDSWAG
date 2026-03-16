import React, { useState } from 'react';
import { motion } from 'motion/react';
import { DateTime } from 'luxon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faWallet, faArrowTrendDown, faFileInvoiceDollar, faCalendarDays, faCalendarWeek, faCalendarDay, faList, faCheck, faCheckDouble, faShare } from '@fortawesome/free-solid-svg-icons';
import { Income } from './IncomeModal';
import { Debt } from './DebtModal';
import { Bill } from './BillModal';
import { PaymentModal, Payment } from './PaymentModal';
import { cn } from '../lib/utils';
import { DndContext, DragEndEvent, useDraggable, useDroppable, TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const DroppableDay = ({ date, children, className, onClick }: any) => {
  const { setNodeRef, isOver } = useDroppable({ id: date });
  return (
    <div ref={setNodeRef} onClick={onClick} className={cn(className, "cursor-pointer", isOver && "ring-2 ring-[var(--color-swamp-green-light)] bg-[rgba(82,99,84,0.2)]")}>
      {children}
    </div>
  );
};

const DraggableItem = ({ id, item, date, children, className, onClick }: any) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { item, date }
  });
  const style = transform ? { transform: CSS.Translate.toString(transform), zIndex: 50 } : undefined;
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes} 
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className={cn(className, "cursor-pointer", isDragging && "opacity-50 shadow-xl scale-105 z-50 relative touch-none")}
    >
      {children}
    </div>
  );
};

interface CalendarViewProps {
  incomes: Income[];
  debts: Debt[];
  bills?: Bill[];
  payments?: Payment[];
  itemShifts?: any[];
  onSavePayment?: (payment: Partial<Payment>) => void;
  onDeletePayment?: (paymentId: string) => void;
  onSaveShift?: (shift: { itemId: string, itemType: string, originalDate: string, newDate: string }) => void;
  calendarStartDate?: string;
  debtStartDate?: string;
  targetMonths: number;
}

type ViewMode = 'month' | 'week' | 'day' | 'schedule';

export const CalendarView: React.FC<CalendarViewProps> = ({ incomes, debts, bills = [], payments = [], itemShifts = [], onSavePayment, onDeletePayment, onSaveShift, calendarStartDate, debtStartDate, targetMonths }) => {
  const [currentDate, setCurrentDate] = useState(DateTime.now());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handleItemClick = (item: any, date: string) => {
    setSelectedItem(item);
    setSelectedDate(date);
    setIsPaymentModalOpen(true);
  };

  const days = React.useMemo(() => {
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
      // For schedule view, show from today up to targetMonths
      start = DateTime.now().startOf('day');
      end = start.plus({ months: targetMonths }).endOf('month');
    }

    const d = [];
    let day = start;
    while (day <= end) {
      d.push(day);
      day = day.plus({ days: 1 });
    }
    return d;
  }, [viewMode, currentDate, targetMonths]);

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

  const getOriginalItemsForDate = React.useCallback((d: DateTime) => {
    const dStart = d.startOf('day');
    const items: any[] = [];

    // Incomes
    if (!calStart || dStart >= calStart) {
      incomes.forEach(inc => {
        if (Array.isArray(inc.dates)) {
          if (inc.dates.includes(d.day)) {
            items.push({ itemType: 'income', ...inc, displayAmount: inc.amount / inc.dates.length, displayLabel: inc.name });
          }
        } else if (inc.dates.type === 'fixed' && inc.dates.payments) {
          const payments = inc.dates.payments.filter(p => p.date === d.day);
          payments.forEach(p => items.push({ itemType: 'income', ...inc, displayAmount: p.amount, displayLabel: p.label || inc.name }));
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
                  items.push({ itemType: 'income', ...inc, displayAmount: intv.amount, displayLabel: intv.label || inc.name });
                }
              }
            } else {
              const diffDays = Math.round(current.diff(start, 'days').days);
              if (diffDays >= 0 && diffDays % (intv.intervalValue || intv.intervalDays || 1) === 0) {
                items.push({ itemType: 'income', ...inc, displayAmount: intv.amount, displayLabel: intv.label || inc.name });
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
          splitItems.forEach(item => items.push({ itemType: 'debt', ...debt, displayAmount: item.amount }));
        } else if (debt.paymentDate === d.day) {
          const payment = calculateMonthlyPaymentForDebt(debt, targetMonths);
          items.push({ itemType: 'debt', ...debt, displayAmount: payment });
        }
      });
    }

    // Bills
    if (!calStart || dStart >= calStart) {
      bills.filter(bill => bill.dueDate === d.day).forEach(bill => {
        items.push({ itemType: 'bill', ...bill, displayAmount: bill.amount, displayLabel: bill.name });
      });
    }

    return items;
  }, [incomes, debts, bills, calStart, debtStart, targetMonths]);

  const itemsMap = React.useMemo(() => {
    const map = new Map<string, any[]>();
    
    days.forEach(d => {
      const dateStr = d.toISODate()!;
      map.set(dateStr, getOriginalItemsForDate(d));
    });

    const finalMap = new Map<string, any[]>();
    
    map.forEach((items, dateStr) => {
      const itemsToKeep = items.filter(item => {
        const shift = itemShifts.find(s => s.itemId === item.id && s.itemType === item.itemType && s.originalDate === dateStr);
        return !shift;
      });
      if (itemsToKeep.length > 0) {
        finalMap.set(dateStr, itemsToKeep);
      }
    });

    itemShifts.forEach(shift => {
      const isNewDateVisible = days.some(d => d.toISODate() === shift.newDate);
      if (isNewDateVisible) {
        let originalItems = map.get(shift.originalDate);
        if (!originalItems) {
          originalItems = getOriginalItemsForDate(DateTime.fromISO(shift.originalDate));
        }
        const item = originalItems.find(i => i.id === shift.itemId && i.itemType === shift.itemType);
        if (item) {
          if (!finalMap.has(shift.newDate)) finalMap.set(shift.newDate, []);
          finalMap.get(shift.newDate)!.push({ ...item, isShifted: true, originalDate: shift.originalDate });
        }
      }
    });

    return finalMap;
  }, [days, itemShifts, getOriginalItemsForDate]);

  const getItemsForDate = React.useCallback((d: DateTime) => {
    return itemsMap.get(d.toISODate()!) || [];
  }, [itemsMap]);

  const paymentsMap = React.useMemo(() => {
    const map = new Map<string, Payment[]>();
    payments.forEach(p => {
      const key = `${p.itemId}-${p.date}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return map;
  }, [payments]);

  const renderScheduleView = () => {
    const scheduleItems: { date: DateTime; items: any[] }[] = [];

    for (const d of days) {
      if (scheduleItems.length >= 200) break; // Limit to 200 days with events to prevent lag

      const items = getItemsForDate(d);

      if (items.length > 0) {
        scheduleItems.push({ date: d, items });
      }
    }

    if (scheduleItems.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center text-[var(--color-text-muted)]">
          Нет событий
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
        {scheduleItems.map((group, i) => (
          <DroppableDay key={i} date={group.date.toISODate()!} className="flex gap-4">
            <div className="w-16 shrink-0 flex flex-col items-center">
              <span className="text-sm font-medium text-[var(--color-text-muted)] uppercase">{group.date.toFormat('ccc', { locale: 'ru' })}</span>
              <span className={cn("text-2xl font-light", group.date.hasSame(DateTime.now(), 'day') ? "text-[var(--color-swamp-green-light)] font-medium bg-[rgba(82,99,84,0.2)] w-10 h-10 rounded-full flex items-center justify-center" : "text-[var(--color-text-main)]")}>
                {group.date.toFormat('d')}
              </span>
              <span className="text-xs text-[var(--color-text-muted)] mt-1">{group.date.toFormat('MMM', { locale: 'ru' })}</span>
            </div>
            <div className="flex-1 space-y-2 pt-1">
              {group.items.map((item, idx) => {
                const itemPayments = paymentsMap.get(`${item.id}-${group.date.toISODate()}`) || [];
                const totalPaid = itemPayments.reduce((sum, p) => sum + p.amount, 0);
                const isPaid = totalPaid >= item.displayAmount;
                const isPartial = totalPaid > 0 && totalPaid < item.displayAmount;

                return (
                <DraggableItem id={`sched-${item.itemType}-${item.id}-${group.date.toISODate()}`} item={item} date={group.date.toISODate()!} key={idx} onClick={() => handleItemClick(item, group.date.toISODate()!)} className={cn(
                  "p-3 rounded-xl flex justify-between items-center cursor-pointer transition-all hover:brightness-110",
                  item.itemType === 'income' ? "bg-[var(--color-swamp-green-dark)] text-[var(--color-swamp-green-light)]" :
                  item.itemType === 'debt' ? "bg-[var(--color-ash-red-dark)] text-[var(--color-ash-red-light)]" :
                  "bg-[rgba(140,100,74,0.3)] text-yellow-400/90",
                  isPaid && "opacity-50"
                )}>
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={item.itemType === 'income' ? faWallet : item.itemType === 'debt' ? faArrowTrendDown : faFileInvoiceDollar} className="w-4 h-4 opacity-80" />
                    <span className={cn("font-medium", isPaid && "line-through")}>{item.displayLabel || item.name}</span>
                    {item.isShifted && <FontAwesomeIcon icon={faShare} className="w-3 h-3 text-white/70" title="Перенесено" />}
                    {isPaid && <FontAwesomeIcon icon={faCheckDouble} className="w-3 h-3 text-white/70" title="Оплачено" />}
                    {isPartial && <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-white/70" title="Частично" />}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={cn("font-mono font-medium", isPaid && "line-through")}>{formatCurrency(item.displayAmount)}</span>
                    {isPartial && <span className="text-[10px] opacity-80">Оплачено: {formatCurrency(totalPaid)}</span>}
                  </div>
                </DraggableItem>
              )})}
            </div>
          </DroppableDay>
        ))}
      </div>
    );
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const newDate = over.id as string;
    const { item, date: originalDate } = active.data.current as any;

    if (newDate === originalDate) return;

    if (onSaveShift) {
      onSaveShift({
        itemId: item.id,
        itemType: item.itemType,
        originalDate: item.originalDate || originalDate,
        newDate
      });
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bento-panel p-2 md:p-4 rounded-[2.5rem] flex-1 flex flex-col min-h-[600px]"
      >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4 px-2 md:px-0">
        <h2 className="text-xl md:text-2xl font-medium font-mono text-[var(--color-swamp-green-light)] capitalize">
          {viewMode === 'month' && currentDate.toFormat('LLLL yyyy', { locale: 'ru' })}
          {viewMode === 'schedule' && 'Всё время'}
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

          {viewMode !== 'schedule' && (
            <div className="flex gap-2 shrink-0">
              <button onClick={prev} className="p-2 bg-[rgba(0,0,0,0.2)] hover:bg-[rgba(0,0,0,0.4)] rounded-xl transition-colors">
                <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button onClick={next} className="p-2 bg-[rgba(0,0,0,0.2)] hover:bg-[rgba(0,0,0,0.4)] rounded-xl transition-colors">
                <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {viewMode === 'schedule' ? renderScheduleView() : (
        <div className={cn("grid gap-1 md:gap-2 flex-1", viewMode === 'day' ? "grid-cols-1" : "grid-cols-7")}>
          {viewMode !== 'day' && ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
            <div key={d} className="text-center text-xs md:text-sm text-[var(--color-text-muted)] font-medium mb-1">{d}</div>
          ))}
          
          {days.map((d, i) => {
            const isCurrentMonth = d.month === currentDate.month;
            const isToday = d.hasSame(DateTime.now(), 'day');
            const dStart = d.startOf('day');
            
            const dayItems = getItemsForDate(d);
            const dayIncomes = dayItems.filter(i => i.itemType === 'income');
            const dayDebts = dayItems.filter(i => i.itemType === 'debt');
            const dayBills = dayItems.filter(i => i.itemType === 'bill');

            return (
              <DroppableDay 
                key={i} 
                date={d.toISODate()!}
                onClick={() => {
                  if (viewMode === 'month' || viewMode === 'week') {
                    setCurrentDate(d);
                    setViewMode('day');
                  }
                }}
                className={cn(
                  "p-1 md:p-2 rounded-xl border transition-colors flex flex-col gap-1",
                  (viewMode === 'month' || viewMode === 'week') && "cursor-pointer hover:border-[var(--color-swamp-green-light)]",
                  viewMode === 'day' ? "min-h-[400px]" : viewMode === 'week' ? "min-h-[200px]" : "min-h-[80px] md:min-h-[100px]",
                  isCurrentMonth || viewMode !== 'month' ? "bg-[rgba(0,0,0,0.2)] border-[var(--color-border-line)]" : "bg-transparent border-transparent opacity-30",
                  isToday && "border-[var(--color-swamp-green-light)] bg-[rgba(82,99,84,0.1)]"
                )}
              >
                <div className={cn("text-right font-mono text-xs md:text-sm mb-1", isToday ? "text-[var(--color-swamp-green-light)] font-bold" : "text-[var(--color-text-muted)]")}>
                  {viewMode === 'day' ? d.toFormat('dd MMMM yyyy', { locale: 'ru' }) : d.day}
                </div>
                
                <div className={cn("flex flex-col gap-0.5 md:gap-1 flex-1 overflow-y-auto custom-scrollbar", viewMode === 'day' && "gap-2 md:gap-3", viewMode === 'month' && "max-md:flex-row max-md:flex-wrap max-md:content-start max-md:justify-center")}>
                  {dayIncomes.map((inc, idx) => {
                    const itemPayments = paymentsMap.get(`${inc.id}-${d.toISODate()}`) || [];
                    const totalPaid = itemPayments.reduce((sum, p) => sum + p.amount, 0);
                    const isPaid = totalPaid >= inc.displayAmount;
                    const isPartial = totalPaid > 0 && totalPaid < inc.displayAmount;
                    return (
                    <DraggableItem id={`inc-${inc.id}-${d.toISODate()}`} item={inc} date={d.toISODate()!} key={`inc-${inc.id}-${idx}`} onClick={(e: any) => { handleItemClick(inc, d.toISODate()!); }} className={cn("rounded-md md:rounded-lg bg-[var(--color-swamp-green-dark)] text-[var(--color-swamp-green-light)] flex flex-col group relative cursor-pointer hover:brightness-110", viewMode === 'day' ? "p-2 md:p-3 text-sm" : "px-1 py-0.5 md:p-1.5 text-[9px] md:text-xs gap-0", viewMode === 'month' && "max-md:p-0 max-md:bg-transparent max-md:w-1.5 max-md:h-1.5 max-md:rounded-full max-md:bg-[var(--color-swamp-green-light)]", isPaid && "opacity-50")} title={inc.displayLabel}>
                      <span className={cn("truncate mr-1 font-medium", viewMode === 'month' && "max-md:hidden", isPaid && "line-through")}>
                        <FontAwesomeIcon icon={faWallet} className={cn("inline mr-1", viewMode === 'day' ? "w-4 h-4" : "w-2 h-2 md:w-3 md:h-3")}/>
                        {inc.displayLabel}
                        {inc.isShifted && <FontAwesomeIcon icon={faShare} className="w-2 h-2 ml-1 text-white/70" title="Перенесено" />}
                        {isPaid && <FontAwesomeIcon icon={faCheckDouble} className="w-2 h-2 ml-1 text-white/70" />}
                        {isPartial && <FontAwesomeIcon icon={faCheck} className="w-2 h-2 ml-1 text-white/70" />}
                      </span>
                      <span className={cn("font-mono opacity-80", viewMode === 'day' ? "text-lg mt-1" : "text-[9px] md:text-[10px]", viewMode === 'month' && "max-md:hidden", isPaid && "line-through")}>{formatCurrency(inc.displayAmount)}</span>
                    </DraggableItem>
                  )})}
                  {dayDebts.map((debt, idx) => {
                    const itemPayments = paymentsMap.get(`${debt.id}-${d.toISODate()}`) || [];
                    const totalPaid = itemPayments.reduce((sum, p) => sum + p.amount, 0);
                    const isPaid = totalPaid >= debt.displayAmount;
                    const isPartial = totalPaid > 0 && totalPaid < debt.displayAmount;
                    return (
                    <DraggableItem id={`debt-${debt.id}-${d.toISODate()}`} item={debt} date={d.toISODate()!} key={`debt-${debt.id}-${idx}`} onClick={(e: any) => { handleItemClick(debt, d.toISODate()!); }} className={cn("rounded-md md:rounded-lg bg-[var(--color-ash-red-dark)] text-[var(--color-ash-red-light)] flex flex-col group relative cursor-pointer hover:brightness-110", viewMode === 'day' ? "p-2 md:p-3 text-sm" : "px-1 py-0.5 md:p-1.5 text-[9px] md:text-xs gap-0", viewMode === 'month' && "max-md:p-0 max-md:bg-transparent max-md:w-1.5 max-md:h-1.5 max-md:rounded-full max-md:bg-[var(--color-ash-red-light)]", isPaid && "opacity-50")} title={debt.name}>
                      <span className={cn("truncate mr-1 font-medium", viewMode === 'month' && "max-md:hidden", isPaid && "line-through")}>
                        <FontAwesomeIcon icon={faArrowTrendDown} className={cn("inline mr-1", viewMode === 'day' ? "w-4 h-4" : "w-2 h-2 md:w-3 md:h-3")}/>
                        {debt.name}
                        {debt.isShifted && <FontAwesomeIcon icon={faShare} className="w-2 h-2 ml-1 text-white/70" title="Перенесено" />}
                        {isPaid && <FontAwesomeIcon icon={faCheckDouble} className="w-2 h-2 ml-1 text-white/70" />}
                        {isPartial && <FontAwesomeIcon icon={faCheck} className="w-2 h-2 ml-1 text-white/70" />}
                      </span>
                      {debt.displayAmount > 0 && (
                        <span className={cn("font-mono opacity-80", viewMode === 'day' ? "text-lg mt-1" : "text-[9px] md:text-[10px]", viewMode === 'month' && "max-md:hidden", isPaid && "line-through")}>{formatCurrency(debt.displayAmount)}</span>
                      )}
                    </DraggableItem>
                  )})}
                  {dayBills.map((bill, idx) => {
                    const itemPayments = paymentsMap.get(`${bill.id}-${d.toISODate()}`) || [];
                    const totalPaid = itemPayments.reduce((sum, p) => sum + p.amount, 0);
                    const isPaid = totalPaid >= bill.displayAmount;
                    const isPartial = totalPaid > 0 && totalPaid < bill.displayAmount;
                    return (
                    <DraggableItem id={`bill-${bill.id}-${d.toISODate()}`} item={bill} date={d.toISODate()!} key={`bill-${bill.id}-${idx}`} onClick={(e: any) => { handleItemClick(bill, d.toISODate()!); }} className={cn("rounded-md md:rounded-lg bg-[rgba(140,100,74,0.3)] text-yellow-400/90 flex flex-col group relative cursor-pointer hover:brightness-110", viewMode === 'day' ? "p-2 md:p-3 text-sm" : "px-1 py-0.5 md:p-1.5 text-[9px] md:text-xs gap-0", viewMode === 'month' && "max-md:p-0 max-md:bg-transparent max-md:w-1.5 max-md:h-1.5 max-md:rounded-full max-md:bg-yellow-500", isPaid && "opacity-50")} title={bill.displayLabel}>
                      <span className={cn("truncate mr-1 font-medium", viewMode === 'month' && "max-md:hidden", isPaid && "line-through")}>
                        <FontAwesomeIcon icon={faFileInvoiceDollar} className={cn("inline mr-1", viewMode === 'day' ? "w-4 h-4" : "w-2 h-2 md:w-3 md:h-3")}/>
                        {bill.displayLabel}
                        {bill.isShifted && <FontAwesomeIcon icon={faShare} className="w-2 h-2 ml-1 text-white/70" title="Перенесено" />}
                        {isPaid && <FontAwesomeIcon icon={faCheckDouble} className="w-2 h-2 ml-1 text-white/70" />}
                        {isPartial && <FontAwesomeIcon icon={faCheck} className="w-2 h-2 ml-1 text-white/70" />}
                      </span>
                      <span className={cn("font-mono opacity-80", viewMode === 'day' ? "text-lg mt-1" : "text-[9px] md:text-[10px]", viewMode === 'month' && "max-md:hidden", isPaid && "line-through")}>{formatCurrency(bill.displayAmount)}</span>
                    </DraggableItem>
                  )})}
                </div>
              </DroppableDay>
            );
          })}
        </div>
      )}

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSave={(payment) => {
          if (onSavePayment) onSavePayment(payment);
        }}
        onDelete={(paymentId) => {
          if (onDeletePayment) onDeletePayment(paymentId);
        }}
        onSaveShift={(shift) => {
          if (onSaveShift) onSaveShift(shift);
        }}
        item={selectedItem}
        date={selectedDate}
        existingPayments={payments.filter(p => p.itemId === selectedItem?.id && (p.date === selectedDate || p.date === selectedItem?.originalDate))}
      />
      </motion.div>
    </DndContext>
  );
};
