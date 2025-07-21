import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { api } from '../api/config';
import { getNotificheShared } from '../api/sharedApi';

console.log('🔍 NotificationSystem: File loaded');

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