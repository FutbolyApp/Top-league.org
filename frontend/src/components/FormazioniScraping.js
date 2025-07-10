import React, { useState, useEffect } from 'react';
import { getFormazioniScraping } from '../api/scraping';
import { splitRoles, getRoleClass } from '../utils/roleUtils';
import { useAuth } from './AuthContext';

const FormazioniScraping = ({ legaId }) => {
    const [formazioni, setFormazioni] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bonusImages, setBonusImages] = useState([]);
    const { token } = useAuth();

    useEffect(() => {
        loadFormazioni();
        loadBonusImages();
    }, [legaId]);

    const loadFormazioni = async () => {
        try {
            setLoading(true);
            const response = await getFormazioniScraping(legaId, token);
            
            if (response.success) {
                console.log('🔍 DEBUG - Formazioni ricevute dal backend:', response.formazioni);
                console.log('🔍 DEBUG - Nomi squadre:', response.formazioni.map(f => ({
                    squadra: f.squadra,
                    tipo_squadra: f.tipo_squadra,
                    id: f.id,
                    modulo: f.modulo,
                    titolari_count: f.titolari?.length || 0,
                    panchinari_count: f.panchinari?.length || 0
                })));
                
                // Debug dettagliato per la prima formazione
                if (response.formazioni && response.formazioni.length > 0) {
                    const primaFormazione = response.formazioni[0];
                    console.log('🔍 DEBUG - Prima formazione completa:', primaFormazione);
                    console.log('🔍 DEBUG - Primi 3 titolari:', primaFormazione.titolari?.slice(0, 3));
                }
                
                setFormazioni(response.formazioni || []);
            } else {
                setError(response.message || 'Errore nel caricamento delle formazioni');
            }
        } catch (err) {
            setError('Errore di connessione');
        } finally {
            setLoading(false);
        }
    };

    const loadBonusImages = async () => {
        try {
            const response = await fetch(`/api/scraping/bonus-images/${legaId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setBonusImages(data.bonus_images || []);
                console.log('🎯 Bonus images caricate:', data.bonus_images);
            }
        } catch (err) {
            console.warn('⚠️ Errore caricamento bonus images:', err);
        }
    };

    // Funzione per ottenere il bonus visualizzato
    const getBonusDisplay = (giocatore) => {
        if (!giocatore.bonus || giocatore.bonus === 'N/A') return null;
        
        // Mappatura bonus immagini a colori e lettere - AGGIORNATA
        const bonusMapping = {
            // Bonus con immagini/codici
            'GOLFATTO': { color: '#27ae60', letter: 'G' },
            'GOLSUBITO': { color: '#3498db', letter: 'S' },
            'ASSIST': { color: '#e67e22', letter: 'A' },
            'ASSISTSOFT': { color: '#f39c12', letter: 'a' },
            'ASSISTGOLD': { color: '#f39c12', letter: 'A' },
            'AMMONITO': { color: '#f1c40f', letter: 'G' },
            'AMMONIZIONE': { color: '#f1c40f', letter: 'G' },
            'ESPULSIONE': { color: '#e74c3c', letter: 'R' },
            'AUTOGOL': { color: '#9b59b6', letter: 'A' },
            'RIGORESEGNATO': { color: '#27ae60', letter: 'R' },
            'RIGORESBAGLIATO': { color: '#8B4513', letter: 'r' },
            'VITTORIA': { color: '#27ae60', letter: 'V' },
            'RSE': { color: '#27ae60', letter: 'R' }, // Rigore Segnato
            'RSB': { color: '#8B4513', letter: 'r' }, // Rigore Sbagliato
            'PIB': { color: '#f39c12', letter: 'I' }, // Portiere imbattuto
            'PVT': { color: '#27ae60', letter: 'V' }, // Portiere vittoria
            'PPA': { color: '#2980b9', letter: 'P' }, // Portiere parata
            'PRI': { color: '#27ae60', letter: 'R' }, // Portiere rigore
            'PAU': { color: '#9b59b6', letter: 'A' }, // Portiere autogol
            'DGO': { color: '#27ae60', letter: 'G' }, // Difensore gol
            'DAS': { color: '#e67e22', letter: 'A' }, // Difensore assist
            'DVT': { color: '#27ae60', letter: 'V' }, // Difensore vittoria
            'DPA': { color: '#2980b9', letter: 'P' }, // Difensore parata
            'CGO': { color: '#27ae60', letter: 'G' }, // Centrocampista gol
            'CAS': { color: '#e67e22', letter: 'A' }, // Centrocampista assist
            'CVT': { color: '#27ae60', letter: 'V' }, // Centrocampista vittoria
            'AGO': { color: '#27ae60', letter: 'G' }, // Attaccante gol
            'AAS': { color: '#e67e22', letter: 'A' }, // Attaccante assist
            'AVT': { color: '#27ae60', letter: 'V' }, // Attaccante vittoria
            'AUT': { color: '#9b59b6', letter: 'A' }, // Autogol
        };

        // Supporta bonus multipli separati da virgola
        const bonusList = giocatore.bonus.split(',').map(b => b.trim().toUpperCase()).filter(Boolean);
        if (bonusList.length === 0) return null;

        return (
            <span style={{ display: 'flex', gap: '2px' }}>
                {bonusList.map((bonusCode, idx) => {
                    const mapping = bonusMapping[bonusCode];
                    if (!mapping) {
                        console.log('❌ Bonus non trovato per:', bonusCode);
                        return null;
                    }
                    return (
                        <span key={idx} style={{
                            background: mapping.color,
                            color: 'white',
                            padding: '1px 4px',
                            borderRadius: '50%',
                            fontSize: '0.6rem',
                            fontWeight: 'bold',
                            display: 'inline-block',
                            width: '16px',
                            height: '16px',
                            textAlign: 'center',
                            lineHeight: '14px',
                        }}>
                            {mapping.letter}
                        </span>
                    );
                })}
            </span>
        );
    };

    // Raggruppa le formazioni per partita - VERSIONE SEMPLIFICATA
    const raggruppaPerPartita = (formazioni) => {
        console.log('🔍 DEBUG - Raggruppamento partite, formazioni:', formazioni.map(f => ({
            squadra: f.squadra,
            tipo_squadra: f.tipo_squadra,
            id: f.id
        })));
        
        const partite = [];
        
        // Separa home e away
        const homeTeams = formazioni.filter(f => f.tipo_squadra === 'home');
        const awayTeams = formazioni.filter(f => f.tipo_squadra === 'away');
        
        console.log('🏠 Home teams:', homeTeams.map(t => t.squadra));
        console.log('✈️ Away teams:', awayTeams.map(t => t.squadra));
        
        // Crea partite accoppiando home e away
        const maxTeams = Math.max(homeTeams.length, awayTeams.length);
        
        for (let i = 0; i < maxTeams; i++) {
            const home = homeTeams[i] || null;
            const away = awayTeams[i] || null;
            
            const partita = {
                home: home,
                away: away,
                id: `partita_${i}_${Date.now()}_${Math.random()}`
            };
            
            console.log(`🔍 DEBUG - Partita ${i}: home=${home?.squadra}, away=${away?.squadra}`);
            partite.push(partita);
        }
        
        console.log('📊 DEBUG - Partite raggruppate:', partite.map(p => ({
            home: p.home?.squadra,
            away: p.away?.squadra
        })));
        
        return partite;
    };

    // Combina tutti i giocatori di una squadra (titolari + panchina)
    const combinaGiocatori = (formazione) => {
        const tuttiGiocatori = [];
        
        // Aggiungi titolari
        if (formazione.titolari && formazione.titolari.length > 0) {
            formazione.titolari.forEach(giocatore => {
                // Separa ruolo e nome se sono concatenati
                const { ruolo, nome } = separaRuoloNome(giocatore);
                tuttiGiocatori.push({
                    ...giocatore,
                    ruolo: ruolo,
                    nome: nome,
                    tipo: 'Titolare'
                });
            });
        }
        
        // Aggiungi panchina
        if (formazione.panchinari && formazione.panchinari.length > 0) {
            formazione.panchinari.forEach(giocatore => {
                // Separa ruolo e nome se sono concatenati
                const { ruolo, nome } = separaRuoloNome(giocatore);
                tuttiGiocatori.push({
                    ...giocatore,
                    ruolo: ruolo,
                    nome: nome,
                    tipo: 'Panchina'
                });
            });
        }
        
        return tuttiGiocatori;
    };

    // Funzione per separare ruolo e nome
    const separaRuoloNome = (giocatore) => {
        let ruolo = giocatore.ruolo || '';
        let nome = giocatore.nome || '';
        
        // Gestisci casi con newlines e spazi extra
        if (ruolo && ruolo.includes('\n')) {
            const parts = ruolo.split('\n').map(part => part.trim()).filter(part => part);
            if (parts.length >= 2) {
                // Il primo elemento è il ruolo, il resto è il nome
                ruolo = parts[0];
                nome = parts.slice(1).join(' ');
            }
        }
        
        // Se il nome contiene il ruolo all'inizio, separali
        if (nome && !ruolo) {
            const nomeUpper = nome.toUpperCase();
            
            // Lista dei ruoli Euroleghe
            const ruoliEuroleghe = ['POR', 'DD', 'DC', 'DS', 'B', 'E', 'M', 'T', 'W', 'A', 'PC'];
            
            // Cerca un ruolo all'inizio del nome
            for (const r of ruoliEuroleghe) {
                if (nomeUpper.startsWith(r + ' ')) {
                    ruolo = r;
                    nome = nome.substring(r.length + 1).trim();
                    break;
                }
            }
            
            // Se non trova ruoli Euroleghe, prova con ruoli Serie A
            if (!ruolo) {
                const ruoliSerieA = ['P', 'D', 'C', 'A'];
                for (const r of ruoliSerieA) {
                    if (nomeUpper.startsWith(r + ' ')) {
                        ruolo = r;
                        nome = nome.substring(r.length + 1).trim();
                        break;
                    }
                }
            }
        }
        
        // Pulizia finale
        ruolo = ruolo.trim();
        nome = nome.trim();
        
        return { ruolo, nome };
    };

    if (loading) {
        return (
            <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                background: 'white', 
                borderRadius: '8px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                margin: '10px'
            }}>
                <p>Caricamento formazioni...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                background: '#fee', 
                color: '#c33',
                borderRadius: '8px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                margin: '10px'
            }}>
                <p>{error}</p>
            </div>
        );
    }

    if (!formazioni || formazioni.length === 0) {
        return (
            <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                background: '#f8f9fa', 
                color: '#6c757d',
                borderRadius: '8px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                margin: '10px'
            }}>
                <p>Nessuna formazione trovata</p>
            </div>
        );
    }

    const partite = raggruppaPerPartita(formazioni);

    return (
        <div style={{ padding: '10px' }}>
            <h3>📊 Formazioni Scraping ({formazioni.length} squadre)</h3>
            
            {partite.map((partita, index) => (
                <div key={partita.id} style={{ 
                    background: 'white', 
                    borderRadius: '8px', 
                    marginBottom: '20px', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
                }}>
                    <div style={{ 
                        background: '#f8f9fa', 
                        padding: '10px', 
                        borderBottom: '1px solid #dee2e6',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h4 style={{ margin: 0 }}>
                            {partita.home && partita.away ? 
                                `${partita.home.squadra || 'Squadra Home'} vs ${partita.away.squadra || 'Squadra Away'}` : 
                                partita.home ? (partita.home.squadra || 'Squadra Home') : 
                                partita.away ? (partita.away.squadra || 'Squadra Away') : 'Partita'}
                        </h4>
                        {/* Debug info */}
                        <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '5px' }}>
                            Debug: Home={partita.home?.squadra || 'null'} ({partita.home?.tipo_squadra || 'null'}) | 
                            Away={partita.away?.squadra || 'null'} ({partita.away?.tipo_squadra || 'null'})
                        </div>
                        {partita.home && partita.away && (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <span style={{ 
                                    background: '#3498db', 
                                    color: 'white', 
                                    padding: '2px 8px', 
                                    borderRadius: '12px', 
                                    fontSize: '0.8rem' 
                                }}>
                                    {partita.home.modulo}
                                </span>
                                <span style={{ color: '#7f8c8d' }}>vs</span>
                                <span style={{ 
                                    background: '#e74c3c', 
                                    color: 'white', 
                                    padding: '2px 8px', 
                                    borderRadius: '12px', 
                                    fontSize: '0.8rem' 
                                }}>
                                    {partita.away.modulo}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    <div style={{ padding: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {/* Squadra Home */}
                            <div style={{ border: '1px solid #3498db', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ 
                                    background: '#3498db', 
                                    color: 'white', 
                                    padding: '6px', 
                                    textAlign: 'center', 
                                    fontWeight: 'bold',
                                    fontSize: '0.8rem'
                                }}>
                                    {partita.home ? (partita.home.squadra || 'Squadra Home') : 'N/A'} (Home)
                                    {/* Debug */}
                                    <div style={{ fontSize: '0.6rem', opacity: 0.8 }}>
                                        Debug: {partita.home?.squadra || 'null'}
                                    </div>
                                </div>
                                {partita.home && (
                                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                            <thead style={{ background: '#3498db', color: 'white' }}>
                                                <tr>
                                                    <th style={{ padding: '4px 6px', textAlign: 'left', fontSize: '0.7rem' }}>Ruolo</th>
                                                    <th style={{ padding: '4px 6px', textAlign: 'left', fontSize: '0.7rem' }}>Nome</th>
                                                    <th style={{ padding: '4px 6px', textAlign: 'left', fontSize: '0.7rem' }}>Bonus</th>
                                                    <th style={{ padding: '4px 6px', textAlign: 'left', fontSize: '0.7rem' }}>V</th>
                                                    <th style={{ padding: '4px 6px', textAlign: 'left', fontSize: '0.7rem' }}>FV</th>
                                                    <th style={{ padding: '4px 6px', textAlign: 'left', fontSize: '0.7rem' }}>In Campo</th>
                                                    <th style={{ padding: '4px 6px', textAlign: 'left', fontSize: '0.7rem' }}>Tipo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {combinaGiocatori(partita.home).map((giocatore, index) => (
                                                    <tr key={index} style={{ 
                                                        background: giocatore.tipo === 'Titolare' ? '#e8f5e8' : '#fff3e0' 
                                                    }}>
                                                        <td style={{ padding: '3px 4px', borderBottom: '1px solid #eee', fontSize: '0.7rem' }}>
                                                            {splitRoles(giocatore.ruolo).map((ruolo, idx) => (
                                                                <span key={idx} className={`ruolo-badge ${getRoleClass(ruolo)}`} style={{
                                                                    display: 'inline-block',
                                                                    padding: '1px 3px',
                                                                    margin: '1px',
                                                                    borderRadius: '3px',
                                                                    fontSize: '8px',
                                                                    fontWeight: '700',
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.3px',
                                                                    textAlign: 'center',
                                                                    minWidth: '14px',
                                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                                                                    border: '1px solid rgba(255,255,255,0.18)',
                                                                    transition: 'all 0.2s ease'
                                                                }}>{ruolo}</span>
                                                            ))}
                                                        </td>
                                                        <td style={{ padding: '3px 4px', borderBottom: '1px solid #eee', fontSize: '0.7rem', fontWeight: 'medium' }}>
                                                            {giocatore.nome}
                                                        </td>
                                                        <td style={{ padding: '3px 4px', borderBottom: '1px solid #eee', fontSize: '0.7rem' }}>
                                                            {getBonusDisplay(giocatore) || <span style={{ color: '#999' }}>-</span>}
                                                        </td>
                                                        <td style={{ padding: '3px 4px', borderBottom: '1px solid #eee', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                            {giocatore.voto || '-'}
                                                        </td>
                                                        <td style={{ padding: '3px 4px', borderBottom: '1px solid #eee', fontSize: '0.7rem', fontWeight: 'bold', color: '#e74c3c' }}>
                                                            {giocatore.fantavoto || '-'}
                                                        </td>
                                                        <td style={{ padding: '3px 4px', borderBottom: '1px solid #eee', fontSize: '0.7rem', textAlign: 'center' }}>
                                                            <span style={{
                                                                width: '12px',
                                                                height: '12px',
                                                                borderRadius: '50%',
                                                                background: giocatore.in_campo ? '#27ae60' : '#bdc3c7',
                                                                display: 'inline-block'
                                                            }}></span>
                                                        </td>
                                                        <td style={{ padding: '3px 4px', borderBottom: '1px solid #eee', fontSize: '0.7rem' }}>
                                                            <span style={{ 
                                                                background: giocatore.tipo === 'Titolare' ? '#27ae60' : '#f39c12', 
                                                                color: 'white', 
                                                                padding: '1px 4px', 
                                                                borderRadius: '2px', 
                                                                fontSize: '0.6rem', 
                                                                fontWeight: 'bold' 
                                                            }}>
                                                                {giocatore.tipo === 'Titolare' ? 'T' : 'P'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            
                            {/* Squadra Away */}
                            <div style={{ border: '1px solid #e74c3c', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ 
                                    background: '#e74c3c', 
                                    color: 'white', 
                                    padding: '6px', 
                                    textAlign: 'center', 
                                    fontWeight: 'bold',
                                    fontSize: '0.8rem'
                                }}>
                                    {partita.away ? (partita.away.squadra || 'Squadra Away') : 'N/A'} (Away)
                                    {/* Debug */}
                                    <div style={{ fontSize: '0.6rem', opacity: 0.8 }}>
                                        Debug: {partita.away?.squadra || 'null'}
                                    </div>
                                </div>
                                {partita.away && (
                                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                            <thead style={{ background: '#e74c3c', color: 'white' }}>
                                                <tr>
                                                    <th style={{ padding: '4px 6px', textAlign: 'left', fontSize: '0.7rem' }}>Ruolo</th>
                                                    <th style={{ padding: '4px 6px', textAlign: 'left', fontSize: '0.7rem' }}>Nome</th>
                                                    <th style={{ padding: '4px 6px', textAlign: 'left', fontSize: '0.7rem' }}>Bonus</th>
                                                    <th style={{ padding: '4px 6px', textAlign: 'left', fontSize: '0.7rem' }}>V</th>
                                                    <th style={{ padding: '4px 6px', textAlign: 'left', fontSize: '0.7rem' }}>FV</th>
                                                    <th style={{ padding: '4px 6px', textAlign: 'left', fontSize: '0.7rem' }}>In Campo</th>
                                                    <th style={{ padding: '4px 6px', textAlign: 'left', fontSize: '0.7rem' }}>Tipo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {combinaGiocatori(partita.away).map((giocatore, index) => (
                                                    <tr key={index} style={{ 
                                                        background: giocatore.tipo === 'Titolare' ? '#e8f5e8' : '#fff3e0' 
                                                    }}>
                                                        <td style={{ padding: '3px 4px', borderBottom: '1px solid #eee', fontSize: '0.7rem' }}>
                                                            {splitRoles(giocatore.ruolo).map((ruolo, idx) => (
                                                                <span key={idx} className={`ruolo-badge ${getRoleClass(ruolo)}`} style={{
                                                                    display: 'inline-block',
                                                                    padding: '1px 3px',
                                                                    margin: '1px',
                                                                    borderRadius: '3px',
                                                                    fontSize: '8px',
                                                                    fontWeight: '700',
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.3px',
                                                                    textAlign: 'center',
                                                                    minWidth: '14px',
                                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                                                                    border: '1px solid rgba(255,255,255,0.18)',
                                                                    transition: 'all 0.2s ease'
                                                                }}>{ruolo}</span>
                                                            ))}
                                                        </td>
                                                        <td style={{ padding: '3px 4px', borderBottom: '1px solid #eee', fontSize: '0.7rem', fontWeight: 'medium' }}>
                                                            {giocatore.nome}
                                                        </td>
                                                        <td style={{ padding: '3px 4px', borderBottom: '1px solid #eee', fontSize: '0.7rem' }}>
                                                            {getBonusDisplay(giocatore) || <span style={{ color: '#999' }}>-</span>}
                                                        </td>
                                                        <td style={{ padding: '3px 4px', borderBottom: '1px solid #eee', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                            {giocatore.voto || '-'}
                                                        </td>
                                                        <td style={{ padding: '3px 4px', borderBottom: '1px solid #eee', fontSize: '0.7rem', fontWeight: 'bold', color: '#e74c3c' }}>
                                                            {giocatore.fantavoto || '-'}
                                                        </td>
                                                        <td style={{ padding: '3px 4px', borderBottom: '1px solid #eee', fontSize: '0.7rem', textAlign: 'center' }}>
                                                            <span style={{
                                                                width: '12px',
                                                                height: '12px',
                                                                borderRadius: '50%',
                                                                background: giocatore.in_campo ? '#27ae60' : '#bdc3c7',
                                                                display: 'inline-block'
                                                            }}></span>
                                                        </td>
                                                        <td style={{ padding: '3px 4px', borderBottom: '1px solid #eee', fontSize: '0.7rem' }}>
                                                            <span style={{ 
                                                                background: giocatore.tipo === 'Titolare' ? '#27ae60' : '#f39c12', 
                                                                color: 'white', 
                                                                padding: '1px 4px', 
                                                                borderRadius: '2px', 
                                                                fontSize: '0.6rem', 
                                                                fontWeight: 'bold' 
                                                            }}>
                                                                {giocatore.tipo === 'Titolare' ? 'T' : 'P'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FormazioniScraping; 