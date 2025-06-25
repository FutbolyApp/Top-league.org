import React, { createContext, useContext, useState } from 'react';
import styled from 'styled-components';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

const NotificationContainer = styled.div`
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    max-width: 400px;
`;

const NotificationItem = styled.div`
    background: ${props => {
        switch (props.type) {
            case 'success': return '#4caf50';
            case 'error': return '#f44336';
            case 'warning': return '#ff9800';
            default: return '#2196f3';
        }
    }};
    color: white;
    padding: 15px 20px;
    margin-bottom: 10px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    justify-content: space-between;
    align-items: center;
    animation: slideIn 0.3s ease-out;
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    margin-left: 10px;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
        opacity: 0.8;
    }
`;

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    animation: fadeIn 0.2s ease-out;
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

const ModalContent = styled.div`
    background: white;
    border-radius: 12px;
    padding: 30px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    animation: modalSlideIn 0.3s ease-out;
    
    @keyframes modalSlideIn {
        from {
            transform: translateY(-50px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #eee;
`;

const ModalTitle = styled.h2`
    margin: 0;
    color: ${props => {
        switch (props.type) {
            case 'success': return '#4caf50';
            case 'error': return '#f44336';
            case 'warning': return '#ff9800';
            default: return '#2196f3';
        }
    }};
    font-size: 1.5rem;
`;

const ModalCloseButton = styled.button`
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    
    &:hover {
        background: #f5f5f5;
    }
`;

const ModalBody = styled.div`
    margin-bottom: 25px;
    line-height: 1.6;
    color: #333;
`;

const ModalFooter = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 10px;
`;

const Button = styled.button`
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    
    &.primary {
        background: #2196f3;
        color: white;
        
        &:hover {
            background: #1976d2;
        }
    }
    
    &.secondary {
        background: #f5f5f5;
        color: #333;
        border: 1px solid #ddd;
        
        &:hover {
            background: #e0e0e0;
        }
    }
    
    &.danger {
        background: #f44336;
        color: white;
        
        &:hover {
            background: #d32f2f;
        }
    }
`;

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [modal, setModal] = useState(null);

    const addNotification = (message, type = 'info', duration = 5000) => {
        const id = Date.now() + Math.random();
        const newNotification = { id, message, type };
        
        setNotifications(prev => [...prev, newNotification]);
        
        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    const showModal = (config) => {
        setModal(config);
    };

    const hideModal = () => {
        setModal(null);
    };

    const showErrorModal = (title, message, onConfirm = null) => {
        showModal({
            type: 'error',
            title,
            message,
            onConfirm,
            showCancel: false
        });
    };

    const showConfirmModal = (title, message, onConfirm, onCancel = null) => {
        showModal({
            type: 'confirm',
            title,
            message,
            onConfirm,
            onCancel
        });
    };

    const showSuccessModal = (title, message, onConfirm = null) => {
        showModal({
            type: 'success',
            title,
            message,
            onConfirm,
            showCancel: false
        });
    };

    const value = {
        addNotification,
        removeNotification,
        showModal,
        hideModal,
        showErrorModal,
        showConfirmModal,
        showSuccessModal
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            
            <NotificationContainer>
                {notifications.map(notification => (
                    <NotificationItem key={notification.id} type={notification.type}>
                        <span>{notification.message}</span>
                        <CloseButton onClick={() => removeNotification(notification.id)}>
                            ×
                        </CloseButton>
                    </NotificationItem>
                ))}
            </NotificationContainer>

            {modal && (
                <ModalOverlay onClick={hideModal}>
                    <ModalContent onClick={e => e.stopPropagation()}>
                        <ModalHeader>
                            <ModalTitle type={modal.type}>{modal.title}</ModalTitle>
                            <ModalCloseButton onClick={hideModal}>×</ModalCloseButton>
                        </ModalHeader>
                        
                        <ModalBody>
                            {modal.message}
                        </ModalBody>
                        
                        <ModalFooter>
                            {modal.showCancel !== false && (
                                <Button 
                                    className="secondary" 
                                    onClick={() => {
                                        if (modal.onCancel) modal.onCancel();
                                        hideModal();
                                    }}
                                >
                                    Annulla
                                </Button>
                            )}
                            <Button 
                                className={modal.type === 'error' ? 'danger' : 'primary'}
                                onClick={() => {
                                    if (modal.onConfirm) modal.onConfirm();
                                    hideModal();
                                }}
                            >
                                {modal.type === 'error' ? 'Chiudi' : 'Conferma'}
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </ModalOverlay>
            )}
        </NotificationContext.Provider>
    );
}; 