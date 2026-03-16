import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faUser, faDatabase, faTriangleExclamation, faTrash, faLock, faLink } from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { CustomInput } from './CustomInputs';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: number; username: string; avatarUrl?: string; avatarFrame?: string; googleId?: string; hasPassword?: boolean };
  onUpdateUser: (updates: any) => void;
  onClearData: () => void;
}

export const AVATAR_FRAMES = [
  { id: 'none', name: 'Без рамки', class: '' },
  { id: 'red', name: 'Красная', class: 'ring-4 ring-red-500' },
  { id: 'blue', name: 'Синяя', class: 'ring-4 ring-blue-500' },
  { id: 'green', name: 'Зеленая', class: 'ring-4 ring-green-500' },
  { id: 'gold', name: 'Золотая', class: 'ring-4 ring-yellow-400' },
  { id: 'rainbow', name: 'Радужная (Анимация)', class: 'ring-4 ring-transparent bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 animate-gradient-xy p-1' }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, onUpdateUser, onClearData }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'data'>('profile');
  const [username, setUsername] = useState(user.username);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [avatarFrame, setAvatarFrame] = useState(user.avatarFrame || 'none');
  const [avatarError, setAvatarError] = useState('');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUsername(user.username);
      setAvatarUrl(user.avatarUrl || '');
      setAvatarFrame(user.avatarFrame || 'none');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setPasswordSuccess('');
      setActiveTab('profile');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSaveProfile = async () => {
    if (username.trim()) {
      onUpdateUser({ username: username.trim(), avatarUrl: avatarUrl.trim(), avatarFrame });
      
      // Update frame on backend
      try {
        await fetch(`/api/users/${user.id}/avatar-frame`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ frame: avatarFrame })
        });
      } catch (e) {
        console.error('Failed to update frame', e);
      }
      
      onClose();
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    
    if ((user.hasPassword !== false && !oldPassword) || !newPassword || !confirmPassword) {
      setPasswordError('Заполните все поля');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Новые пароли не совпадают');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Пароль должен быть не менее 6 символов');
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: oldPassword || '', newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка при изменении пароля');
      
      setPasswordSuccess('Пароль успешно изменен');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onUpdateUser({ hasPassword: true });
    } catch (err: any) {
      setPasswordError(err.message);
    }
  };

  const handleLinkGoogle = async () => {
    try {
      const res = await fetch(`/api/auth/google/url?userId=${user.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      
      const authWindow = window.open(data.url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) setPasswordError('Разрешите всплывающие окна');
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.user) {
          onUpdateUser(event.data.user);
          setPasswordSuccess('Google аккаунт успешно привязан');
          window.removeEventListener('message', handleMessage);
        }
      };
      window.addEventListener('message', handleMessage);
    } catch (err: any) {
      setPasswordError(err.message);
    }
  };

  const handleClearData = () => {
    onClearData();
    setIsConfirmingClear(false);
    onClose();
  };

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
          className="relative w-full max-w-lg bg-[var(--color-panel)] border border-[var(--color-border-line)] rounded-3xl p-6 md:p-8 shadow-2xl z-10 max-h-[90vh] flex flex-col"
        >
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="text-2xl font-medium font-mono">Настройки</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
              <FontAwesomeIcon icon={faXmark} className="w-5 h-5 text-[var(--color-text-muted)]" />
            </button>
          </div>

          <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-2xl border border-[var(--color-border-line)] shrink-0 overflow-x-auto custom-scrollbar">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-[var(--color-panel)] text-white shadow-md' : 'text-[var(--color-text-muted)] hover:text-white'}`}
            >
              <FontAwesomeIcon icon={faUser} className="w-4 h-4" /> Профиль
            </button>
            <button 
              onClick={() => setActiveTab('account')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'account' ? 'bg-[var(--color-panel)] text-white shadow-md' : 'text-[var(--color-text-muted)] hover:text-white'}`}
            >
              <FontAwesomeIcon icon={faLock} className="w-4 h-4" /> Аккаунт
            </button>
            <button 
              onClick={() => setActiveTab('data')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'data' ? 'bg-[var(--color-panel)] text-white shadow-md' : 'text-[var(--color-text-muted)] hover:text-white'}`}
            >
              <FontAwesomeIcon icon={faDatabase} className="w-4 h-4" /> Данные
            </button>
          </div>

          <div className="overflow-y-auto custom-scrollbar pr-2 flex-1">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-[var(--color-text-muted)] mb-2">Имя пользователя</label>
                  <CustomInput 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder="Ваше имя"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-[var(--color-text-muted)] mb-2">Аватар</label>
                  <div className="flex gap-4 items-center mb-4">
                    <div className={`relative rounded-full flex items-center justify-center ${AVATAR_FRAMES.find(f => f.id === avatarFrame)?.class || ''}`}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border border-[var(--color-border-line)]" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-[var(--color-panel)] border border-[var(--color-border-line)] flex items-center justify-center text-[var(--color-text-muted)]">
                          <FontAwesomeIcon icon={faUser} className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <CustomInput 
                        type="text" 
                        value={avatarUrl} 
                        onChange={(e) => setAvatarUrl(e.target.value)} 
                        placeholder="URL изображения (https://...)"
                      />
                      <label className="cursor-pointer text-xs text-[var(--color-swamp-green-light)] hover:text-white transition-colors">
                        Или загрузите файл
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            setAvatarError('');
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                setAvatarError('Файл слишком большой. Максимальный размер 2MB.');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setAvatarUrl(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {avatarError && <p className="text-xs text-[var(--color-ash-red-light)] mt-1">{avatarError}</p>}
                    </div>
                  </div>
                  
                  <label className="block text-sm text-[var(--color-text-muted)] mb-2 mt-4">Рамка аватара</label>
                  <div className="grid grid-cols-2 gap-2">
                    {AVATAR_FRAMES.map(frame => (
                      <button
                        key={frame.id}
                        onClick={() => setAvatarFrame(frame.id)}
                        className={`p-2 text-sm rounded-xl border transition-all ${avatarFrame === frame.id ? 'bg-[var(--color-swamp-green-dark)] border-[var(--color-swamp-green-light)] text-white' : 'bg-white/5 border-[var(--color-border-line)] text-[var(--color-text-muted)] hover:bg-white/10'}`}
                      >
                        {frame.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4">
                  <button onClick={handleSaveProfile} className="btn-base btn-primary w-full">
                    Сохранить изменения
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-[var(--color-border-line)] rounded-2xl p-5">
                  <h3 className="text-white font-medium flex items-center gap-2 mb-4">
                    <FontAwesomeIcon icon={faGoogle} /> Привязка Google
                  </h3>
                  {user.googleId ? (
                    <div className="flex items-center gap-3 text-sm text-[var(--color-swamp-green-light)] bg-[var(--color-swamp-green-dark)] p-3 rounded-xl border border-[var(--color-swamp-green-light)]/30">
                      <FontAwesomeIcon icon={faLink} />
                      Аккаунт успешно привязан к Google
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-[var(--color-text-muted)] mb-4">
                        Привяжите свой аккаунт Google, чтобы входить в систему без пароля.
                      </p>
                      <button onClick={handleLinkGoogle} className="btn-base btn-secondary w-full flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faGoogle} /> Привязать Google аккаунт
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white/5 border border-[var(--color-border-line)] rounded-2xl p-5">
                  <h3 className="text-white font-medium flex items-center gap-2 mb-4">
                    <FontAwesomeIcon icon={faLock} /> Изменение пароля
                  </h3>
                  
                  {passwordError && <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">{passwordError}</div>}
                  {passwordSuccess && <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{passwordSuccess}</div>}
                  
                  <div className="space-y-4">
                    {user.hasPassword !== false && (
                      <div>
                        <label className="block text-sm text-[var(--color-text-muted)] mb-2">Старый пароль</label>
                        <CustomInput 
                          type="password" 
                          value={oldPassword} 
                          onChange={(e) => setOldPassword(e.target.value)} 
                          placeholder="••••••••"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm text-[var(--color-text-muted)] mb-2">Новый пароль</label>
                      <CustomInput 
                        type="password" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--color-text-muted)] mb-2">Подтвердите новый пароль</label>
                      <CustomInput 
                        type="password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        placeholder="••••••••"
                      />
                    </div>
                    <button onClick={handleChangePassword} className="btn-base btn-primary w-full mt-2">
                      Изменить пароль
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <div className="bg-rose-500/10 border border-[var(--color-ash-red-dark)] rounded-2xl p-5">
                  <h3 className="text-[var(--color-ash-red-light)] font-medium flex items-center gap-2 mb-2">
                    <FontAwesomeIcon icon={faTriangleExclamation} /> Опасная зона
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)] mb-4">
                    Удаление всех данных приведет к безвозвратной потере информации о доходах, расходах и долгах. Рекомендуется сделать экспорт перед удалением.
                  </p>
                  
                  {!isConfirmingClear ? (
                    <button 
                      onClick={() => setIsConfirmingClear(true)} 
                      className="btn-base btn-danger w-full"
                    >
                      <FontAwesomeIcon icon={faTrash} /> Очистить все данные
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <p className="text-sm text-white font-medium text-center">Вы уверены?</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setIsConfirmingClear(false)} 
                          className="btn-base btn-secondary flex-1"
                        >
                          Отмена
                        </button>
                        <button 
                          onClick={handleClearData} 
                          className="btn-base btn-danger flex-1"
                        >
                          Да, удалить
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
