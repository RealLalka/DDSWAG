import React, { useState, useRef, useEffect, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'motion/react';
import { useFloating, offset, flip, shift, autoUpdate, useInteractions, useClick, useDismiss, useRole, FloatingPortal, FloatingFocusManager } from '@floating-ui/react';
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
  
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [offset(4), flip(), shift({ padding: 8 })],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'listbox' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  const selectedOption = options.find(o => o.value === value);

  return (
    <>
      <div 
        ref={refs.setReference}
        {...getReferenceProps()}
        className={cn("input-base flex justify-between items-center cursor-pointer", className)}
        tabIndex={0}
      >
        <span className="text-sm">{selectedOption?.label || 'Выберите...'}</span>
        <FontAwesomeIcon icon={faChevronDown} className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </div>
      
      <FloatingPortal>
        <AnimatePresence>
          {isOpen && (
            <FloatingFocusManager context={context} modal={false}>
              <div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 9999 }}>
                <motion.div 
                  {...getFloatingProps()}
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}
                  className="bg-[var(--color-panel)] border border-[var(--color-border-line)] rounded-xl overflow-hidden shadow-xl min-w-[max-content]"
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
              </div>
            </FloatingFocusManager>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  );
};

interface CustomNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  min?: number;
  max?: number;
  step?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  title?: string;
}

export const CustomNumberInput: React.FC<CustomNumberInputProps> = ({ value, onChange, placeholder, className, inputClassName, min, max, step = 1, onKeyDown, title }) => {
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
        className={cn("input-base pr-10 font-mono hide-arrows", inputClassName)}
      />
      <div className="absolute right-2 flex flex-col gap-1">
        <button type="button" onClick={handleIncrement} className="w-6 h-4 flex items-center justify-center bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.15)] rounded transition-colors text-[var(--color-text-muted)] hover:text-white" tabIndex={-1}>
          <FontAwesomeIcon icon={faChevronUp} className="w-2.5 h-2.5" />
        </button>
        <button type="button" onClick={handleDecrement} className="w-6 h-4 flex items-center justify-center bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.15)] rounded transition-colors text-[var(--color-text-muted)] hover:text-white" tabIndex={-1}>
          <FontAwesomeIcon icon={faChevronDown} className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
};

export const CustomInput = React.forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn("input-base", className)}
        {...props}
      />
    );
  }
);
CustomInput.displayName = 'CustomInput';

export const CustomTextArea = React.forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn("input-base resize-none", className)}
        {...props}
      />
    );
  }
);
CustomTextArea.displayName = 'CustomTextArea';
