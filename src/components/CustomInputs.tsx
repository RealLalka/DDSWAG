import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={cn("relative", className)} ref={ref}>
      <div 
        className="w-full p-3 rounded-xl bg-[rgba(0,0,0,0.2)] border border-[var(--color-border-line)] flex justify-between items-center cursor-pointer hover:border-[var(--color-swamp-green-light)] transition-colors focus:outline-none focus:border-[var(--color-swamp-green-light)]"
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className="text-sm">{selectedOption?.label || 'Выберите...'}</span>
        <FontAwesomeIcon icon={faChevronDown} className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-panel)] border border-[var(--color-border-line)] rounded-xl overflow-hidden z-50 shadow-xl"
          >
            {options.map(opt => (
              <div 
                key={opt.value}
                className={cn("p-3 text-sm cursor-pointer hover:bg-[rgba(255,255,255,0.05)] transition-colors", value === opt.value && "bg-[var(--color-swamp-green-dark)] text-white")}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
              >
                {opt.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface CustomNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  title?: string;
}

export const CustomNumberInput: React.FC<CustomNumberInputProps> = ({ value, onChange, placeholder, className, min, max, step = 1, onKeyDown, title }) => {
  const handleIncrement = () => {
    const val = Number(value) || 0;
    if (max === undefined || val < max) onChange((val + step).toString());
  };
  const handleDecrement = () => {
    const val = Number(value) || 0;
    if (min === undefined || val > min) onChange((val - step).toString());
  };

  return (
    <div className={cn("relative flex items-center", className)} title={title}>
      <input 
        type="number" 
        value={value} 
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className="w-full p-3 pr-10 rounded-xl bg-[rgba(0,0,0,0.2)] border border-[var(--color-border-line)] text-sm font-mono focus:outline-none hover:border-[var(--color-swamp-green-light)] focus:border-[var(--color-swamp-green-light)] transition-colors hide-arrows"
      />
      <div className="absolute right-2 flex flex-col gap-0.5">
        <button type="button" onClick={handleIncrement} className="p-0.5 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] rounded transition-colors" tabIndex={-1}>
          <FontAwesomeIcon icon={faChevronUp} className="w-3 h-3" />
        </button>
        <button type="button" onClick={handleDecrement} className="p-0.5 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] rounded transition-colors" tabIndex={-1}>
          <FontAwesomeIcon icon={faChevronDown} className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
