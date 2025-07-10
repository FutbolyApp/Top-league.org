import React, { useState, useEffect } from 'react';
import { updateLeagueConfig, getLeagueConfig } from '../api/leghe';

const LeagueConfigManager = ({ legaId, token, onConfigUpdate }) => {
  const [config, setConfig] = useState({
    roster_ab: false,
    cantera: false,
    contratti: false,
    triggers: false,
    is_classic: false,
    max_portieri: 3,
    min_portieri: 2,
    max_difensori: 8,
    min_difensori: 5,
    max_centrocampisti: 8,
    min_centrocampisti: 5,
    max_attaccanti: 6,
    min_attaccanti: 3
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (legaId) {
      loadConfig();
    }
  }, [legaId]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await getLeagueConfig(legaId, token);
      setConfig(response.config);
    } catch (err) {
      setError('Errore nel caricamento delle configurazioni');
      console.error('Errore caricamento config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateLeagueConfig(legaId, config, token);
      setSuccess('Configurazioni aggiornate con successo!');
      if (onConfigUpdate) {
        onConfigUpdate(config);
      }
    } catch (err) {
      setError(err.message || 'Errore nell\'aggiornamento delle configurazioni');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !config.is_classic) {
    return <div className="text-center p-4">Caricamento configurazioni...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">Configurazioni Lega</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Funzionalità Avanzate */}
        <div>
          <h4 className="text-lg font-medium mb-3">Funzionalità Avanzate</h4>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.roster_ab}
                onChange={(e) => handleConfigChange('roster_ab', e.target.checked)}
                className="rounded"
              />
              <span>Roster A/B</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.cantera}
                onChange={(e) => handleConfigChange('cantera', e.target.checked)}
                className="rounded"
              />
              <span>Cantera</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.contratti}
                onChange={(e) => handleConfigChange('contratti', e.target.checked)}
                className="rounded"
              />
              <span>Contratti</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.triggers}
                onChange={(e) => handleConfigChange('triggers', e.target.checked)}
                className="rounded"
              />
              <span>Triggers</span>
            </label>
          </div>
        </div>

        {/* Limiti di Ruolo per Leghe Classic */}
        {config.is_classic && (
          <div>
            <h4 className="text-lg font-medium mb-3">Limiti di Ruolo (Classic)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Portieri</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={config.min_portieri}
                    onChange={(e) => handleConfigChange('min_portieri', parseInt(e.target.value))}
                    className="w-20 px-2 py-1 border rounded"
                    placeholder="Min"
                  />
                  <span className="flex items-center">-</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={config.max_portieri}
                    onChange={(e) => handleConfigChange('max_portieri', parseInt(e.target.value))}
                    className="w-20 px-2 py-1 border rounded"
                    placeholder="Max"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Difensori</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={config.min_difensori}
                    onChange={(e) => handleConfigChange('min_difensori', parseInt(e.target.value))}
                    className="w-20 px-2 py-1 border rounded"
                    placeholder="Min"
                  />
                  <span className="flex items-center">-</span>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={config.max_difensori}
                    onChange={(e) => handleConfigChange('max_difensori', parseInt(e.target.value))}
                    className="w-20 px-2 py-1 border rounded"
                    placeholder="Max"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Centrocampisti</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={config.min_centrocampisti}
                    onChange={(e) => handleConfigChange('min_centrocampisti', parseInt(e.target.value))}
                    className="w-20 px-2 py-1 border rounded"
                    placeholder="Min"
                  />
                  <span className="flex items-center">-</span>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={config.max_centrocampisti}
                    onChange={(e) => handleConfigChange('max_centrocampisti', parseInt(e.target.value))}
                    className="w-20 px-2 py-1 border rounded"
                    placeholder="Max"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Attaccanti</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={config.min_attaccanti}
                    onChange={(e) => handleConfigChange('min_attaccanti', parseInt(e.target.value))}
                    className="w-20 px-2 py-1 border rounded"
                    placeholder="Min"
                  />
                  <span className="flex items-center">-</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={config.max_attaccanti}
                    onChange={(e) => handleConfigChange('max_attaccanti', parseInt(e.target.value))}
                    className="w-20 px-2 py-1 border rounded"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={loadConfig}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            disabled={loading}
          >
            Ripristina
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salva Configurazioni'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeagueConfigManager; 