import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

const ModificaSquadra = () => {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) return <div>Caricamento...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Modifica Squadra {id}</h1>
      <p>Pagina in costruzione...</p>
      <button onClick={() => navigate(`/squadra/${id}`)}>
        Torna alla squadra
      </button>
    </div>
  );
};

export default ModificaSquadra;
