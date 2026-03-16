import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, Reorder, AnimatePresence } from 'motion/react';
import { DateTime } from 'luxon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faArrowTrendDown, faArrowTrendUp, faWallet, faCalendarDays, faTriangleExclamation, faDownload, faUpload, faPen, faRightFromBracket, faChartPie, faHeartPulse, faFileInvoiceDollar, faGear } from '@fortawesome/free-solid-svg-icons';
import { useFloating, offset, flip, shift, autoUpdate, useInteractions, useClick, useDismiss, useRole, FloatingPortal, FloatingFocusManager } from '@floating-ui/react';
import { DevilIcon } from './DevilIcon';
import { cn } from '../lib/utils';
import { DebtModal, Debt } from './DebtModal';
import { BillModal, Bill } from './BillModal';
import { ExportPreviewModal } from './ExportPreviewModal';
import { AuthModal } from './AuthModal';
import { IncomeModal, Income } from './IncomeModal';
import { CalendarView } from './CalendarView';
import { CustomDatePicker } from './CustomDatePicker';
import { CustomNumberInput } from './CustomInputs';
import { SettingsModal } from './SettingsModal';
import { Payment } from './PaymentModal';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

export const Dashboard: React.FC = () => {
  const [user, setUser] = useState<{ id: number; username: string; minBudget: number; calendarStartDate?: string; debtStartDate?: string; targetMonths?: number; avatarUrl?: string; } | null>(null);
  
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [itemShifts, setItemShifts] = useState<any[]>([]);
  
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar'>('dashboard');
  const [minBudget, setMinBudget] = useState<number>(15000);
  const [calendarStartDate, setCalendarStartDate] = useState<string>('');
  const [debtStartDate, setDebtStartDate] = useState<string>('');

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { refs: profileRefs, floatingStyles: profileFloatingStyles, context: profileContext } = useFloating({
    open: isProfileMenuOpen,
    onOpenChange: setIsProfileMenuOpen,
    placement: 'bottom-end',
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  });
  const profileClick = useClick(profileContext);
  const profileDismiss = useDismiss(profileContext);
  const profileRole = useRole(profileContext);
  const { getReferenceProps: getProfileReferenceProps, getFloatingProps: getProfileFloatingProps } = useInteractions([profileClick, profileDismiss, profileRole]);

  const fetchData = () => {
    if (user) {
      fetch(`/api/incomes?userId=${user.id}`)
        .then(res => res.json())
        .then(data => setIncomes(data))
        .catch(console.error);

      fetch(`/api/debts?userId=${user.id}`)
        .then(res => res.json())
        .then(data => setDebts(data))
        .catch(console.error);

      fetch(`/api/bills?userId=${user.id}`)
        .then(res => res.json())
        .then(data => setBills(data))
        .catch(console.error);

      fetch(`/api/payments?userId=${user.id}`)
        .then(res => res.json())
        .then(data => setPayments(data))
        .catch(console.error);

      fetch(`/api/item-shifts?userId=${user.id}`)
        .then(res => res.json())
        .then(data => setItemShifts(data))
        .catch(console.error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      setMinBudget(user.minBudget || 15000);
      setCalendarStartDate(user.calendarStartDate || DateTime.now().toISODate() || '');
      setDebtStartDate(user.debtStartDate || DateTime.now().toISODate() || '');
      setTargetMonths(user.targetMonths || 24);
    }
  }, [user]);

  const handleSettingsChange = async (field: 'calendarStartDate' | 'debtStartDate', val: string) => {
    if (field === 'calendarStartDate') setCalendarStartDate(val);
    if (field === 'debtStartDate') setDebtStartDate(val);
    
    if (user) {
      const updatedUser = { ...user, [field]: val };
      setUser(updatedUser);
      await fetch(`/api/users/${user.id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          calendarStartDate: field === 'calendarStartDate' ? val : calendarStartDate,
          debtStartDate: field === 'debtStartDate' ? val : debtStartDate
        })
      });
    }
  };

  const handleTargetMonthsChange = async (val: number) => {
    setTargetMonths(val);
    if (user) {
      setUser({ ...user, targetMonths: val });
      await fetch(`/api/users/${user.id}/target-months`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetMonths: val })
      });
    }
  };

  const handleMinBudgetChange = async (val: number) => {
    setMinBudget(val);
    if (user) {
      setUser({ ...user, minBudget: val });
      await fetch(`/api/users/${user.id}/min-budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minBudget: val })
      });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.incomes) {
          await Promise.all(data.incomes.map((inc: any) => fetch('/api/incomes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...inc, userId: user.id })
          })));
        }
        if (data.debts) {
          await Promise.all(data.debts.map((debt: any) => fetch('/api/debts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...debt, userId: user.id })
          })));
        }
        fetchData();
      } catch (err) {
        console.error('Import failed', err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportJSON = () => {
    const data = {
      incomes,
      debts,
      minBudget
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_backup_${DateTime.now().toFormat('yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calculations
  const remainingDebts = useMemo(() => {
    return debts.map(debt => {
      const paid = payments.filter(p => p.itemId === debt.id && p.itemType === 'debt').reduce((acc, p) => acc + p.amount, 0);
      return { ...debt, amount: Math.max(0, debt.amount - paid) };
    });
  }, [debts, payments]);

  const totalIncome = useMemo(() => incomes.reduce((sum, item) => sum + item.amount, 0), [incomes]);
  const totalDebt = useMemo(() => remainingDebts.reduce((sum, item) => sum + item.amount, 0), [remainingDebts]);
  const totalBills = useMemo(() => bills.reduce((sum, item) => sum + item.amount, 0), [bills]);

  const calculateMonthlyPaymentForDebt = (debt: Debt, months: number) => {
    if (debt.type === 'credit_card') {
      const r = debt.rate / 100 / 12;
      const requiredPayment = r === 0 ? debt.amount / months : (debt.amount * r) / (1 - Math.pow(1 + r, -months));
      return Math.max(requiredPayment, debt.mandatoryPayment || 0);
    } else if (debt.type === 'installment') {
      return debt.amount / (debt.remainingMonths || 1);
    } else if (debt.type === 'split') {
      return debt.amount / months;
    } else {
      const r = debt.rate / 100 / 12;
      if (r === 0) return debt.amount / months;
      return (debt.amount * r) / (1 - Math.pow(1 + r, -months));
    }
  };

  const minMonths = useMemo(() => {
    for (let m = 1; m <= 120; m++) {
      const payment = remainingDebts.reduce((sum, debt) => sum + calculateMonthlyPaymentForDebt(debt, m), 0);
      if (totalIncome - payment - totalBills >= minBudget) {
        return m;
      }
    }
    return 120;
  }, [remainingDebts, totalIncome, minBudget, totalBills]);

  const [targetMonths, setTargetMonths] = useState<number>(24);

  useEffect(() => {
    if (targetMonths < minMonths) {
      setTargetMonths(minMonths);
    }
  }, [minMonths, targetMonths]);

  const monthlyPayments = useMemo(() => {
    return remainingDebts.map(debt => ({
      ...debt,
      monthlyPayment: calculateMonthlyPaymentForDebt(debt, targetMonths)
    }));
  }, [remainingDebts, targetMonths]);

  const totalMonthlyPayment = useMemo(() => 
    monthlyPayments.reduce((sum, item) => sum + item.monthlyPayment, 0)
  , [monthlyPayments]);

  const remainingBudget = totalIncome - totalMonthlyPayment - totalBills;
  const dti = totalIncome > 0 ? ((totalMonthlyPayment + totalBills) / totalIncome) * 100 : 0;

  // Chart Data
  const chartData = useMemo(() => {
    const data = [];
    let currentTotalDebt = totalDebt;
    for (let i = 0; i <= targetMonths; i++) {
      data.push({
        month: i,
        debt: Math.max(0, Math.round(currentTotalDebt)),
      });
      const principalPaid = totalMonthlyPayment - (currentTotalDebt * (remainingDebts.reduce((acc, d) => acc + d.rate, 0) / (remainingDebts.length || 1)) / 100 / 12);
      currentTotalDebt -= principalPaid;
    }
    return data;
  }, [totalDebt, targetMonths, totalMonthlyPayment, remainingDebts]);

  // Handlers
  const handleSaveIncome = async (income: Income) => {
    if (!user) return;
    try {
      if (editingIncome) {
        await fetch(`/api/incomes/${income.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(income)
        });
        setIncomes(incomes.map(i => i.id === income.id ? income : i));
      } else {
        await fetch('/api/incomes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...income, userId: user.id })
        });
        setIncomes([...incomes, income]);
      }
    } catch (err) {
      console.error('Failed to save income', err);
    }
  };

  const removeIncome = async (id: string) => {
    try {
      await fetch(`/api/incomes/${id}`, { method: 'DELETE' });
      setIncomes(incomes.filter(i => i.id !== id));
    } catch (err) {
      console.error('Failed to delete income', err);
    }
  };

  const openAddIncome = () => {
    setEditingIncome(null);
    setIsIncomeModalOpen(true);
  };

  const openEditIncome = (income: Income) => {
    setEditingIncome(income);
    setIsIncomeModalOpen(true);
  };

  const handleSaveDebt = async (debt: Debt) => {
    if (!user) return;
    try {
      if (editingDebt) {
        await fetch(`/api/debts/${debt.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(debt)
        });
        setDebts(debts.map(d => d.id === debt.id ? debt : d));
      } else {
        await fetch('/api/debts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...debt, userId: user.id })
        });
        setDebts([...debts, debt]);
      }
    } catch (err) {
      console.error('Failed to save debt', err);
    }
  };

  const removeDebt = async (id: string) => {
    try {
      await fetch(`/api/debts/${id}`, { method: 'DELETE' });
      setDebts(debts.filter(d => d.id !== id));
    } catch (err) {
      console.error('Failed to delete debt', err);
    }
  };

  const openAddDebt = () => {
    setEditingDebt(null);
    setIsDebtModalOpen(true);
  };

  const openEditDebt = (debt: Debt) => {
    setEditingDebt(debt);
    setIsDebtModalOpen(true);
  };

  const handleSaveBill = async (bill: Bill) => {
    if (!user) return;
    try {
      if (editingBill) {
        await fetch(`/api/bills/${bill.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bill)
        });
        setBills(bills.map(b => b.id === bill.id ? bill : b));
      } else {
        await fetch('/api/bills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...bill, userId: user.id })
        });
        setBills([...bills, bill]);
      }
    } catch (err) {
      console.error('Failed to save bill', err);
    }
  };

  const removeBill = async (id: string) => {
    try {
      await fetch(`/api/bills/${id}`, { method: 'DELETE' });
      setBills(bills.filter(b => b.id !== id));
    } catch (err) {
      console.error('Failed to delete bill', err);
    }
  };

  const openAddBill = () => {
    setEditingBill(null);
    setIsBillModalOpen(true);
  };

  const openEditBill = (bill: Bill) => {
    setEditingBill(bill);
    setIsBillModalOpen(true);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

  if (!user) {
    return <AuthModal onLogin={setUser} />;
  }

  return (
    <div className={cn("min-h-screen mx-auto flex flex-col pb-24 md:pb-8 transition-all duration-300", activeTab === 'calendar' ? "p-2 md:p-4 max-w-[1800px]" : "p-4 md:p-6 lg:p-8 max-w-[1600px]")}>
      <header className="flex flex-row items-center justify-between mb-6 md:mb-8 pb-4 md:pb-6 border-b border-[var(--color-border-line)] gap-4 shrink-0">
        <div className="flex items-center gap-3 md:gap-4 cursor-pointer group flex-1 justify-start min-w-0">
          <div className="w-10 h-10 md:w-14 md:h-14 shrink-0 group-hover:scale-105 transition-transform">
            <DevilIcon className="w-full h-full" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-3xl font-bold font-mono tracking-wider text-[var(--color-ash-red-light)] group-hover:text-[var(--color-ash-red)] transition-colors truncate">Должная Душа<span className="text-[var(--color-swamp-green-light)]">.swag</span></h1>
            <p className="text-[10px] md:text-sm text-[var(--color-text-muted)] font-mono truncate">Аналитика выживания</p>
          </div>
        </div>

        <div className="flex bg-[rgba(0,0,0,0.2)] p-1 rounded-2xl border border-[var(--color-border-line)] shrink-0 max-md:fixed max-md:bottom-4 max-md:left-1/2 max-md:-translate-x-1/2 max-md:z-50 max-md:shadow-2xl max-md:bg-[var(--color-bg-dark)] max-md:border-[var(--color-border-line)]">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn("flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all", activeTab === 'dashboard' ? "bg-[var(--color-panel)] text-white shadow-md" : "text-[var(--color-text-muted)] hover:text-white")}
          >
            <FontAwesomeIcon icon={faChartPie} className="w-4 h-4" /> <span className="hidden sm:inline">Дашборд</span>
          </button>
          <button 
            onClick={() => setActiveTab('calendar')}
            className={cn("flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all", activeTab === 'calendar' ? "bg-[var(--color-panel)] text-white shadow-md" : "text-[var(--color-text-muted)] hover:text-white")}
          >
            <FontAwesomeIcon icon={faCalendarDays} className="w-4 h-4" /> <span className="hidden sm:inline">Календарь</span>
          </button>
        </div>

        <div className="flex items-center gap-3 w-auto shrink-0 justify-end">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            accept=".json" 
            className="hidden" 
          />

          <div 
            ref={profileRefs.setReference}
            {...getProfileReferenceProps()}
            className="flex items-center gap-3 cursor-pointer bg-[rgba(0,0,0,0.2)] p-1.5 md:pr-4 rounded-full border border-[var(--color-border-line)] hover:border-[var(--color-swamp-green-light)] transition-colors shrink-0"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[var(--color-swamp-green-dark)] border border-[var(--color-swamp-green)] flex items-center justify-center text-[var(--color-swamp-green-light)] font-bold uppercase text-sm md:text-base overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                user.username.charAt(0)
              )}
            </div>
            <span className="text-sm font-medium text-white hidden md:block">{user.username}</span>
          </div>

          <FloatingPortal>
            <AnimatePresence>
              {isProfileMenuOpen && (
                <FloatingFocusManager context={profileContext} modal={false}>
                  <div ref={profileRefs.setFloating} style={{ ...profileFloatingStyles, zIndex: 9999 }}>
                    <motion.div 
                      {...getProfileFloatingProps()}
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="w-56 bg-[var(--color-panel)] border border-[var(--color-border-line)] rounded-2xl shadow-xl overflow-hidden flex flex-col p-1"
                    >
                      <div className="px-3 py-2 border-b border-[var(--color-border-line)] mb-1">
                        <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Профиль</span>
                        <div className="text-white font-medium truncate mt-1">{user.username}</div>
                        <div className="text-xs text-[var(--color-ash-red-light)] mt-1 font-mono">Долг: {formatCurrency(totalDebt)}</div>
                      </div>
                      
                      <button 
                        onClick={() => { setIsSettingsModalOpen(true); setIsProfileMenuOpen(false); }}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--color-text-main)] hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-colors text-left"
                      >
                        <FontAwesomeIcon icon={faGear} className="w-4 h-4 text-[var(--color-text-muted)]" />
                        Настройки
                      </button>

                      <div className="h-px bg-[var(--color-border-line)] my-1" />

                      <button 
                        onClick={() => { fileInputRef.current?.click(); setIsProfileMenuOpen(false); }}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--color-text-main)] hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-colors text-left"
                      >
                        <FontAwesomeIcon icon={faUpload} className="w-4 h-4 text-[var(--color-text-muted)]" />
                        Импорт JSON
                      </button>
                      
                      <button 
                        onClick={() => { handleExportJSON(); setIsProfileMenuOpen(false); }}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--color-text-main)] hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-colors text-left"
                      >
                        <FontAwesomeIcon icon={faDownload} className="w-4 h-4 text-[var(--color-text-muted)]" />
                        Экспорт JSON
                      </button>

                      <button 
                        onClick={() => { setIsExportModalOpen(true); setIsProfileMenuOpen(false); }}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--color-text-main)] hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-colors text-left"
                      >
                        <FontAwesomeIcon icon={faDownload} className="w-4 h-4 text-[var(--color-text-muted)]" />
                        Экспорт PDF/JPG
                      </button>

                      <div className="h-px bg-[var(--color-border-line)] my-1" />

                      <button 
                        onClick={() => { setUser(null); setIsProfileMenuOpen(false); }}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--color-ash-red-light)] hover:bg-[rgba(140,74,74,0.1)] rounded-xl transition-colors text-left"
                      >
                        <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
                        Выйти
                      </button>
                    </motion.div>
                  </div>
                </FloatingFocusManager>
              )}
            </AnimatePresence>
          </FloatingPortal>
        </div>
      </header>

      {activeTab === 'calendar' ? (
        <CalendarView 
          incomes={incomes} 
          debts={remainingDebts} 
          bills={bills}
          payments={payments}
          onSavePayment={async (payment) => {
            if (!user) return;
            try {
              if (payment.id) {
                await fetch(`/api/payments/${payment.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payment)
                });
                setPayments(payments.map(p => p.id === payment.id ? payment as Payment : p));
              } else {
                const newPayment = { ...payment, id: crypto.randomUUID(), userId: user.id };
                await fetch('/api/payments', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newPayment)
                });
                setPayments([...payments, newPayment as Payment]);
              }
            } catch (err) {
              console.error('Failed to save payment', err);
            }
          }}
          onDeletePayment={async (paymentId) => {
            if (!user) return;
            try {
              await fetch(`/api/payments/${paymentId}`, {
                method: 'DELETE'
              });
              setPayments(payments.filter(p => p.id !== paymentId));
            } catch (err) {
              console.error('Failed to delete payment', err);
            }
          }}
          itemShifts={itemShifts}
          onSaveShift={async (shift) => {
            if (!user) return;
            try {
              const res = await fetch('/api/item-shifts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...shift, id: crypto.randomUUID(), userId: user.id })
              });
              const data = await res.json();
              if (data.success) {
                // Refresh shifts
                fetch(`/api/item-shifts?userId=${user.id}`)
                  .then(res => res.json())
                  .then(data => setItemShifts(data))
                  .catch(console.error);
              }
            } catch (err) {
              console.error('Failed to save shift', err);
            }
          }}
          calendarStartDate={calendarStartDate}
          debtStartDate={debtStartDate}
          targetMonths={targetMonths}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 md:gap-6 flex-1">
          {/* Summary Cards */}
          <div className="col-span-1 md:col-span-6 lg:col-span-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-4 md:gap-6">
            {/* Widget 1: Cashflow Stack */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[var(--color-panel)] rounded-[2.5rem] p-4 flex flex-col gap-3 col-span-2 md:col-span-4 lg:col-span-4 justify-center shadow-lg">
              {/* Income */}
              <div className="w-full bg-[var(--color-swamp-green-dark)] rounded-[1.5rem] p-2 md:p-3 flex justify-between items-center pr-4 md:pr-5">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[var(--color-swamp-green)] flex items-center justify-center shadow-sm shrink-0">
                    <FontAwesomeIcon icon={faWallet} className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-white/90 truncate">Доход</span>
                </div>
                <span className="font-mono text-sm md:text-lg text-white font-bold truncate ml-2">{formatCurrency(totalIncome)}</span>
              </div>
              {/* Payment */}
              <div className="w-full bg-[var(--color-ash-red-dark)] rounded-[1.5rem] p-2 md:p-3 flex justify-between items-center pr-4 md:pr-5">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[var(--color-ash-red)] flex items-center justify-center shadow-sm shrink-0">
                    <FontAwesomeIcon icon={faArrowTrendUp} className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-white/90 truncate">Платёж</span>
                </div>
                <span className="font-mono text-sm md:text-lg text-white font-bold truncate ml-2">{formatCurrency(totalMonthlyPayment)}</span>
              </div>
              {/* Bills */}
              <div className="w-full bg-[rgba(140,100,74,0.2)] rounded-[1.5rem] p-2 md:p-3 flex justify-between items-center pr-4 md:pr-5">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[rgba(140,100,74,0.5)] flex items-center justify-center shadow-sm shrink-0">
                    <FontAwesomeIcon icon={faFileInvoiceDollar} className="w-3 h-3 md:w-4 md:h-4 text-yellow-500" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-white/90 truncate">Счета</span>
                </div>
                <span className="font-mono text-sm md:text-lg text-yellow-500 font-bold truncate ml-2">{formatCurrency(totalBills)}</span>
              </div>
            </motion.div>

            {/* Widget 2: Debt */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-[var(--color-panel)] rounded-[2.5rem] p-4 flex flex-col items-center justify-between gap-3 col-span-1 md:col-span-2 lg:col-span-3 min-h-[200px] shadow-lg">
              <div className="w-full flex-1 bg-[var(--color-ash-red)] rounded-[2rem] flex flex-col items-center justify-center px-4 relative overflow-hidden shadow-inner">
                <FontAwesomeIcon icon={faArrowTrendDown} className="absolute top-4 left-4 md:top-5 md:left-5 w-4 h-4 md:w-5 md:h-5 text-white/30" />
                <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-mono text-white font-bold truncate z-10 w-full text-center">{formatCurrency(totalDebt)}</span>
              </div>
              <span className="text-xs md:text-sm text-white/60 font-medium pb-1">Общий долг</span>
            </motion.div>

            {/* Widget 3: Remaining */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[var(--color-panel)] rounded-[2.5rem] p-4 flex flex-col items-center justify-between gap-3 col-span-1 md:col-span-2 lg:col-span-3 min-h-[200px] shadow-lg">
              <div className={cn("w-full flex-1 rounded-[2rem] flex flex-col items-center justify-center px-4 relative overflow-hidden shadow-inner", remainingBudget >= minBudget ? "bg-[#E0E0E0] text-[var(--color-panel)]" : "bg-[var(--color-ash-red)] text-white")}>
                <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-mono font-bold truncate z-10 w-full text-center">{formatCurrency(remainingBudget)}</span>
              </div>
              <span className="text-xs md:text-sm text-white/60 font-medium pb-1">Остаток</span>
            </motion.div>

            {/* Widget 4: DTI */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-[var(--color-panel)] rounded-[2.5rem] p-4 flex flex-col items-center justify-between gap-3 col-span-2 md:col-span-4 lg:col-span-2 min-h-[200px] shadow-lg">
              <div className="w-full flex-1 bg-[rgba(255,255,255,0.05)] rounded-[2rem] flex flex-col items-center justify-center px-2 relative">
                <FontAwesomeIcon icon={faHeartPulse} className={cn("w-6 h-6 md:w-8 md:h-8 mb-2 md:mb-3", dti > 50 ? "text-[var(--color-ash-red-light)]" : dti > 30 ? "text-yellow-400" : "text-[var(--color-swamp-green-light)]")} />
                <span className={cn("text-xl md:text-2xl font-mono font-bold", dti > 50 ? "text-[var(--color-ash-red-light)]" : dti > 30 ? "text-yellow-400" : "text-[var(--color-swamp-green-light)]")}>{dti.toFixed(1)}%</span>
              </div>
              <span className="text-xs md:text-sm text-white/60 font-medium pb-1">Нагрузка</span>
            </motion.div>
          </div>

          {/* Left Column: Settings & Incomes */}
          <div className="col-span-1 md:col-span-3 lg:col-span-4 flex flex-col gap-4 md:gap-6">
            
            {/* Settings Panel */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bento-panel p-6 rounded-[2.5rem]">
              <h2 className="text-lg font-medium mb-6 flex items-center gap-2"><FontAwesomeIcon icon={faCalendarDays} className="w-5 h-5 text-[var(--color-swamp-green-light)]"/> Горизонт планирования</h2>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <label className="text-sm text-[var(--color-text-muted)]">За сколько месяцев хотите закрыть долги?</label>
                  <div className="flex items-center gap-4 bg-[rgba(0,0,0,0.2)] p-4 rounded-2xl linear-border">
                    <input 
                      type="range" 
                      min={minMonths} max="120" 
                      value={targetMonths} 
                      onChange={(e) => handleTargetMonthsChange(Number(e.target.value))}
                      className="w-full accent-[var(--color-swamp-green)]"
                    />
                    <span className="font-mono text-2xl w-16 text-right text-[var(--color-swamp-green-light)]">{targetMonths}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-sm text-[var(--color-text-muted)]">Минимальный остаток на жизнь (₽)</label>
                  <CustomNumberInput 
                    value={minBudget.toString()} 
                    onChange={(val) => handleMinBudgetChange(Number(val))}
                    inputClassName="text-xl text-[var(--color-swamp-green-light)]"
                    step={1000}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-[var(--color-text-muted)]">Начало отсчёта (календарь)</label>
                    <CustomDatePicker 
                      value={calendarStartDate} 
                      onChange={(val) => handleSettingsChange('calendarStartDate', val)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-[var(--color-text-muted)]">Начало отсчёта (долги)</label>
                    <CustomDatePicker 
                      value={debtStartDate} 
                      onChange={(val) => handleSettingsChange('debtStartDate', val)}
                    />
                  </div>
                </div>

                {minMonths > 1 && (
                  <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                    <FontAwesomeIcon icon={faTriangleExclamation} className="w-3 h-3 text-yellow-600/70" />
                    Минимум {minMonths} мес. для сохранения остатка от {formatCurrency(minBudget)}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Income Panel */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bento-panel p-6 rounded-[2.5rem] flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium flex items-center gap-2"><FontAwesomeIcon icon={faWallet} className="w-5 h-5 text-[var(--color-swamp-green-light)]"/> Источники дохода</h2>
                <button onClick={openAddIncome} className="btn-base btn-primary py-2 px-4 text-sm">
                  <FontAwesomeIcon icon={faPlus} className="w-4 h-4" /> <span className="hidden sm:inline">Добавить</span>
                </button>
              </div>
              
              <Reorder.Group axis="y" values={incomes} onReorder={setIncomes} className="space-y-3 flex-1 overflow-y-auto pr-2">
                {incomes.map(income => (
                  <Reorder.Item key={income.id} value={income} className="flex items-center justify-between p-4 rounded-2xl bg-[rgba(0,0,0,0.2)] linear-border group hover:border-[var(--color-swamp-green-dark)] transition-colors cursor-grab active:cursor-grabbing">
                    <span className="font-medium">{income.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-[var(--color-swamp-green-light)]">{formatCurrency(income.amount)}</span>
                      <button onClick={() => openEditIncome(income)} className="text-[var(--color-text-muted)] hover:text-white transition-colors md:opacity-0 group-hover:opacity-100 p-1">
                        <FontAwesomeIcon icon={faPen} className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeIncome(income.id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-ash-red)] transition-colors md:opacity-0 group-hover:opacity-100 p-1">
                        <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                      </button>
                    </div>
                  </Reorder.Item>
                ))}
                {incomes.length === 0 && (
                  <div className="text-center text-[var(--color-text-muted)] p-6 border border-dashed border-[var(--color-border-line)] rounded-2xl">
                    Нет добавленных доходов
                  </div>
                )}
              </Reorder.Group>
            </motion.div>

            {/* Bills Panel */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} className="bento-panel p-6 rounded-[2.5rem] flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium flex items-center gap-2"><FontAwesomeIcon icon={faFileInvoiceDollar} className="w-5 h-5 text-yellow-400/80"/> Обязательные платежи</h2>
                <button onClick={openAddBill} className="btn-base btn-primary py-2 px-4 text-sm">
                  <FontAwesomeIcon icon={faPlus} className="w-4 h-4" /> <span className="hidden sm:inline">Добавить</span>
                </button>
              </div>
              
              <Reorder.Group axis="y" values={bills} onReorder={setBills} className="space-y-3 flex-1 overflow-y-auto pr-2">
                {bills.map(bill => (
                  <Reorder.Item key={bill.id} value={bill} className="flex items-center justify-between p-4 rounded-2xl bg-[rgba(0,0,0,0.2)] linear-border group hover:border-yellow-600/30 transition-colors cursor-grab active:cursor-grabbing">
                    <div className="flex flex-col">
                      <span className="font-medium">{bill.name}</span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">День: {bill.dueDate}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-yellow-400/80">{formatCurrency(bill.amount)}</span>
                      <button onClick={() => openEditBill(bill)} className="text-[var(--color-text-muted)] hover:text-white transition-colors md:opacity-0 group-hover:opacity-100 p-1">
                        <FontAwesomeIcon icon={faPen} className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeBill(bill.id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-ash-red)] transition-colors md:opacity-0 group-hover:opacity-100 p-1">
                        <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                      </button>
                    </div>
                  </Reorder.Item>
                ))}
                {bills.length === 0 && (
                  <div className="text-center text-[var(--color-text-muted)] p-6 border border-dashed border-[var(--color-border-line)] rounded-2xl">
                    Нет обязательных платежей
                  </div>
                )}
              </Reorder.Group>
            </motion.div>
          </div>

          {/* Middle Column: Debts */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="col-span-1 md:col-span-3 lg:col-span-8 flex flex-col gap-4 md:gap-6">
            
            <div className="bento-panel p-6 rounded-[2.5rem] flex-1 flex flex-col min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium flex items-center gap-2"><FontAwesomeIcon icon={faArrowTrendDown} className="w-5 h-5 text-[var(--color-ash-red-light)]"/> Долговая яма</h2>
                <button onClick={openAddDebt} className="btn-base btn-danger py-2 px-4 text-sm">
                  <FontAwesomeIcon icon={faPlus} className="w-4 h-4" /> <span className="hidden sm:inline">Добавить</span>
                </button>
              </div>
              
              <Reorder.Group axis="y" values={debts} onReorder={setDebts} className="flex flex-col gap-4 flex-1 overflow-y-auto pr-2 content-start">
                {debts.map(debt => {
                  const remainingDebt = remainingDebts.find(d => d.id === debt.id);
                  const displayAmount = remainingDebt ? remainingDebt.amount : debt.amount;
                  const monthlyPayment = monthlyPayments.find(mp => mp.id === debt.id)?.monthlyPayment || 0;
                  return (
                  <Reorder.Item key={debt.id} value={debt} className="p-5 rounded-2xl bg-[rgba(0,0,0,0.2)] linear-border relative group hover:border-[var(--color-ash-red-dark)] transition-colors flex flex-col cursor-grab active:cursor-grabbing">
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button onClick={() => openEditDebt(debt)} className="text-[var(--color-text-muted)] hover:text-white transition-colors md:opacity-0 group-hover:opacity-100 p-1 bg-[var(--color-panel)] rounded-md">
                        <FontAwesomeIcon icon={faPen} className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeDebt(debt.id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-ash-red)] transition-colors md:opacity-0 group-hover:opacity-100 p-1 bg-[var(--color-panel)] rounded-md">
                        <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="pr-16 mb-4">
                      <h3 className="font-medium text-lg truncate">{debt.name}</h3>
                      <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] bg-[var(--color-panel)] px-2 py-1 rounded-md mt-2 inline-block">
                        {debt.type === 'credit_card' ? 'Кредитная карта' : debt.type === 'installment' ? 'Рассрочка' : debt.type === 'loan' ? 'Займ' : debt.type === 'split' ? 'Сплит' : 'Кредит'}
                      </span>
                    </div>

                    <div className="flex justify-between items-end mt-auto">
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">Остаток</p>
                        <p className="font-mono text-xl">{formatCurrency(displayAmount)}</p>
                      </div>
                      {debt.type !== 'installment' && debt.type !== 'split' && (
                        <div className="text-right">
                          <p className="text-xs text-[var(--color-text-muted)] mb-1">Ставка</p>
                          <p className="font-mono text-[var(--color-ash-red-light)]">{debt.rate}%</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-[var(--color-border-line)] flex justify-between items-center bg-[rgba(0,0,0,0.1)] -mx-5 -mb-5 px-5 py-4 rounded-b-2xl">
                      <span className="text-xs text-[var(--color-text-muted)]">Платёж ({debt.type === 'installment' ? debt.remainingMonths : debt.type === 'split' ? 'в мес.' : targetMonths + ' мес.'})</span>
                      <span className="font-mono font-medium text-[var(--color-ash-red)]">{formatCurrency(monthlyPayment)}</span>
                    </div>
                  </Reorder.Item>
                )})}
                {debts.length === 0 && (
                  <div className="text-center text-[var(--color-text-muted)] p-6 border border-dashed border-[var(--color-border-line)] rounded-2xl">
                    Нет добавленных долгов
                  </div>
                )}
              </Reorder.Group>
            </div>

            {/* Bottom Chart */}
            <div className="bento-panel p-6 rounded-[2.5rem] h-64 lg:h-80">
              <h2 className="text-sm font-medium mb-4 flex items-center gap-2 text-[var(--color-text-muted)] uppercase tracking-wider">Проекция сжигания долга</h2>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-ash-red-light)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-ash-red-dark)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-line)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--color-text-muted)" tick={{fill: 'var(--color-text-muted)', fontSize: 10}} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-text-muted)" tick={{fill: 'var(--color-text-muted)', fontSize: 10}} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border-line)', borderRadius: '12px', color: 'var(--color-text-main)', padding: '12px' }}
                    itemStyle={{ color: 'var(--color-ash-red-light)', fontWeight: 'bold' }}
                    formatter={(value: number) => [formatCurrency(value), 'Остаток долга']}
                    labelFormatter={(label) => `Месяц ${label}`}
                  />
                  <Area type="monotone" dataKey="debt" stroke="var(--color-ash-red-light)" strokeWidth={3} fillOpacity={1} fill="url(#colorDebt)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

          </motion.div>
        </div>
      )}

      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        onSave={handleSaveIncome}
        editingIncome={editingIncome}
      />

      <DebtModal 
        isOpen={isDebtModalOpen} 
        onClose={() => setIsDebtModalOpen(false)} 
        onSave={handleSaveDebt}
        editingDebt={editingDebt}
      />

      <BillModal 
        isOpen={isBillModalOpen} 
        onClose={() => setIsBillModalOpen(false)} 
        onSave={handleSaveBill}
        editingBill={editingBill}
      />

      <ExportPreviewModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        incomes={incomes}
        debts={debts}
        targetMonths={targetMonths}
        totalIncome={totalIncome}
        totalDebt={totalDebt}
        totalMonthlyPayment={totalMonthlyPayment}
        remainingBudget={remainingBudget}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        user={user}
        onUpdateUser={async (username, avatarUrl) => {
          setUser({ ...user, username, avatarUrl });
          await fetch(`/api/users/${user.id}/avatar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatarUrl })
          });
        }}
        onClearData={() => {
          setIncomes([]);
          setDebts([]);
          setBills([]);
          setTargetMonths(12);
          setMinBudget(10000);
          setCalendarStartDate(DateTime.now().toISODate() || '');
          setDebtStartDate(DateTime.now().toISODate() || '');
        }}
      />

      {/* Mobile Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-panel)] border-t border-[var(--color-border-line)] z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        <div className="flex justify-around items-center p-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn("flex flex-col items-center gap-1 p-2 rounded-xl transition-colors flex-1", activeTab === 'dashboard' ? "text-[var(--color-swamp-green-light)]" : "text-[var(--color-text-muted)] hover:text-white")}
          >
            <FontAwesomeIcon icon={faChartPie} className="w-5 h-5" />
            <span className="text-[10px] font-medium">Дашборд</span>
          </button>
          <button 
            onClick={() => setActiveTab('calendar')}
            className={cn("flex flex-col items-center gap-1 p-2 rounded-xl transition-colors flex-1", activeTab === 'calendar' ? "text-[var(--color-swamp-green-light)]" : "text-[var(--color-text-muted)] hover:text-white")}
          >
            <FontAwesomeIcon icon={faCalendarDays} className="w-5 h-5" />
            <span className="text-[10px] font-medium">Календарь</span>
          </button>
        </div>
      </div>
    </div>
  );
};

