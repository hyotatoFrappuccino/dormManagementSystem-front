import React, {createContext, useContext, useState, useEffect} from 'react';

export interface NotificationMessage {
  type: "success" | "error" | "info";
  message: string;
}

interface NotificationContextType {
  notification: NotificationMessage | null;
  showNotification: (message: NotificationMessage) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({children}: { children: React.ReactNode }) {
  const [notification, setNotification] = useState<NotificationMessage | null>(null);

  useEffect(() => {
    if (!notification || notification.type === "info") return;

    const timeout = setTimeout(
      () => setNotification(null),
      notification.type === "error" ? 60000 : 3000
    );

    return () => clearTimeout(timeout);
  }, [notification]);

  const showNotification = (message: NotificationMessage) => {
    setNotification(message);
  };

  const hideNotification = () => {
    setNotification(null);
  };

  return (
    <NotificationContext.Provider value={{
      notification,
      showNotification,
      hideNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};