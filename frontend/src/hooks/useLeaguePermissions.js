import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { isLeagueAdmin } from '../api/auth';

export const useLeaguePermissions = (legaId) => {
  const { user, token } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user || !token || !legaId) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Se è superadmin, ha sempre accesso
      if (user.ruolo === 'superadmin' || user.ruolo === 'SuperAdmin') {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Se è admin globale, ha sempre accesso
      if (user.ruolo === 'admin') {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Altrimenti, verifica se è admin di questa specifica lega
      try {
        const response = await isLeagueAdmin(legaId, token);
        setIsAdmin(response.isAdmin);
      } catch (error) {
        console.error('Errore nel controllo permessi:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [user, token, legaId]);

  return { isAdmin, loading };
}; 