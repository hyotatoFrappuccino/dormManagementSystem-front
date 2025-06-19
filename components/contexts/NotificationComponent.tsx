// components/Notification.tsx
import {X} from 'lucide-react';
import {useNotification} from '@/components/contexts/NotificationContext';

export function Notification() {
  const {notification, hideNotification} = useNotification();

  if (!notification) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-md transition-opacity duration-300 overflow-hidden ${
        notification.type === "success"
          ? "bg-green-100 text-green-800 border border-green-200"
          : notification.type === "info"
            ? "bg-blue-100 text-blue-800 border border-blue-200"
            : "bg-red-100 text-red-800 border border-red-200"
      }`}
    >
      <div className="flex items-center justify-between">
        {notification.type === "info" ? (
          <div className="flex items-center">
            <span>{notification.message}</span>
          </div>
        ) : (
          <span>{notification.message}</span>
        )}
        <button
          onClick={hideNotification}
          className="ml-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4"/>
        </button>
      </div>
      {notification.type !== "info" && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 mt-2">
          <div
            className={`h-full ${
              notification.type === "success"
                ? "bg-green-500 animate-shrink-left-success"
                : "bg-red-500 animate-shrink-left-error"
            }`}
          ></div>
        </div>
      )}
    </div>
  );
}