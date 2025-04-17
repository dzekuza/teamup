import React, { createContext, useContext, ReactNode } from 'react';
import toast, { ToastOptions } from 'react-hot-toast';

interface ToastifyContextType {
  notify: (message: string, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  promise: typeof toast.promise;
}

const ToastifyContext = createContext<ToastifyContextType | undefined>(undefined);

export const ToastifyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Basic notifications
  const notify = (message: string, options?: ToastOptions) => {
    toast(message, options);
  };

  // Success notifications
  const success = (message: string, options?: ToastOptions) => {
    toast.success(message, options);
  };

  // Error notifications
  const error = (message: string, options?: ToastOptions) => {
    toast.error(message, options);
  };

  // Warning notifications (custom style)
  const warning = (message: string, options?: ToastOptions) => {
    toast(message, {
      icon: '⚠️',
      style: {
        backgroundColor: '#FFF3CD',
        color: '#856404',
        border: '1px solid #FFEEBA',
      },
      ...options,
    });
  };

  // Info notifications (custom style)
  const info = (message: string, options?: ToastOptions) => {
    toast(message, {
      icon: 'ℹ️',
      style: {
        backgroundColor: '#D1ECF1',
        color: '#0C5460',
        border: '1px solid #BEE5EB',
      },
      ...options,
    });
  };

  const value = {
    notify,
    success,
    error,
    warning,
    info,
    promise: toast.promise,
  };

  return (
    <ToastifyContext.Provider value={value}>
      {children}
    </ToastifyContext.Provider>
  );
};

export const useToastify = (): ToastifyContextType => {
  const context = useContext(ToastifyContext);
  if (context === undefined) {
    throw new Error('useToastify must be used within a ToastifyProvider');
  }
  return context;
}; 