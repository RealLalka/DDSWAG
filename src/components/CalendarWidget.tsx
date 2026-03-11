import React, { useState } from 'react';
import { Income } from './IncomeModal';
import { Debt } from './DebtModal';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { DateTime } from 'luxon';
import { cn } from '../lib/utils';

interface CalendarWidgetProps {
  incomes: Income[];
  debts: Debt[];
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ incomes, debts }) => {
  const [currentDate, setCurrentDate] = useState(DateTime.now());

  const startOfMonth = currentDate.startOf('month');
  const daysInMonth = currentDate.daysInMonth || 30;
  const startingDayOfWeek = startOfMonth.weekday; // 1 = Monday, 7 = Sunday

  const prevMonth = () => setCurrentDate(currentDate.minus({ months: 1 }));
  const nextMonth = () => setCurrentDate(currentDate.plus({ months: 1 }));

  const days = [];
  // Padding for previous month
  for (let i = 1; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="h-10 w-10 md:h-12 md:w-12" />);
  }

  // Actual days
  for (let i = 1; i <= daysInMonth; i++) {
    const dayIncomes = incomes.filter(inc => inc.dates.includes(i));
    const dayDebts = debts.filter(d => d.paymentDate === i);
    
    const hasIncome = dayIncomes.length > 0;
    const hasDebt = dayDebts.length > 0;
    const isToday = i === DateTime.now().day && currentDate.hasSame(DateTime.now(), 'month');

    days.push(
      <div key={`day-${i}`} className="relative group flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-xl border border-transparent hover:border-[var(--color-border-line)] transition-colors cursor-pointer">
        <span className={cn(
          "text-sm font-mono z-10",
          isToday ? "text-white font-bold" : "text-[var(--color-text-muted)] group-hover:text-white"
        )}>
          {i}
        </span>
        
        {isToday && (
          <div className="absolute inset-0 bg-[rgba(255,255,255,0.1)] rounded-xl" />
        )}

        <div className="absolute bottom-1.5 flex gap-1 z-10">
          {hasIncome && <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-swamp-green-light)] shadow-[0_0_5px_var(--color-swamp-green-light)]" />}
          {hasDebt && <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-ash-red-light)] shadow-[0_0_5px_var(--color-ash-red-light)]" />}
        </div>

        {/* Custom Tooltip */}
        {(hasIncome || hasDebt) && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 rounded-xl bg-[var(--color-panel-hover)] border border-[var(--color-border-line)] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
            <p className="text-xs font-medium text-white mb-2 border-b border-[var(--color-border-line)] pb-1">{i} {currentDate.monthLong}</p>
            {hasIncome && (
              <div className="mb-1">
                <p className="text-[10px] text-[var(--color-swamp-green-light)] uppercase tracking-wider mb-1">Доходы:</p>
                {dayIncomes.map(inc => (
                  <div key={inc.id} className="flex justify-between text-xs">
                    <span className="text-[var(--color-text-muted)] truncate pr-2">{inc.name}</span>
                    <span className="text-white font-mono">{inc.amount}₽</span>
                  </div>
                ))}
              </div>
            )}
            {hasDebt && (
              <div>
                <p className="text-[10px] text-[var(--color-ash-red-light)] uppercase tracking-wider mb-1 mt-2">Списания:</p>
                {dayDebts.map(d => (
                  <div key={d.id} className="flex justify-between text-xs">
                    <span className="text-[var(--color-text-muted)] truncate pr-2">{d.name}</span>
                    <span className="text-white font-mono">{d.monthlyPayment ? Math.round(d.monthlyPayment) : d.amount}₽</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bento-panel p-6 md:p-8 rounded-3xl flex flex-col relative overflow-hidden group h-full min-h-[350px]">
      <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--color-swamp-green)] opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity" />
      
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <FontAwesomeIcon icon={faCalendarDays} className="w-5 h-5 text-[var(--color-swamp-green-light)]"/> 
          Календарь
        </h2>
        <div className="flex items-center gap-3 bg-[rgba(0,0,0,0.2)] rounded-xl p-1 border border-[var(--color-border-line)]">
          <button onClick={prevMonth} className="p-1 hover:bg-[var(--color-panel)] rounded-lg transition-colors text-[var(--color-text-muted)] hover:text-white">
            <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium min-w-[100px] text-center capitalize">
            {currentDate.toFormat('LLLL yyyy', { locale: 'ru' })}
          </span>
          <button onClick={nextMonth} className="p-1 hover:bg-[var(--color-panel)] rounded-lg transition-colors text-[var(--color-text-muted)] hover:text-white">
            <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 relative z-10">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-[var(--color-text-muted)] pb-2">
            {day}
          </div>
        ))}
        {days}
      </div>
    </motion.div>
  );
};
