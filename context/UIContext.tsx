import React, { createContext, useContext, useState, ReactNode, PropsWithChildren } from 'react';
import { Toast, ConfirmDialog } from '../components/UI';

interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface UIContextType {
  showToast: (message: string, type?: ToastData['type']) => void;
  confirm: (message: string, onConfirm: () => void) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean, message: string, onConfirm: () => void } | null>(null);

  const showToast = (message: string, type: ToastData['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        setToasts((prev) => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter(t => t.id !== id));
  };

  const confirm = (message: string, onConfirm: () => void) => {
      setConfirmState({
          isOpen: true,
          message,
          onConfirm: () => {
              onConfirm();
              setConfirmState(null);
          }
      });
  };

  return (
    <UIContext.Provider value={{ showToast, confirm }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[80] flex flex-col items-center pointer-events-none">
         <div className="pointer-events-auto">
            {toasts.map(toast => (
                <Toast 
                    key={toast.id} 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => removeToast(toast.id)} 
                />
            ))}
         </div>
      </div>

      {/* Confirm Modal */}
      {confirmState && (
          <ConfirmDialog 
            isOpen={confirmState.isOpen} 
            message={confirmState.message} 
            onConfirm={confirmState.onConfirm}
            onCancel={() => setConfirmState(null)}
          />
      )}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};