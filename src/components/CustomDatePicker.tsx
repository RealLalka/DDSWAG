import React, { useState, useRef, useEffect } from 'react';
import { DateTime } from 'luxon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface CustomDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  className?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(DateTime.fromISO(value || DateTime.now().toISODate()!).startOf('month'));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(currentMonth.minus({ months: 1 }));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(currentMonth.plus({ months: 1 }));
  };

  const handleSelectDate = (date: DateTime) => {
    onChange(date.toISODate()!);
    setIsOpen(false);
  };

  const generateDays = () => {
    const days = [];
    const startDay = currentMonth.startOf('week');
    const endDay = currentMonth.endOf('month').endOf('week');
    
    let day = startDay;
    while (day <= endDay) {
      days.push(day);
      day = day.plus({ days: 1 });
    }
    return days;
  };

  const days = generateDays();
  const selectedDate = value ? DateTime.fromISO(value) : null;

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div 
        className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,0,0,0.2)] border border-[var(--color-border-line)] cursor-pointer hover:border-[var(--color-swamp-green-light)] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm font-mono text-[var(--color-text-main)]">
          {selectedDate ? selectedDate.toFormat('dd.MM.yyyy') : 'Выберите дату'}
        </span>
        <FontAwesomeIcon icon={faCalendarDays} className="w-4 h-4 text-[var(--color-text-muted)]" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-2 left-0 w-64 p-4 bg-[var(--color-panel)] border border-[var(--color-border-line)] rounded-2xl shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={handlePrevMonth}
                className="p-1 rounded-lg hover:bg-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] hover:text-white transition-colors"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium capitalize">
                {currentMonth.toFormat('LLLL yyyy', { locale: 'ru' })}
              </span>
              <button 
                onClick={handleNextMonth}
                className="p-1 rounded-lg hover:bg-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] hover:text-white transition-colors"
              >
                <FontAwesomeIcon icon={faChevronRight} className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                <div key={day} className="text-center text-xs text-[var(--color-text-muted)] font-medium">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                const isCurrentMonth = day.hasSame(currentMonth, 'month');
                const isSelected = selectedDate && day.hasSame(selectedDate, 'day');
                const isToday = day.hasSame(DateTime.now(), 'day');

                return (
                  <button
                    key={i}
                    onClick={() => handleSelectDate(day)}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-mono transition-colors",
                      !isCurrentMonth && "text-[var(--color-text-muted)] opacity-50",
                      isCurrentMonth && !isSelected && !isToday && "hover:bg-[rgba(255,255,255,0.1)]",
                      isToday && !isSelected && "border border-[var(--color-swamp-green-light)] text-[var(--color-swamp-green-light)]",
                      isSelected && "bg-[var(--color-swamp-green-dark)] text-[var(--color-swamp-green-light)] border border-[var(--color-swamp-green)] shadow-md"
                    )}
                  >
                    {day.toFormat('d')}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
