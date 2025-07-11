import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { getPendingChangesBySubadmin } from '../api/subadmin';
import { checkSubadminShared } from '../api/sharedApi';

export const useSubadminNotifications = () => {
  const { token, user } = useAuth();
  const [pendingChanges, setPendingChanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubadmin, setIsSubadmin] = useState(false);

  const checkSubadminStatus = async () => {
    if (!token) return false;
    
    try {
      const response = await checkSubadminShared(token);
      return response.isSubadmin || false;
    } catch (error) {
      console.error('Errore nel controllo subadmin:', error);
      return false;
    }
  };

  const fetchPendingChanges = async () => {
    if (!token) {
      setPendingChanges([]);
      setIsSubadmin(false);
      return;
    }
    
    // Prima controlla se l'utente è subadmin
    const userIsSubadmin = await checkSubadminStatus();
    setIsSubadmin(userIsSubadmin);
    
    if (!userIsSubadmin) {
      setPendingChanges([]);
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const response = await getPendingChangesBySubadmin(token);
      setPendingChanges(response.changes || []);
    } catch (err) {
      setError(err.message);
      console.error('Errore nel caricamento modifiche in attesa:', err);
      setPendingChanges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingChanges();
    
    // Aggiorna ogni 300 secondi solo se l'utente è subadmin (aumentato da 120s)
    const interval = setInterval(() => {
      if (isSubadmin) {
        console.log('🔄 Polling subadmin changes - timestamp:', new Date().toISOString());
        fetchPendingChanges();
      }
    }, 300000);
    
    return () => clearInterval(interval);
  }, [token, isSubadmin]);

  return {
    pendingChanges,
    loading,
    error,
    isSubadmin,
    refresh: fetchPendingChanges
  };
}; 