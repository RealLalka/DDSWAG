import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { cn } from '../lib/utils';
import { DateTime } from 'luxon';
import { CustomSelect, CustomNumberInput, CustomInput } from './CustomInputs';
import { CustomDatePicker } from './CustomDatePicker';
import { CustomDayPicker } from './CustomDayPicker';

export type DebtType = 'credit' | 'credit_card' | 'installment' | 'loan' | 'split';

export interface DebtScheduleItem {
  id: string;
  date: string;
  amount: number;
  groupId?: string;
}

export interface Debt {
  id: string;
  name: string;
  amount: number;
  rate: number;
  type: DebtType;
  mandatoryPayment?: number;
  remainingMonths?: number;
  paymentDate?: number;
  schedule?: DebtScheduleItem[];
  startDate?: string;
  priority?: number;
}

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (debt: Debt) => void;
  editingDebt?: Debt | null;
}

const DEBT_TYPE_OPTIONS = [
  { value: 'credit', label: 'Потребительский кредит' },
  { value: 'credit_card', label: 'Кредитная карта' },
  { value: 'installment', label: 'Рассрочка' },
  { value: 'loan', label: 'Займ (МФО / Частный)' },
  { value: 'split', label: 'Сплит (По графику)' },
];

export const DebtModal: React.FC<DebtModalProps> = ({ isOpen, onClose, onSave, editingDebt }) => {
  const [type, setType] = useState<DebtType>('credit');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [mandatoryPayment, setMandatoryPayment] = useState('');
  const [remainingMonths, setRemainingMonths] = useState('');
  const [paymentDate, setPaymentDate] = useState('1');
  const [startDate, setStartDate] = useState(DateTime.now().toISODate() || '');
  const [priority, setPriority] = useState('1');
  const [schedule, setSchedule] = useState<DebtScheduleItem[]>([]);

  const [splitAmount, setSplitAmount] = useState('');
  const [splitCount, setSplitCount] = useState('');
  const [splitStartDate, setSplitStartDate] = useState(DateTime.now().toISODate() || '');
  const [splitInterval, setSplitInterval] = useState('14');

  const handleGenerateSchedule = () => {
    const amount = Number(splitAmount);
    const count = Number(splitCount);
    const interval = Number(splitInterval);
    if (!amount || !count || !interval || !splitStartDate) return;

    const existingGroups = schedule
      .map(s => parseInt(s.groupId?.replace('#', '') || '0'))
      .filter(n => !isNaN(n));
    const nextGroupNum = existingGroups.length > 0 ? Math.max(...existingGroups) + 1 : 1;
    const groupId = `#${nextGroupNum}`;

    const newScheduleItems: DebtScheduleItem[] = [];
    let currentDate = DateTime.fromISO(splitStartDate);

    for (let i = 0; i < count; i++) {
      newScheduleItems.push({
        id: Date.now().toString() + i,
        date: currentDate.toISODate() || '',
        amount: amount,
        groupId: groupId
      });
      if (interval === 30) {
        currentDate = currentDate.plus({ months: 1 });
      } else {
        currentDate = currentDate.plus({ days: interval });
      }
    }
    
    const combined = [...schedule, ...newScheduleItems];
    combined.sort((a, b) => DateTime.fromISO(a.date).toMillis() - DateTime.fromISO(b.date).toMillis());
    setSchedule(combined);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (editingDebt) {
      setType(editingDebt.type);
      setName(editingDebt.name);
      setAmount(editingDebt.amount.toString());
      setRate(editingDebt.rate.toString());
      setMandatoryPayment(editingDebt.mandatoryPayment?.toString() || '');
      setRemainingMonths(editingDebt.remainingMonths?.toString() || '');
      setPaymentDate(editingDebt.paymentDate?.toString() || '1');
      setStartDate(editingDebt.startDate || DateTime.now().toISODate() || '');
      setPriority(editingDebt.priority?.toString() || '1');
      setSchedule(editingDebt.schedule || []);
    } else {
      setType('credit');
      setName('');
      setAmount('');
      setRate('');
      setMandatoryPayment('');
      setRemainingMonths('');
      setPaymentDate('1');
      setStartDate(DateTime.now().toISODate() || '');
      setPriority('1');
      setSchedule([]);
    }
  }, [editingDebt, isOpen]);

  const handleAddScheduleItem = () => {
    const newItem: DebtScheduleItem = { 
      id: Date.now().toString(), 
      date: DateTime.now().toISODate() || '', 
      amount: 0,
      groupId: '-'
    };
    const combined = [...schedule, newItem];
    combined.sort((a, b) => DateTime.fromISO(a.date).toMillis() - DateTime.fromISO(b.date).toMillis());
    setSchedule(combined);
  };

  const handleRemoveScheduleItem = (id: string) => {
    setSchedule(schedule.filter(item => item.id !== id));
  };

  const handleUpdateScheduleItem = (id: string, field: 'date' | 'amount', value: string) => {
    const updated = schedule.map(item => {
      if (item.id === id) {
        return { ...item, [field]: field === 'amount' ? Number(value) : value };
      }
      return item;
    });
    
    if (field === 'date') {
      updated.sort((a, b) => DateTime.fromISO(a.date).toMillis() - DateTime.fromISO(b.date).toMillis());
    }
    
    setSchedule(updated);
  };

  const handleSave = () => {
    if (!name) return;
    
    let finalAmount = Number(amount);
    if (type === 'split') {
      finalAmount = schedule.reduce((sum, item) => sum + item.amount, 0);
      if (finalAmount === 0) return; // Don't save empty splits
    } else {
      if (!finalAmount) return;
    }
    
    const debt: Debt = {
      id: editingDebt ? editingDebt.id : Date.now().toString(),
      name,
      amount: finalAmount,
      rate: Number(rate) || 0,
      type,
      paymentDate: Number(paymentDate) || 1,
      startDate,
      priority: Number(priority) || 1,
    };

    if (type === 'credit_card') {
      debt.mandatoryPayment = Number(mandatoryPayment) || 0;
    } else if (type === 'installment') {
      debt.remainingMonths = Number(remainingMonths) || 1;
    } else if (type === 'split') {
      debt.schedule = schedule;
    }

    onSave(debt);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          onClick={e => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[var(--color-panel)] border border-[var(--color-border-line)] rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col"
        >
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="text-xl font-medium">{editingDebt ? 'Редактировать долг' : 'Добавить долг'}</h2>
            <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-white transition-colors">
              <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto pr-2 flex-1">
            <div>
              <label className="block text-sm text-[var(--color-text-muted)] mb-1">Тип долга</label>
              <CustomSelect 
                value={type} 
                onChange={(val) => setType(val as DebtType)}
                options={DEBT_TYPE_OPTIONS}
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--color-text-muted)] mb-1">Название</label>
              <CustomInput 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder="Например: Ипотека Сбербанк"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--color-text-muted)] mb-1">Дата начала</label>
              <CustomDatePicker 
                value={startDate}
                onChange={setStartDate}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--color-text-muted)] mb-1">Приоритет (1 - высокий)</label>
              <CustomNumberInput 
                value={priority}
                onChange={setPriority}
                min={1}
                max={10}
                className="w-full"
              />
            </div>

            {type !== 'split' && (
              <>
                <div>
                  <label className="block text-sm text-[var(--color-text-muted)] mb-1">Остаток долга (₽)</label>
                  <CustomNumberInput 
                    value={amount} 
                    onChange={setAmount}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                    placeholder="0"
                    step={1000}
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-muted)] mb-1">День платежа (1-31)</label>
                  <CustomDayPicker 
                    value={paymentDate} 
                    onChange={setPaymentDate}
                  />
                </div>
              </>
            )}

            {(type === 'credit' || type === 'loan') && (
              <div>
                <label className="block text-sm text-[var(--color-text-muted)] mb-1">Процентная ставка (% годовых)</label>
                <CustomNumberInput 
                  value={rate} 
                  onChange={setRate}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  placeholder="0"
                  step={0.1}
                />
              </div>
            )}

            {type === 'credit_card' && (
              <>
                <div>
                  <label className="block text-sm text-[var(--color-text-muted)] mb-1">Процентная ставка (% годовых)</label>
                  <CustomNumberInput 
                    value={rate} 
                    onChange={setRate}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                    placeholder="0"
                    step={0.1}
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-text-muted)] mb-1">Обязательный платёж (₽)</label>
                  <CustomNumberInput 
                    value={mandatoryPayment} 
                    onChange={setMandatoryPayment}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                    placeholder="0"
                    step={100}
                  />
                </div>
              </>
            )}

            {type === 'installment' && (
              <div>
                <label className="block text-sm text-[var(--color-text-muted)] mb-1">Осталось месяцев</label>
                <CustomNumberInput 
                  value={remainingMonths} 
                  onChange={setRemainingMonths}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  placeholder="1"
                  min={1}
                />
              </div>
            )}

            {type === 'split' && (
              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-xl border border-[var(--color-border-line)] space-y-3">
                  <h3 className="text-sm font-medium text-[var(--color-text-muted)]">Генерация графика</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[var(--color-text-muted)] mb-1">Сумма платежа</label>
                      <CustomNumberInput 
                        value={splitAmount} 
                        onChange={setSplitAmount}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--color-text-muted)] mb-1">Кол-во платежей</label>
                      <CustomNumberInput 
                        value={splitCount} 
                        onChange={setSplitCount}
                        placeholder="4"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--color-text-muted)] mb-1">Дата первого</label>
                      <CustomDatePicker 
                        value={splitStartDate}
                        onChange={setSplitStartDate}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--color-text-muted)] mb-1">Интервал</label>
                      <CustomSelect 
                        value={splitInterval} 
                        onChange={setSplitInterval}
                        options={[
                          { value: '7', label: '1 неделя' },
                          { value: '14', label: '2 недели' },
                          { value: '30', label: '1 месяц' },
                        ]}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleGenerateSchedule}
                    className="w-full py-2 text-sm bg-[var(--color-swamp-green-dark)] text-[var(--color-swamp-green-light)] rounded-xl hover:bg-[var(--color-swamp-green)] hover:text-white transition-colors"
                  >
                    Сгенерировать
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm text-[var(--color-text-muted)]">График платежей</label>
                    <button onClick={handleAddScheduleItem} className="text-xs flex items-center gap-1 text-[var(--color-swamp-green-light)] hover:text-[var(--color-swamp-green)] transition-colors">
                      <FontAwesomeIcon icon={faPlus} className="w-3 h-3" /> Добавить
                    </button>
                  </div>
                  
                  {schedule.length === 0 ? (
                    <div className="text-sm text-[var(--color-text-muted)] text-center py-4 bg-white/5 rounded-xl border border-dashed border-[var(--color-border-line)]">
                      Нет запланированных платежей
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {schedule.map((item) => {
                        const groupItems = item.groupId && item.groupId !== '-' 
                          ? schedule.filter(s => s.groupId === item.groupId) 
                          : [item];
                        const indexInGroup = groupItems.findIndex(s => s.id === item.id);
                        const leftInGroup = groupItems.length - (indexInGroup + 1);
                        
                        return (
                        <div key={item.id} className="flex gap-2 items-center">
                          <div className="flex flex-col items-center justify-center w-12 shrink-0 bg-white/5 rounded-xl py-1 border border-[var(--color-border-line)]">
                            <span className="text-xs font-medium text-[var(--color-text-main)] truncate w-full text-center px-1">
                              {item.groupId && item.groupId !== '-' ? item.groupId : '-'}
                            </span>
                            {item.groupId && item.groupId !== '-' && (
                              <span className="text-[9px] text-[var(--color-text-muted)]">ост. {leftInGroup}</span>
                            )}
                          </div>
                          <CustomDatePicker 
                            value={item.date}
                            onChange={val => handleUpdateScheduleItem(item.id, 'date', val)}
                            className="flex-1"
                          />
                          <CustomNumberInput 
                            value={item.amount.toString() || ''}
                            onChange={val => handleUpdateScheduleItem(item.id, 'amount', val)}
                            placeholder="Сумма"
                            className="w-32"
                            step={100}
                          />
                          <button onClick={() => handleRemoveScheduleItem(item.id)} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-ash-red)] transition-colors">
                            <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                          </button>
                        </div>
                      )})}
                      <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border-line)] mt-2">
                        <span className="text-sm text-[var(--color-text-muted)]">Итого:</span>
                        <span className="font-mono text-[var(--color-ash-red-light)]">
                          {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(schedule.reduce((sum, item) => sum + item.amount, 0))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={handleSave}
            className="btn-base btn-danger w-full mt-6 shrink-0"
          >
            {editingDebt ? 'Сохранить изменения' : 'Добавить в яму'}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
