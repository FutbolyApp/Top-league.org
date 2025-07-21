import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { api } from '../api/config';
import { getNotificheShared } from '../api/sharedApi';

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
    top: 120px; /* Increased from 80px to 120px to ensure it's below the top menu */
    right: 20px;
    z-index: 1000;
    max-width: 250px;
`;

const NotificationItem = styled.div`
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
    padding: 0.5rem;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    transition: all 0.3s ease;
    transform: translateX(${props => props.$show ? '0' : '100%'});
    opacity: ${props => props.$show ? '1' : '0'};
    position: relative;
    
    &:hover {
        transform: translateX(-3px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
`;

const NotificationCloseButton = styled.button`
    position: absolute;
    top: 2px;
    right: 2px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.8);
    font-size: 12px;
    cursor: pointer;
    padding: 1px;
    border-radius: 2px;
    transition: all 0.2s ease;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
        background: rgba(255, 255, 255, 0.2);
        color: white;
    }
`;

const NotificationCounter = styled.span`
    background: #007bff;
    color: white;
    border-radius: 50%;
    width: 14px;
    height: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    font-weight: bold;
    margin-left: 4px;
`;

const NotificationTitle = styled.div`
    font-weight: 600;
    margin-bottom: 0.2rem;
    font-size: 0.75rem;
    padding-right: 20px;
    color: white;
`;

const NotificationMessage = styled.div`
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.2;
    margin-bottom: 0.2rem;
`;

const NotificationTime = styled.div`
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.7);
`;

const NotificationBadge = styled.div`
    position: absolute;
    top: -5px;
    right: -5px;
    background: #dc3545;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 600;
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
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [modal, setModal] = useState(null);
    const [showNotification, setShowNotification] = useState(false);
    const [pollingActive, setPollingActive] = useState(true);

    // Stato per tracciare le notifiche già visualizzate in questa sessione
    const [viewedNotifications, setViewedNotifications] = useState(new Set());

    // Funzione per marcare una notifica come visualizzata in questa sessione
    const markAsViewed = (notificationId) => {
        setViewedNotifications(prev => new Set([...prev, notificationId]));
    };

    // Funzione per ottenere solo notifiche non visualizzate in questa sessione
    const getUnviewedNotifications = () => {
        return notifications.filter(n => 
            !n.letta && 
            n.letto !== 1 && 
            !viewedNotifications.has(n.id)
        );
    };

    useEffect(() => {
        if (!user || !token) {
            setNotifications([]);
            setUnreadCount(0);
            setPollingActive(false);
            return;
        }

        // Carica notifiche iniziali
        loadNotifications();

        // Polling per nuove notifiche ogni 300 secondi (5 minuti invece di 2)
        const interval = setInterval(() => {
            if (pollingActive) {
                console.log('⏸️ Skipping notification poll - already active');
                return;
            }
            
            console.log('🔄 Polling notifiche - timestamp:', new Date().toISOString());
            setPollingActive(true);
            loadNotifications().finally(() => {
                setPollingActive(false);
            });
        }, 300000);

        return () => {
            clearInterval(interval);
            setPollingActive(false);
        };
    }, [user, token, pollingActive]);

    const loadNotifications = async () => {
        if (!user || !token) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }
        
        try {
            const response = await getNotificheShared(token, user.id);
            const notifiche = response?.data?.notifiche || response?.notifiche || [];
            
            // Normalizza le notifiche per gestire entrambi i campi (letta e letto)
            const notificheNormalizzate = notifiche.map(n => ({
                ...n,
                letta: n.letta || n.letto === 1,
                letto: n.letto || (n.letta ? 1 : 0)
            }));
            
            setNotifications(notificheNormalizzate);
            setUnreadCount(notificheNormalizzate.filter(n => !n.letta).length || 0);
        } catch (error) {
            console.error('Errore caricamento notifiche:', error);
            setNotifications([]);
            setUnreadCount(0);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            // Prova prima l'endpoint /read
            let response = await api.post(`/notifiche/${notificationId}/read`, {}, token);
            
            // Se fallisce, prova l'endpoint /letta
            if (!response) {
                response = await api.put(`/notifiche/${notificationId}/letta`, {}, token);
            }
            
            if (response) {
                // Aggiorna lo stato locale
                setNotifications(prev => 
                    prev.map(n => 
                        n.id === notificationId ? { ...n, letta: true, letto: 1 } : n
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Errore marcatura notifica come letta:', error);
        }
    };

    const removeNotification = (notificationId) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
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

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Ora';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m fa`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h fa`;
        return date.toLocaleDateString('it-IT');
    };

    const getNotificationType = (tipo) => {
        switch (tipo) {
            case 'richiesta_ingresso': return 'info';
            case 'risposta_richiesta': return 'success';
            case 'risposta_richiesta_admin': return 'success';
            case 'trasferimento': return 'warning';
            case 'pagamento': return 'warning';
            default: return 'info';
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifiche/tutte-lette', {}, token);
            
            // Aggiorna lo stato locale
            setNotifications(prev => 
                prev.map(n => ({ ...n, letta: true, letto: 1 }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Errore marcatura tutte notifiche come lette:', error);
        }
    };

    const handleNotificationClick = (notification) => {
        console.log('🔍 NotificationSystem: handleNotificationClick called with:', notification);
        
        // Nascondi immediatamente la notifica
        setShowNotification(false);
        
        // Marca come visualizzata in questa sessione
        markAsViewed(notification.id);
        console.log('🔍 NotificationSystem: Marked as viewed:', notification.id);
        
        // Marca come letta immediatamente nello stato locale
        setNotifications(prev => 
            prev.map(n => 
                n.id === notification.id ? { ...n, letta: true, letto: 1 } : n
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Chiama l'API per marcare come letta
        markAsRead(notification.id);
        
        // Naviga sempre alla pagina delle notifiche
        navigate('/notifiche');
    };

    const handleCloseNotification = () => {
        console.log('🔍 NotificationSystem: handleCloseNotification called');
        
        // Nascondi immediatamente la notifica
        setShowNotification(false);
        
        // Trova la notifica corrente e marcala come visualizzata
        const unviewedNotifications = getUnviewedNotifications();
        const currentNotification = unviewedNotifications[0];
        
        if (currentNotification) {
            console.log('🔍 NotificationSystem: Closing notification:', currentNotification);
            
            // Marca come visualizzata in questa sessione
            markAsViewed(currentNotification.id);
            
            // Marca come letta immediatamente nello stato locale
            setNotifications(prev => 
                prev.map(n => 
                    n.id === currentNotification.id ? { ...n, letta: true, letto: 1 } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
            
            // Chiama l'API per marcare come letta
            markAsRead(currentNotification.id);
        }
    };

    // Mostra la prima notifica non letta
    useEffect(() => {
        const unviewedNotifications = getUnviewedNotifications();
        console.log('🔍 NotificationSystem: unviewedNotifications:', unviewedNotifications);
        console.log('🔍 NotificationSystem: showNotification:', showNotification);
        console.log('🔍 NotificationSystem: viewedNotifications:', Array.from(viewedNotifications));
        
        if (unviewedNotifications.length > 0 && !showNotification) {
            console.log('🔍 NotificationSystem: Showing notification:', unviewedNotifications[0]);
            setShowNotification(true);
            
            // Nascondi automaticamente dopo 8 secondi
            const timer = setTimeout(() => {
                handleCloseNotification();
            }, 8000);
            
            return () => clearTimeout(timer);
        } else if (unviewedNotifications.length === 0) {
            // Se non ci sono più notifiche non visualizzate, nascondi la notifica
            console.log('🔍 NotificationSystem: No unviewed notifications, hiding');
            setShowNotification(false);
        }
    }, [notifications, showNotification, viewedNotifications]);

    const value = {
        addNotification: (message, type = 'info', duration = 5000) => {
            const id = Date.now() + Math.random();
            const newNotification = { id, message, type };
            
            setNotifications(prev => [...prev, newNotification]);
            
            if (duration > 0) {
                setTimeout(() => {
                    removeNotification(id);
                }, duration);
            }
        },
        removeNotification,
        markAsRead,
        markAllAsRead,
        showModal,
        hideModal,
        showErrorModal,
        showConfirmModal,
        showSuccessModal,
        notifications
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'trasferimento': return '#28a745';
            case 'offerta': return '#17a2b8';
            case 'sistema': return '#6f42c1';
            case 'richiesta_ingresso': return '#28a745';
            case 'risposta_richiesta': return '#6f42c1';
            case 'risposta_richiesta_admin': return '#6f42c1';
            case 'richiesta_unione_squadra': return '#fd7e14';
            case 'risposta_richiesta_unione': return '#20c997';
            default: return '#007bff';
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'trasferimento': return '🔄';
            case 'offerta': return '💰';
            case 'sistema': return '⚙️';
            case 'richiesta_ingresso': return '🔐';
            case 'risposta_richiesta': return '✅';
            case 'richiesta_unione_squadra': return '👥';
            case 'risposta_richiesta_unione': return '🎯';
            case 'risposta_richiesta_admin': return '📄';
            default: return '📢';
        }
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            
            {showNotification && (() => {
                const unviewedNotifications = getUnviewedNotifications();
                const currentNotification = unviewedNotifications[0];
                
                // Se non ci sono notifiche non visualizzate, non mostrare nulla
                if (!currentNotification) {
                    setShowNotification(false);
                    return null;
                }
                
                return (
                    <NotificationContainer>
                        <NotificationItem
                            $type={getNotificationType(currentNotification.tipo)}
                            $show={showNotification}
                            onClick={() => handleNotificationClick(currentNotification)}
                        >
                            <NotificationCloseButton 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCloseNotification();
                                }}
                            >
                                ×
                            </NotificationCloseButton>
                            
                            <NotificationTitle>
                                {currentNotification.titolo || 'Notifica'}
                                {unviewedNotifications.length > 1 && (
                                    <NotificationCounter>
                                        {unviewedNotifications.length}
                                    </NotificationCounter>
                                )}
                            </NotificationTitle>
                            
                            <NotificationMessage>
                                {currentNotification.messaggio}
                            </NotificationMessage>
                            
                            <NotificationTime>
                                {formatTime(currentNotification.data_creazione)}
                            </NotificationTime>
                        </NotificationItem>
                    </NotificationContainer>
                );
            })()}

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