import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import { cn } from '../lib/utils';

interface CustomDayPickerProps {
  value: number | string;
  onChange: (day: string) => void;
  className?: string;
}

export const CustomDayPicker: React.FC<CustomDayPickerProps> = ({ value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleSelectDay = (day: number) => {
    onChange(day.toString());
    setIsOpen(false);
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div 
        className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,0,0,0.2)] border border-[var(--color-border-line)] cursor-pointer hover:border-[var(--color-swamp-green-light)] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm font-mono text-[var(--color-text-main)]">
          {value ? `${value} число` : 'Выберите день'}
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
            <div className="text-sm font-medium mb-3 text-center text-[var(--color-text-muted)]">
              День месяца
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map(day => {
                const isSelected = Number(value) === day;
                return (
                  <button
                    key={day}
                    onClick={() => handleSelectDay(day)}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-mono transition-colors",
                      !isSelected && "hover:bg-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] hover:text-white",
                      isSelected && "bg-[var(--color-swamp-green-dark)] text-[var(--color-swamp-green-light)] border border-[var(--color-swamp-green)] shadow-md"
                    )}
                  >
                    {day}
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
