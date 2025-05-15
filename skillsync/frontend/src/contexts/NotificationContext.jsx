import React, { createContext, useContext, useState } from 'react';
import { toast } from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const addNotification = (message, type = 'info') => {
        switch (type) {
            case 'success':
                toast.success(message);
                break;
            case 'error':
                toast.error(message);
                break;
            case 'info':
                toast(message);
                break;
            default:
                toast(message);
        }
    };

    return (
        <NotificationContext.Provider value={{ addNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext; 