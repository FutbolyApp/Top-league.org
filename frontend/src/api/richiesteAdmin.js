import { api } from './config.js';

export const createRichiestaAdmin = async (squadra_id, tipo_richiesta, dati_richiesta, token) => {
  return await api.post('/richieste-admin/create', {
    squadra_id,
    tipo_richiesta,
    dati_richiesta
  }, token);
};

export const getRichiesteBySquadra = async (squadra_id, token) => {
  return await api.get(`/richieste-admin/squadra/${squadra_id}`, token);
};

export const getRichiestePendingByLega = async (lega_id, token) => {
  return await api.get(`/richieste-admin/pending/${lega_id}`, token);
};

export const gestisciRichiesta = async (richiesta_id, azione, note_admin, valore_costo, token) => {
  return await api.post(`/richieste-admin/${richiesta_id}/gestisci`, {
    azione,
    note_admin,
    valore_costo
  }, token);
}; 