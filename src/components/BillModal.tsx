import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { CustomNumberInput, CustomInput } from './CustomInputs';

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: number;
}

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bill: Bill) => void;
  editingBill?: Bill | null;
}

export const BillModal: React.FC<BillModalProps> = ({ isOpen, onClose, onSave, editingBill }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('1');

  useEffect(() => {
    if (editingBill && isOpen) {
      setName(editingBill.name);
      setAmount(editingBill.amount.toString());
      setDueDate(editingBill.dueDate.toString());
    } else {
      setName('');
      setAmount('');
      setDueDate('1');
    }
  }, [editingBill, isOpen]);

  const handleSave = () => {
    if (!name || !amount) return;

    onSave({
      id: editingBill?.id || crypto.randomUUID(),
      name,
      amount: Number(amount),
      dueDate: Number(dueDate) || 1,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          onClick={onClose} 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }} 
          className="relative w-full max-w-md bg-[var(--color-panel)] border border-[var(--color-border-line)] rounded-3xl p-6 md:p-8 shadow-2xl z-10 max-h-[90vh] flex flex-col"
        >
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="text-2xl font-medium font-mono">
              {editingBill ? 'Редактировать платёж' : 'Новый платёж'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <FontAwesomeIcon icon={faXmark} className="w-5 h-5 text-[var(--color-text-muted)]" />
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            <div>
              <label className="block text-sm text-[var(--color-text-muted)] mb-1">Название (например, Коммуналка)</label>
              <CustomInput 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="ЖКХ"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--color-text-muted)] mb-1">Сумма (₽)</label>
              <CustomNumberInput 
                value={amount}
                onChange={setAmount}
                placeholder="5000"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--color-text-muted)] mb-1">День списания (1-31)</label>
              <CustomNumberInput 
                value={dueDate}
                onChange={setDueDate}
                min={1}
                max={31}
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button onClick={onClose} className="btn-base btn-secondary">
              Отмена
            </button>
            <button onClick={handleSave} className="btn-base btn-primary">
              Сохранить
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
