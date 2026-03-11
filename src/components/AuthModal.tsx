import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightToBracket, faUserPlus, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { DevilIcon } from './DevilIcon';

interface AuthModalProps {
  onLogin: (user: { id: number; username: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Заполните все поля');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка авторизации');
      }

      onLogin(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[var(--color-panel)] border border-[var(--color-border-line)] rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-swamp-green)] opacity-10 rounded-full blur-3xl" />
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 mb-4">
            <DevilIcon className="w-full h-full" />
          </div>
          <h2 className="text-2xl font-bold font-mono tracking-wider text-[var(--color-ash-red-light)]">Должная Душа</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {isLogin ? 'Вход в систему' : 'Регистрация'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
          {error && (
            <div className="bg-[rgba(140,74,74,0.1)] border border-[var(--color-ash-red-dark)] text-[var(--color-ash-red-light)] p-3 rounded-xl text-sm flex items-center gap-2">
              <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm text-[var(--color-text-muted)] ml-1">Имя пользователя</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded-xl bg-[rgba(0,0,0,0.2)] border border-[var(--color-border-line)] hover:border-[var(--color-swamp-green-light)] focus:border-[var(--color-swamp-green-light)] outline-none transition-colors"
              placeholder="Введите логин"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-[var(--color-text-muted)] ml-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-[rgba(0,0,0,0.2)] border border-[var(--color-border-line)] hover:border-[var(--color-swamp-green-light)] focus:border-[var(--color-swamp-green-light)] outline-none transition-colors"
              placeholder="Введите пароль"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full p-4 rounded-xl font-medium mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Загрузка...</span>
            ) : isLogin ? (
              <><FontAwesomeIcon icon={faRightToBracket} className="w-5 h-5" /> Войти</>
            ) : (
              <><FontAwesomeIcon icon={faUserPlus} className="w-5 h-5" /> Зарегистрироваться</>
            )}
          </button>
        </form>

        <div className="mt-6 text-center relative z-10">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm text-[var(--color-text-muted)] hover:text-white transition-colors"
          >
            {isLogin ? 'Нет аккаунта? Создать' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
