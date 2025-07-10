import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { getPendingChangesByLega } from '../api/subadmin';

export const useAdminNotifications = (legaId) => {
  const { token } = useAuth();
  const [pendingChanges, setPendingChanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPendingChanges = async () => {
    if (!token || !legaId) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await getPendingChangesByLega(legaId, token);
      setPendingChanges(response.changes || []);
    } catch (err) {
      setError(err.message);
      console.error('Errore nel caricamento modifiche in attesa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingChanges();
    
    // Aggiorna ogni 60 secondi
    const interval = setInterval(fetchPendingChanges, 60000);
    
    return () => clearInterval(interval);
  }, [token, legaId]);

  return {
    pendingChanges,
    loading,
    error,
    refresh: fetchPendingChanges
  };
}; 