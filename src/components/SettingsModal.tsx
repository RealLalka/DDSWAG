import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faUser, faDatabase, faTriangleExclamation, faTrash } from '@fortawesome/free-solid-svg-icons';
import { CustomInput } from './CustomInputs';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { username: string; avatarUrl?: string };
  onUpdateUser: (username: string, avatarUrl: string) => void;
  onClearData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, onUpdateUser, onClearData }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'data'>('profile');
  const [username, setUsername] = useState(user.username);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [avatarError, setAvatarError] = useState('');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = () => {
    if (username.trim()) {
      onUpdateUser(username.trim(), avatarUrl.trim());
      onClose();
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

          <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-2xl border border-[var(--color-border-line)] shrink-0">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-[var(--color-panel)] text-white shadow-md' : 'text-[var(--color-text-muted)] hover:text-white'}`}
            >
              <FontAwesomeIcon icon={faUser} className="w-4 h-4" /> Профиль
            </button>
            <button 
              onClick={() => setActiveTab('data')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'data' ? 'bg-[var(--color-panel)] text-white shadow-md' : 'text-[var(--color-text-muted)] hover:text-white'}`}
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
                  <div className="flex gap-4 items-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border border-[var(--color-border-line)]" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[rgba(0,0,0,0.2)] border border-[var(--color-border-line)] flex items-center justify-center text-[var(--color-text-muted)]">
                        <FontAwesomeIcon icon={faUser} className="w-6 h-6" />
                      </div>
                    )}
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
                </div>
                
                <div className="pt-4">
                  <button onClick={handleSaveProfile} className="btn-base btn-primary w-full">
                    Сохранить изменения
                  </button>
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
