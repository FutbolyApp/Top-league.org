import React, { createContext, useContext, useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { api } from '../api/config';
import { getNotificheShared } from '../api/sharedApi';

// FIXED: Enhanced notification context with better error handling
const NotificationContext = createContext(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    console.warn('useNotification must be used within NotificationProvider');
    return {
      addNotification: () => {},
      notifications: [],
      unreadCount: 0
    };
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

// FIXED: Enhanced notification provider with comprehensive error handling
export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [viewedNotifications, setViewedNotifications] = useState(new Set());
  const [pollingActive, setPollingActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // FIXED: Safe notification ID generation
  const generateNotificationId = () => {
    return Date.now() + Math.random().toString(36).substr(2, 9);
  };

  // FIXED: Enhanced mark as viewed with validation
  const markAsViewed = (notificationId) => {
    if (!notificationId) {
      console.warn('🔍 NotificationSystem: Invalid notification ID for markAsViewed');
      return;
    }
    
    try {
      setViewedNotifications(prev => new Set([...prev, notificationId]));
      console.log('🔍 NotificationSystem: Marked notification as viewed:', notificationId);
    } catch (error) {
      console.error('🚨 NotificationSystem: Error marking notification as viewed:', error);
    }
  };

  // FIXED: Enhanced get unviewed notifications with validation
  const getUnviewedNotifications = () => {
    try {
      if (!Array.isArray(notifications)) {
        console.warn('🔍 NotificationSystem: Notifications is not an array:', notifications);
        return [];
      }
      
      const unviewed = notifications.filter(n => {
        if (!n || !n.id) {
          console.warn('🔍 NotificationSystem: Invalid notification object:', n);
          return false;
        }
        return !n.letta && !viewedNotifications.has(n.id);
      });
      
      console.log('🔍 NotificationSystem: Unviewed notifications count:', unviewed.length);
      return unviewed;
    } catch (error) {
      console.error('🚨 NotificationSystem: Error getting unviewed notifications:', error);
      return [];
    }
  };

  // FIXED: Enhanced load notifications with comprehensive error handling
  const loadNotifications = async () => {
    if (!token || !user?.id) {
      console.log('🔍 NotificationSystem: No token or user ID, skipping notification load');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 NotificationSystem: Loading notifications for user:', user.id);
      const response = await api.get('/notifiche', token, { notifiche: 'array' });
      
      console.log('🔍 NotificationSystem: Notification response:', {
        hasResponse: !!response,
        hasData: !!response?.data,
        hasNotifications: !!response?.data?.notifiche,
        notificationCount: response?.data?.notifiche?.length || 0
      });

      // FIXED: Handle different response formats safely
      let notifiche = [];
      if (response?.ok && response?.data?.notifiche) {
        notifiche = response.data.notifiche;
      } else if (response?.notifiche) {
        notifiche = response.notifiche;
      } else if (Array.isArray(response?.data)) {
        notifiche = response.data;
      } else {
        console.warn('🔍 NotificationSystem: Unexpected notification response format:', response);
        notifiche = [];
      }

      // FIXED: Validate and normalize notification data
      const notificheNormalizzate = notifiche
        .filter(n => n && typeof n === 'object') // Filter out invalid notifications
        .map(n => {
          try {
            return {
              id: n.id || generateNotificationId(),
              titolo: n.titolo || 'Notifica',
              messaggio: n.messaggio || 'Nuova notifica',
              tipo: n.tipo || 'sistema',
              letta: Boolean(n.letta || n.letto === 1),
              letto: n.letto || (n.letta ? 1 : 0),
              data_creazione: n.data_creazione || new Date().toISOString(),
              dati_aggiuntivi: n.dati_aggiuntivi || {},
              ...n // Preserve other properties
            };
          } catch (error) {
            console.error('🚨 NotificationSystem: Error normalizing notification:', error, n);
            return null;
          }
        })
        .filter(Boolean); // Remove null entries
      
      setNotifications(notificheNormalizzate);
      const unreadCount = notificheNormalizzate.filter(n => !n.letta).length;
      setUnreadCount(unreadCount);
      
      console.log('🔍 NotificationSystem: Loaded notifications:', {
        total: notificheNormalizzate.length,
        unread: unreadCount
      });
      
    } catch (error) {
      console.error('🚨 NotificationSystem: Error loading notifications:', error);
      setError(error.message || 'Errore nel caricamento delle notifiche');
      // FIXED: Don't clear notifications on error, keep existing ones
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Enhanced mark as read with retry logic
  const markAsRead = async (notificationId) => {
    if (!notificationId || !token) {
      console.warn('🔍 NotificationSystem: Cannot mark as read - missing ID or token');
      return;
    }

    try {
      console.log('🔍 NotificationSystem: Marking notification as read:', notificationId);
      
      // FIXED: Try multiple endpoints for better compatibility
      let response = null;
      let success = false;
      
      // Try POST first
      try {
        response = await api.post(`/notifiche/${notificationId}/read`, {}, token);
        success = response?.ok;
      } catch (error) {
        console.warn('🔍 NotificationSystem: POST /read failed, trying PUT /letta');
      }
      
      // Try PUT if POST failed
      if (!success) {
        try {
          response = await api.put(`/notifiche/${notificationId}/letta`, {}, token);
          success = response?.ok;
        } catch (error) {
          console.warn('🔍 NotificationSystem: PUT /letta also failed');
        }
      }
      
      // FIXED: Update UI regardless of API response to prevent UI inconsistencies
      if (success) {
        console.log('🔍 NotificationSystem: Successfully marked notification as read');
      } else {
        console.warn('🔍 NotificationSystem: API failed but updating UI for consistency');
      }
      
      // FIXED: Always update UI to prevent stuck notifications
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, letta: true, letto: 1 } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('🚨 NotificationSystem: Error marking notification as read:', error);
      // FIXED: Still update UI even if API fails
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, letta: true, letto: 1 } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // FIXED: Enhanced notification click handler
  const handleNotificationClick = (notification) => {
    if (!notification || !notification.id) {
      console.warn('🔍 NotificationSystem: Invalid notification for click handler');
      return;
    }
    
    try {
      setShowNotification(false);
      markAsViewed(notification.id);
      
      // FIXED: Update UI immediately for better UX
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id ? { ...n, letta: true, letto: 1 } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // FIXED: Mark as read in background
      markAsRead(notification.id);
      
      // FIXED: Navigate safely
      try {
        navigate('/notifiche');
      } catch (navError) {
        console.error('🚨 NotificationSystem: Navigation error:', navError);
        window.location.href = '/notifiche';
      }
    } catch (error) {
      console.error('🚨 NotificationSystem: Error in notification click handler:', error);
    }
  };

  // FIXED: Enhanced close notification handler
  const handleCloseNotification = () => {
    try {
      setShowNotification(false);
      
      const unviewedNotifications = getUnviewedNotifications();
      const currentNotification = unviewedNotifications[0];
      
      if (currentNotification) {
        markAsViewed(currentNotification.id);
        
        // FIXED: Update UI immediately
        setNotifications(prev => 
          prev.map(n => 
            n.id === currentNotification.id ? { ...n, letta: true, letto: 1 } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // FIXED: Mark as read in background
        markAsRead(currentNotification.id);
      }
    } catch (error) {
      console.error('🚨 NotificationSystem: Error in close notification handler:', error);
    }
  };

  // FIXED: Enhanced time formatting with validation
  const formatTime = (dateString) => {
    try {
      if (!dateString) return 'Ora';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('🔍 NotificationSystem: Invalid date string:', dateString);
        return 'Ora';
      }
      
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
    } catch (error) {
      console.error('🚨 NotificationSystem: Error formatting time:', error);
      return 'Ora';
    }
  };

  // FIXED: Enhanced notification type mapping
  const getNotificationType = (tipo) => {
    try {
      const typeMap = {
        'trasferimento': 'trasferimento',
        'offerta': 'offerta',
        'sistema': 'sistema',
        'richiesta_ingresso': 'richiesta_ingresso',
        'risposta_richiesta': 'risposta_richiesta',
        'risposta_richiesta_admin': 'risposta_richiesta_admin',
        'richiesta_unione_squadra': 'richiesta_unione_squadra',
        'risposta_richiesta_unione': 'risposta_richiesta_unione'
      };
      
      return typeMap[tipo] || 'sistema';
    } catch (error) {
      console.error('🚨 NotificationSystem: Error getting notification type:', error);
      return 'sistema';
    }
  };

  // FIXED: Enhanced context value with safe defaults
  const value = {
    addNotification: (message, type = 'info', duration = 5000) => {
      try {
        const id = generateNotificationId();
        const newNotification = { 
          id, 
          messaggio: message, 
          tipo: type,
          data_creazione: new Date().toISOString(),
          letta: false,
          letto: 0
        };
        
        setNotifications(prev => [...prev, newNotification]);
        setUnreadCount(prev => prev + 1);
        
        if (duration > 0) {
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));
          }, duration);
        }
      } catch (error) {
        console.error('🚨 NotificationSystem: Error adding notification:', error);
      }
    },
    notifications: notifications || [],
    unreadCount: unreadCount || 0,
    showNotification,
    setShowNotification,
    markAsRead,
    handleNotificationClick,
    handleCloseNotification,
    formatTime,
    getNotificationType,
    loading,
    error
  };

  // FIXED: Enhanced effect with better dependency management
  useEffect(() => {
    if (!token || !user?.id) {
      console.log('🔍 NotificationSystem: No token or user, skipping notification setup');
      return;
    }

    console.log('🔍 NotificationSystem: Setting up notification polling');
    loadNotifications();

    const interval = setInterval(() => {
      if (pollingActive) {
        console.log('🔍 NotificationSystem: Polling already active, skipping');
        return;
      }
      setPollingActive(true);
      loadNotifications().finally(() => {
        setPollingActive(false);
      });
    }, 300000); // 5 minutes

    return () => {
      console.log('🔍 NotificationSystem: Cleaning up notification polling');
      clearInterval(interval);
      setPollingActive(false);
    };
  }, [user?.id, token]); // FIXED: Remove pollingActive from dependencies

  // FIXED: Enhanced notification display logic
  useEffect(() => {
    try {
      const unviewedNotifications = getUnviewedNotifications();
      
      console.log('🔍 NotificationSystem: unviewedNotifications:', unviewedNotifications.length);
      console.log('🔍 NotificationSystem: showNotification:', showNotification);
      console.log('🔍 NotificationSystem: viewedNotifications size:', viewedNotifications.size);
      
      if (unviewedNotifications.length > 0 && !showNotification) {
        console.log('🔍 NotificationSystem: Showing notification');
        setShowNotification(true);
        
        const timer = setTimeout(() => {
          handleCloseNotification();
        }, 8000);
        
        return () => clearTimeout(timer);
      } else if (unviewedNotifications.length === 0) {
        console.log('🔍 NotificationSystem: No unviewed notifications');
        setShowNotification(false);
      }
    } catch (error) {
      console.error('🚨 NotificationSystem: Error in notification display effect:', error);
    }
  }, [notifications, showNotification, viewedNotifications]);

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