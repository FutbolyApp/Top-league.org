import React, { createContext, useContext, useState, useEffect } from 'react';
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
    top: 120px;
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

export const NotificationProvider = ({ children }) => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotification, setShowNotification] = useState(false);
    const [modal, setModal] = useState(null);
    const [pollingActive, setPollingActive] = useState(false);

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
        if (!user || !token) return;

        const loadNotifications = async () => {
            try {
                const response = await getNotificheShared(token, user.id);
                const notifiche = response?.data?.notifiche || response?.notifiche || [];
                
                const notificheNormalizzate = notifiche.map(n => ({
                    ...n,
                    letta: n.letta || n.letto === 1,
                    letto: n.letto || (n.letta ? 1 : 0)
                }));
                
                setNotifications(notificheNormalizzate);
                setUnreadCount(notificheNormalizzate.filter(n => !n.letta).length || 0);
            } catch (error) {
                console.error('Errore caricamento notifiche:', error);
            }
        };

        loadNotifications();

        const interval = setInterval(() => {
            if (pollingActive) return;
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

    // Mostra la prima notifica non letta
    useEffect(() => {
        const unviewedNotifications = getUnviewedNotifications();
        
        if (unviewedNotifications.length > 0 && !showNotification) {
            setShowNotification(true);
            
            const timer = setTimeout(() => {
                handleCloseNotification();
            }, 8000);
            
            return () => clearTimeout(timer);
        } else if (unviewedNotifications.length === 0) {
            setShowNotification(false);
        }
    }, [notifications, showNotification, viewedNotifications]);

    const markAsRead = async (notificationId) => {
        try {
            let response = await api.post(`/notifiche/${notificationId}/read`, {}, token);
            
            if (!response) {
                response = await api.put(`/notifiche/${notificationId}/letta`, {}, token);
            }
            
            if (response) {
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

    const handleNotificationClick = (notification) => {
        setShowNotification(false);
        markAsViewed(notification.id);
        
        setNotifications(prev => 
            prev.map(n => 
                n.id === notification.id ? { ...n, letta: true, letto: 1 } : n
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        markAsRead(notification.id);
        navigate('/notifiche');
    };

    const handleCloseNotification = () => {
        setShowNotification(false);
        
        const unviewedNotifications = getUnviewedNotifications();
        const currentNotification = unviewedNotifications[0];
        
        if (currentNotification) {
            markAsViewed(currentNotification.id);
            
            setNotifications(prev => 
                prev.map(n => 
                    n.id === currentNotification.id ? { ...n, letta: true, letto: 1 } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
            
            markAsRead(currentNotification.id);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Ora';
        if (minutes < 60) return `${minutes}m fa`;
        if (hours < 24) return `${hours}h fa`;
        if (days < 7) return `${days}g fa`;
        
        return date.toLocaleDateString('it-IT');
    };

    const getNotificationType = (tipo) => {
        switch (tipo) {
            case 'trasferimento': return 'trasferimento';
            case 'offerta': return 'offerta';
            case 'sistema': return 'sistema';
            case 'richiesta_ingresso': return 'richiesta_ingresso';
            case 'risposta_richiesta': return 'risposta_richiesta';
            case 'risposta_richiesta_admin': return 'risposta_richiesta_admin';
            case 'richiesta_unione_squadra': return 'richiesta_unione_squadra';
            case 'risposta_richiesta_unione': return 'risposta_richiesta_unione';
            default: return 'sistema';
        }
    };

    const value = {
        addNotification: (message, type = 'info', duration = 5000) => {
            const id = Date.now() + Math.random();
            const newNotification = { id, message, type };
            
            setNotifications(prev => [...prev, newNotification]);
            
            if (duration > 0) {
                setTimeout(() => {
                    setNotifications(prev => prev.filter(n => n.id !== id));
                }, duration);
            }
        },
        removeNotification: (notificationId) => {
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        },
        markAsRead,
        markAllAsRead: async () => {
            try {
                await api.put('/notifiche/tutte-lette', {}, token);
                setNotifications(prev =>
                    prev.map(n => ({ ...n, letta: true, letto: 1 }))
                );
                setUnreadCount(0);
            } catch (error) {
                console.error('Errore marcatura tutte notifiche come lette:', error);
            }
        },
        showModal: (config) => {
            setModal(config);
        },
        hideModal: () => {
            setModal(null);
        },
        showErrorModal: (title, message, onConfirm = null) => {
            setModal({
                type: 'error',
                title,
                message,
                onConfirm,
                showCancel: false
            });
        },
        showConfirmModal: (title, message, onConfirm, onCancel = null) => {
            setModal({
                type: 'confirm',
                title,
                message,
                onConfirm,
                onCancel
            });
        },
        showSuccessModal: (title, message, onConfirm = null) => {
            setModal({
                type: 'success',
                title,
                message,
                onConfirm,
                showCancel: false
            });
        },
        notifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            
            {showNotification && (() => {
                const unviewedNotifications = getUnviewedNotifications();
                const currentNotification = unviewedNotifications[0];
                
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
        </NotificationContext.Provider>
    );
}; 