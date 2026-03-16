import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faCheck, faTrash } from '@fortawesome/free-solid-svg-icons';
import { CustomNumberInput } from './CustomInputs';
import { CustomDatePicker } from './CustomDatePicker';

export interface Payment {
  id: string;
  userId: number;
  itemId: string;
  itemType: 'income' | 'debt' | 'bill';
  amount: number;
  date: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: Partial<Payment>) => void;
  onDelete?: (paymentId: string) => void;
  onSaveShift?: (shift: { itemId: string, itemType: string, originalDate: string, newDate: string }) => void;
  item: any | null;
  date: string;
  existingPayments: Payment[];
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSave, onDelete, onSaveShift, item, date, existingPayments }) => {
  const [amount, setAmount] = useState<string>('');
  const [isShifting, setIsShifting] = useState(false);
  const [newDate, setNewDate] = useState<string>('');

  const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);
  const expectedAmount = item?.displayAmount || 0;
  const remainingAmount = Math.max(0, expectedAmount - totalPaid);

  useEffect(() => {
    if (isOpen && item) {
      setAmount(remainingAmount > 0 ? remainingAmount.toString() : expectedAmount.toString());
      setIsShifting(false);
      setNewDate(date);
    }
  }, [isOpen, item, remainingAmount, expectedAmount, date]);

  if (!isOpen || !item) return null;

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    onSave({
      itemId: item.id,
      itemType: item.itemType,
      amount: numAmount,
      date: date
    });
    onClose();
  };

  const handleQuickPay = (payAmount: number) => {
    if (payAmount <= 0) return;
    onSave({
      itemId: item.id,
      itemType: item.itemType,
      amount: payAmount,
      date: date
    });
    onClose();
  };

  const handleFullPayment = () => {
    setAmount(remainingAmount.toString());
  };

  const handleSaveShift = () => {
    if (!newDate || !onSaveShift) return;
    onSaveShift({
      itemId: item.id,
      itemType: item.itemType,
      originalDate: item.originalDate || date,
      newDate: newDate
    });
    onClose();
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

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
          className="bg-[var(--color-panel)] border border-[var(--color-border-line)] rounded-[2.5rem] p-6 md:p-8 w-full max-w-md shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col z-10"
        >
          <button onClick={onClose} className="absolute top-6 right-6 text-[var(--color-text-muted)] hover:text-white transition-colors z-10 cursor-pointer">
            <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
          </button>

          <h2 className="text-2xl font-medium mb-6 font-mono text-[var(--color-swamp-green-light)] shrink-0">
            {isShifting ? 'Перенести событие' : 'Отметить платеж'}
          </h2>

          <div className="overflow-y-auto custom-scrollbar pr-2 -mr-2">
            <div className="mb-6 flex justify-between items-start">
              <div>
                <p className="text-sm text-[var(--color-text-muted)] mb-1">Событие</p>
                <p className="font-medium text-lg">{item.displayLabel || item.name}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Дата: {date}</p>
              </div>
              {!isShifting && onSaveShift && (
                <button 
                  onClick={() => setIsShifting(true)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[rgba(0,0,0,0.2)] hover:bg-[rgba(0,0,0,0.4)] border border-[var(--color-border-line)] transition-colors"
                >
                  Перенести
                </button>
              )}
            </div>

            {!isShifting ? (
              <>
                <div className="mb-6 p-4 bg-[rgba(0,0,0,0.2)] rounded-2xl border border-[var(--color-border-line)]">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)] mb-1">Ожидается</p>
                      <p className="font-mono text-lg">{formatCurrency(expectedAmount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--color-text-muted)] mb-1">Уже оплачено</p>
                      <p className="font-mono text-lg text-[var(--color-swamp-green-light)]">{formatCurrency(totalPaid)}</p>
                    </div>
                  </div>
                  
                  <div className="w-full h-2 bg-[rgba(0,0,0,0.3)] rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-[var(--color-swamp-green-light)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (totalPaid / (expectedAmount || 1)) * 100)}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {existingPayments.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm text-[var(--color-text-muted)] mb-3">История платежей</p>
                    <div className="flex flex-col gap-2">
                      {existingPayments.map(p => (
                        <div key={p.id} className="flex justify-between items-center p-3 bg-[rgba(0,0,0,0.2)] rounded-xl border border-[var(--color-border-line)]">
                          <span className="font-mono text-sm">{formatCurrency(p.amount)}</span>
                          {onDelete && (
                            <button onClick={() => onDelete(p.id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-ash-red)] transition-colors p-1">
                              <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4 mb-8">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-[var(--color-text-muted)]">Сумма нового платежа (₽)</label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <CustomNumberInput value={amount} onChange={setAmount} />
                      </div>
                      {remainingAmount > 0 && (
                        <button 
                          onClick={() => handleQuickPay(remainingAmount)}
                          className="px-4 bg-[rgba(0,0,0,0.2)] hover:bg-[rgba(0,0,0,0.4)] border border-[var(--color-border-line)] rounded-xl text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-2"
                        >
                          <FontAwesomeIcon icon={faCheck} className="text-[var(--color-swamp-green-light)]" /> Оплатить остаток
                        </button>
                      )}
                    </div>
                    {remainingAmount > 0 && (
                      <div className="flex gap-2 mt-2">
                        {[0.25, 0.5, 0.75].map(fraction => {
                          const fracAmount = Math.round(remainingAmount * fraction);
                          return (
                            <button
                              key={fraction}
                              onClick={() => setAmount(fracAmount.toString())}
                              className="flex-1 py-1.5 text-xs font-mono bg-[rgba(0,0,0,0.1)] hover:bg-[rgba(0,0,0,0.3)] border border-[var(--color-border-line)] rounded-lg transition-colors flex flex-col items-center justify-center"
                            >
                              <span>{fraction * 100}%</span>
                              <span className="text-[10px] text-[var(--color-text-muted)]">{formatCurrency(fracAmount)}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-4 mb-8">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-[var(--color-text-muted)]">Новая дата</label>
                  <CustomDatePicker
                    value={newDate}
                    onChange={setNewDate}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 shrink-0 mt-4">
            <button onClick={() => isShifting ? setIsShifting(false) : onClose()} className="flex-1 py-3 rounded-xl font-medium bg-[rgba(0,0,0,0.2)] hover:bg-[rgba(0,0,0,0.4)] transition-colors cursor-pointer">
              Отмена
            </button>
            <button 
              onClick={isShifting ? handleSaveShift : handleSave} 
              disabled={!isShifting && (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)}
              className="flex-1 py-3 rounded-xl font-medium btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <FontAwesomeIcon icon={faCheck} /> {isShifting ? 'Сохранить перенос' : 'Внести платеж'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
