import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faDownload, faFilePdf, faImage } from '@fortawesome/free-solid-svg-icons';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { DevilIcon } from './DevilIcon';
import { cn } from '../lib/utils';
import { Debt } from './DebtModal';

interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  incomes: { id: string; name: string; amount: number }[];
  debts: Debt[];
  targetMonths: number;
  totalIncome: number;
  totalDebt: number;
  totalMonthlyPayment: number;
  remainingBudget: number;
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  isOpen, onClose, incomes, debts, targetMonths, totalIncome, totalDebt, totalMonthlyPayment, remainingBudget
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

  const handleExportPDF = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, backgroundColor: '#0a0b0a' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'px',
        format: orientation === 'landscape' ? [canvas.width, canvas.height] : [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('dolzhnaya-dusha-plan.pdf');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJPG = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, backgroundColor: '#0a0b0a' });
      const link = document.createElement('a');
      link.download = 'dolzhnaya-dusha-plan.jpg';
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          onClick={e => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[var(--color-panel)] border border-[var(--color-border-line)] rounded-3xl p-6 w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium">Экспорт плана</h2>
            <div className="flex items-center gap-4">
              <div className="flex bg-[rgba(0,0,0,0.3)] rounded-lg p-1">
                <button 
                  onClick={() => setOrientation('landscape')}
                  className={cn("px-3 py-1 rounded-md text-sm transition-colors", orientation === 'landscape' ? "bg-[var(--color-swamp-green)] text-white" : "text-[var(--color-text-muted)]")}
                >
                  ПК (Горизонтально)
                </button>
                <button 
                  onClick={() => setOrientation('portrait')}
                  className={cn("px-3 py-1 rounded-md text-sm transition-colors", orientation === 'portrait' ? "bg-[var(--color-swamp-green)] text-white" : "text-[var(--color-text-muted)]")}
                >
                  Мобайл (Вертикально)
                </button>
              </div>
              <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-white transition-colors">
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-black/50 rounded-2xl p-4 flex justify-center items-start border border-[var(--color-border-line)]">
            {/* Preview Container */}
            <div 
              ref={previewRef} 
              className={cn(
                "bg-[var(--color-bg-dark)] p-8 rounded-3xl border border-[var(--color-border-line)] shrink-0",
                orientation === 'landscape' ? "w-[800px]" : "w-[400px]"
              )}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12"><DevilIcon className="w-full h-full" /></div>
                <div>
                  <h1 className="text-2xl font-bold font-mono tracking-wider text-[var(--color-ash-red-light)]">Должная Душа<span className="text-[var(--color-swamp-green-light)]">.swag</span></h1>
                  <p className="text-sm text-[var(--color-text-muted)] font-mono">План спасения: {targetMonths} мес.</p>
                </div>
              </div>

              <div className={cn("grid gap-6 mb-8", orientation === 'landscape' ? "grid-cols-4" : "grid-cols-2")}>
                <div className="bg-[var(--color-panel)] p-5 rounded-2xl border border-[var(--color-border-line)]">
                  <p className="text-xs text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Доход</p>
                  <p className="text-xl font-mono text-[var(--color-swamp-green-light)]">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="bg-[var(--color-panel)] p-5 rounded-2xl border border-[var(--color-border-line)]">
                  <p className="text-xs text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Долг</p>
                  <p className="text-xl font-mono text-[var(--color-ash-red-light)]">{formatCurrency(totalDebt)}</p>
                </div>
                <div className="bg-[var(--color-panel)] p-5 rounded-2xl border border-[var(--color-border-line)]">
                  <p className="text-xs text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Платёж</p>
                  <p className="text-xl font-mono text-[var(--color-ash-red)]">{formatCurrency(totalMonthlyPayment)}</p>
                </div>
                <div className="bg-[var(--color-panel)] p-5 rounded-2xl border border-[var(--color-border-line)]">
                  <p className="text-xs text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Остаток</p>
                  <p className={cn("text-xl font-mono font-bold", remainingBudget > 0 ? "text-[var(--color-swamp-green)]" : "text-[var(--color-ash-red)]")}>{formatCurrency(remainingBudget)}</p>
                </div>
              </div>

              <div className={cn("grid gap-6", orientation === 'landscape' ? "grid-cols-2" : "grid-cols-1")}>
                <div className="bg-[var(--color-panel)] p-6 rounded-2xl border border-[var(--color-border-line)]">
                  <h3 className="text-sm font-medium mb-4 text-[var(--color-text-muted)] uppercase tracking-wider">Источники дохода</h3>
                  <div className="space-y-3">
                    {incomes.map(inc => (
                      <div key={inc.id} className="flex justify-between text-sm items-center border-b border-[var(--color-border-line)] pb-2 last:border-0">
                        <span>{inc.name}</span>
                        <span className="font-mono text-[var(--color-swamp-green-light)]">{formatCurrency(inc.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-[var(--color-panel)] p-6 rounded-2xl border border-[var(--color-border-line)]">
                  <h3 className="text-sm font-medium mb-4 text-[var(--color-text-muted)] uppercase tracking-wider">Долговая яма</h3>
                  <div className="space-y-4">
                    {debts.map(debt => {
                      let payment = 0;
                      if (debt.type === 'credit_card') {
                        payment = debt.mandatoryPayment || 0;
                      } else if (debt.type === 'installment') {
                        payment = debt.amount / (debt.remainingMonths || 1);
                      } else {
                        const r = debt.rate / 100 / 12;
                        const n = targetMonths;
                        payment = r === 0 ? debt.amount / n : (debt.amount * r) / (1 - Math.pow(1 + r, -n));
                      }
                      
                      return (
                        <div key={debt.id} className="flex flex-col text-sm border-b border-[var(--color-border-line)] pb-3 last:border-0">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{debt.name}</span>
                            <span className="font-mono text-[var(--color-ash-red-light)]">{formatCurrency(debt.amount)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                            <span>{debt.type === 'credit_card' ? 'Кредитка' : debt.type === 'installment' ? 'Рассрочка' : 'Кредит'} ({debt.rate}%)</span>
                            <span>Платёж: <span className="font-mono text-[var(--color-ash-red)]">{formatCurrency(payment)}</span></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button 
              onClick={handleExportJPG}
              disabled={isExporting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-panel)] border border-[var(--color-border-line)] hover:border-[var(--color-swamp-green-light)] transition-colors"
            >
              <FontAwesomeIcon icon={faImage} className="w-4 h-4" /> JPG
            </button>
            <button 
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl btn-primary"
            >
              <FontAwesomeIcon icon={faFilePdf} className="w-4 h-4" /> PDF
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
