import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import { useFloating, offset, flip, shift, autoUpdate, useInteractions, useClick, useDismiss, useRole, FloatingPortal, FloatingFocusManager } from '@floating-ui/react';
import { cn } from '../lib/utils';

interface CustomDayPickerProps {
  value: number | string;
  onChange: (day: string) => void;
  className?: string;
}

export const CustomDayPicker: React.FC<CustomDayPickerProps> = ({ value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);

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

  const handleSelectDay = (day: number) => {
    onChange(day.toString());
    setIsOpen(false);
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <>
      <div 
        ref={refs.setReference}
        {...getReferenceProps()}
        className={cn("input-base flex items-center justify-between cursor-pointer", className)}
        tabIndex={0}
      >
        <span className="text-sm font-mono text-[var(--color-text-main)]">
          {value ? `${value} число` : 'Выберите день'}
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
                            !isSelected && "hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white",
                            isSelected && "bg-[var(--color-swamp-green-dark)] text-[var(--color-swamp-green-light)] border border-[var(--color-swamp-green)] shadow-md"
                          )}
                        >
                          {day}
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
