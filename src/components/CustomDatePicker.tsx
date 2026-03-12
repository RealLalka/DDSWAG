import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'motion/react';
import { useFloating, offset, flip, shift, autoUpdate, useInteractions, useClick, useDismiss, useRole, FloatingPortal, FloatingFocusManager } from '@floating-ui/react';
import { cn } from '../lib/utils';

interface CustomDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  className?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(DateTime.fromISO(value || DateTime.now().toISODate()!).startOf('month'));

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [offset(4), flip(), shift({ padding: 8 })],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

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
    <>
      <div 
        ref={refs.setReference}
        {...getReferenceProps()}
        className={cn("input-base flex items-center justify-between cursor-pointer", className)}
        tabIndex={0}
      >
        <span className="text-sm font-mono text-[var(--color-text-main)]">
          {selectedDate ? selectedDate.toFormat('dd.MM.yyyy') : 'Выберите дату'}
        </span>
        <FontAwesomeIcon icon={faCalendarDays} className="w-4 h-4 text-[var(--color-text-muted)]" />
      </div>

      <FloatingPortal>
        <AnimatePresence>
          {isOpen && (
            <FloatingFocusManager context={context} modal={false}>
              <div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 9999 }}>
                <motion.div 
                  {...getFloatingProps()}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="w-64 p-4 bg-[var(--color-panel)] border border-[var(--color-border-line)] rounded-2xl shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <button 
                      onClick={handlePrevMonth}
                      className="p-1 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white transition-colors"
                    >
                      <FontAwesomeIcon icon={faChevronLeft} className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium capitalize">
                      {currentMonth.toFormat('LLLL yyyy', { locale: 'ru' })}
                    </span>
                    <button 
                      onClick={handleNextMonth}
                      className="p-1 rounded-lg hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white transition-colors"
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
                            isCurrentMonth && !isSelected && !isToday && "hover:bg-white/10",
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
              </div>
            </FloatingFocusManager>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  );
};
