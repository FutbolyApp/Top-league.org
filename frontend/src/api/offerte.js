const API_URL = 'http://localhost:3001/api/offerte';

export async function creaOfferta(data, token) {
  // data: { lega_id, squadra_mittente_id, squadra_destinatario_id, giocatore_id, tipo, valore }
  const res = await fetch(`${API_URL}/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Errore creazione offerta');
  return res.json();
}

export async function getOfferteByLega(lega_id, token) {
  const res = await fetch(`${API_URL}/lega/${lega_id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Errore caricamento offerte');
  return res.json();
}

export async function updateOffertaStatus(offerta_id, stato, token) {
  const res = await fetch(`${API_URL}/${offerta_id}/status`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ stato })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Errore aggiornamento offerta');
  return res.json();
}

export async function getMovimentiMercato(lega_id, token) {
  const res = await fetch(`${API_URL}/movimenti/${lega_id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Errore caricamento movimenti');
  return res.json();
} 