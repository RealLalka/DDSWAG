import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faWallet, faPlus, faTrash, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import { CustomDayPicker } from './CustomDayPicker';
import { CustomNumberInput, CustomInput } from './CustomInputs';
import { cn } from '../lib/utils';

export interface IncomePayment {
  id: string;
  date: number; // 1-31
  amount: number;
  label: string;
}

export interface IncomeConfig {
  type: 'fixed';
  payments?: IncomePayment[];
}

export interface Income {
  id: string;
  name: string;
  amount: number;
  dates: number[] | IncomeConfig;
}

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (income: Income) => void;
  editingIncome?: Income | null;
}

export const IncomeModal: React.FC<IncomeModalProps> = ({ isOpen, onClose, onSave, editingIncome }) => {
  const [name, setName] = useState('');
  const [payments, setPayments] = useState<IncomePayment[]>([]);

  useEffect(() => {
    if (editingIncome && isOpen) {
      setName(editingIncome.name);
      
      if (Array.isArray(editingIncome.dates)) {
        setPayments(editingIncome.dates.map((d, i) => ({
          id: Date.now().toString() + i,
          date: d,
          amount: editingIncome.amount / editingIncome.dates.length,
          label: 'Выплата'
        })));
      } else if (editingIncome.dates.type === 'fixed') {
        setPayments(editingIncome.dates.payments || []);
      }
    } else if (isOpen) {
      setName('');
      setPayments([{ id: Date.now().toString(), date: 10, amount: 0, label: 'Аванс' }]);
    }
  }, [editingIncome, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, name, payments]);

  if (!isOpen) return null;

  const handleAddPayment = () => {
    setPayments([...payments, { id: Date.now().toString(), date: 25, amount: 0, label: 'Зарплата' }]);
  };

  const handleRemovePayment = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  const handleUpdatePayment = (id: string, field: keyof IncomePayment, value: any) => {
    setPayments(payments.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSave = () => {
    if (!name) return;

    const validPayments = payments.filter(p => p.amount > 0 && p.date >= 1 && p.date <= 31);
    if (validPayments.length === 0) return;
    
    const totalAmount = validPayments.reduce((sum, p) => sum + p.amount, 0);
    const config: IncomeConfig = { type: 'fixed', payments: validPayments };

    const income: Income = {
      id: editingIncome ? editingIncome.id : Date.now().toString(),
      name,
      amount: totalAmount,
      dates: config,
    };

    onSave(income);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[var(--color-panel)] border border-[var(--color-border-line)] rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-swamp-green)] opacity-10 rounded-full blur-3xl" />
          
          <div className="flex justify-between items-center mb-6 relative z-10 shrink-0">
            <h2 className="text-xl font-medium flex items-center gap-2">
              <FontAwesomeIcon icon={faWallet} className="w-5 h-5 text-[var(--color-swamp-green-light)]" />
              {editingIncome ? 'Редактировать доход' : 'Добавить доход'}
            </h2>
            <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-white transition-colors p-1 bg-[rgba(0,0,0,0.2)] rounded-full">
              <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col gap-5 relative z-10 overflow-y-auto custom-scrollbar pr-2 pb-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-[var(--color-text-muted)] ml-1">Название источника</label>
              <CustomInput 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                placeholder="Зарплата, подработка..."
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <label className="text-sm text-[var(--color-text-muted)] ml-1">Выплаты по числам месяца</label>
                <button onClick={handleAddPayment} className="text-xs text-[var(--color-swamp-green-light)] hover:underline flex items-center gap-1">
                  <FontAwesomeIcon icon={faPlus} className="w-3 h-3" /> Добавить
                </button>
              </div>
              
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex flex-col gap-2 p-3 rounded-xl border border-[var(--color-border-line)] bg-[rgba(0,0,0,0.1)]">
                    <div className="flex gap-2 items-start">
                      <div className="flex-1 flex flex-col gap-1">
                        <CustomInput 
                          type="text" 
                          value={payment.label} 
                          onChange={e => handleUpdatePayment(payment.id, 'label', e.target.value)}
                          className="p-2"
                          placeholder="Подпись (Аванс, ЗП...)"
                        />
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <CustomNumberInput 
                              value={payment.amount.toString() || ''} 
                              onChange={val => handleUpdatePayment(payment.id, 'amount', Number(val))}
                              placeholder="Сумма"
                              step={100}
                            />
                          </div>
                          <div className="relative w-32">
                            <CustomDayPicker 
                              value={payment.date}
                              onChange={val => handleUpdatePayment(payment.id, 'date', Number(val))}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                      {payments.length > 1 && (
                        <button onClick={() => handleRemovePayment(payment.id)} className="p-2 text-[var(--color-ash-red)] hover:bg-[rgba(255,0,0,0.1)] rounded-lg transition-colors mt-1">
                          <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center p-3 rounded-xl bg-[var(--color-swamp-green-dark)] mt-2">
                <span className="text-sm text-[var(--color-swamp-green-light)]">Итого в месяц:</span>
                <span className="font-mono font-bold text-[var(--color-swamp-green-light)]">
                  {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(payments.reduce((sum, p) => sum + (p.amount || 0), 0))}
                </span>
              </div>
            </div>

            <button 
              onClick={handleSave}
              className="btn-primary w-full p-4 rounded-xl font-medium mt-4 shrink-0"
              title="Или нажмите Ctrl+Enter"
            >
              {editingIncome ? 'Сохранить изменения' : 'Добавить доход'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
