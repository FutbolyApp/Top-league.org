import React, { createContext, useContext } from 'react';

console.log('🔍 NotificationSystem: File loaded');

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    console.log('🔍 NotificationProvider: Component mounted - SIMPLIFIED VERSION');
    
    // Versione semplificata senza hooks per testare
    return (
        <NotificationContext.Provider value={{
            addNotification: () => console.log('addNotification called'),
            removeNotification: () => console.log('removeNotification called'),
            markAsRead: () => console.log('markAsRead called'),
            markAllAsRead: () => console.log('markAllAsRead called'),
            showModal: () => console.log('showModal called'),
            hideModal: () => console.log('hideModal called'),
            showErrorModal: () => console.log('showErrorModal called'),
            showConfirmModal: () => console.log('showConfirmModal called'),
            showSuccessModal: () => console.log('showSuccessModal called'),
            notifications: []
        }}>
            {children}
            <div style={{ 
                position: 'fixed', 
                top: '10px', 
                right: '10px', 
                background: 'red', 
                color: 'white', 
                padding: '10px',
                zIndex: 9999
            }}>
                🔍 NotificationProvider is working!
            </div>
        </NotificationContext.Provider>
    );
}; 