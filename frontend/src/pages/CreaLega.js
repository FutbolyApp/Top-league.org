import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../components/AuthContext';
import { creaLega } from '../api/leghe';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #666;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    color: #FFA94D;
  }
`;

const Form = styled.form`
  background: #fff;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 2rem;
  text-align: center;
  font-size: 2rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #FFA94D;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #FFA94D;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f8f9fa;
  }
  
  input[type="checkbox"] {
    width: auto;
    margin: 0;
  }
`;

const FileInput = styled.div`
  margin-top: 0.5rem;
  
  input[type="file"] {
    width: 100%;
    padding: 8px;
    border: 2px dashed #e1e5e9;
    border-radius: 8px;
    background: #f8f9fa;
    
    &:focus {
      outline: none;
      border-color: #FFA94D;
    }
  }
`;

const NumberInputs = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const SubmitButton = styled.button`
  width: 100%;
  background: linear-gradient(135deg, #FFA94D 0%, #FF8C42 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 16px;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 169, 77, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Message = styled.div`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 600;
  
  &.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  
  &.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
`;

const CreaLega = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: '',
    modalita: 'Serie A Classic',
    is_pubblica: true,
    password: '',
    max_squadre: '',
    min_giocatori: '',
    max_giocatori: '',
    roster_ab: false,
    cantera: false,
    contratti: false,
    triggers: false,
    fantacalcio_url: '',
    fantacalcio_username: '',
    fantacalcio_password: '',
    scraping_automatico: false
  });
  const [excel, setExcel] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [testingScraping, setTestingScraping] = useState(false);
  const [scrapingTestResult, setScrapingTestResult] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFile = (e) => {
    if (e.target.name === 'excel') setExcel(e.target.files[0]);
    if (e.target.name === 'pdf') setPdf(e.target.files[0]);
  };

  const testScraping = async () => {
    if (!form.fantacalcio_url.trim() || !form.fantacalcio_username.trim() || !form.fantacalcio_password.trim()) {
      setError('Compila tutti i campi Fantacalcio per testare lo scraping');
      return;
    }

    setTestingScraping(true);
    setScrapingTestResult(null);
    setError('');

    try {
      const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://topleaguem.onrender.com'}/api/scraping/puppeteer/league`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          leagueUrl: form.fantacalcio_url,
          username: form.fantacalcio_username,
          password: form.fantacalcio_password
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setScrapingTestResult({
          success: true,
          message: '✅ Connessione riuscita! Credenziali valide.',
          data: result.data
        });
      } else {
        setScrapingTestResult({
          success: false,
          message: `❌ Errore: ${result.error}`
        });
      }
    } catch (err) {
      setScrapingTestResult({
        success: false,
        message: `❌ Errore di connessione: ${err.message}`
      });
    } finally {
      setTestingScraping(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSubmitting(true);
    
    // Validazioni
    if (!form?.nome?.trim()) {
      setError('Il nome della lega è obbligatorio');
      setSubmitting(false);
      return;
    }
    
    if (!form?.is_pubblica && !form?.password?.trim()) {
      setError('La password è obbligatoria per le leghe private');
      setSubmitting(false);
      return;
    }
    
    if (!excel) {
      setError('Carica un file Excel con le squadre');
      setSubmitting(false);
      return;
    }
    
    // Validazione campi scraping
    if (form.scraping_automatico) {
      if (!form.fantacalcio_url.trim()) {
        setError('URL Fantacalcio richiesto per lo scraping automatico');
        setSubmitting(false);
        return;
      }
      if (!form.fantacalcio_username.trim()) {
        setError('Username Fantacalcio richiesto per lo scraping automatico');
        setSubmitting(false);
        return;
      }
      if (!form.fantacalcio_password.trim()) {
        setError('Password Fantacalcio richiesta per lo scraping automatico');
        setSubmitting(false);
        return;
      }
    }
    
    try {
      const result = await creaLega({ ...form, admin_id: user.id, excel, regolamento_pdf: pdf }, token);
      setSuccess(true);
      
      // Gestisci i warning dal backend
      if (result.warnings && result.warnings?.length || 0 > 0) {
        setWarnings(result.warnings);
      }
      setSuccess(true);
      setForm({
        nome: '',
        modalita: 'Serie A Classic',
        is_pubblica: true,
        password: '',
        max_squadre: '',
        min_giocatori: '',
        max_giocatori: '',
        roster_ab: false,
        cantera: false,
        contratti: false,
        triggers: false,
        fantacalcio_url: '',
        fantacalcio_username: '',
        fantacalcio_password: '',
        scraping_automatico: false
      });
      setExcel(null);
      setPdf(null);
      
      // Redirect dopo 2 secondi
      setTimeout(() => {
        navigate('/area-admin');
      }, 2000);
    } catch (err) {
      // Gestione specifica per nome duplicato
      if (err.message && err.message.includes('Nome lega duplicato')) {
        setError('Esiste già una lega con questo nome. Scegli un nome diverso.');
      } else if (err.message && err.message.includes('Esiste già una lega con questo nome')) {
        setError('Esiste già una lega con questo nome. Scegli un nome diverso.');
      } else {
        setError(err.message || 'Errore durante la creazione della lega');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container>
      <BackButton onClick={() => navigate(-1)}>
        ← Torna indietro
      </BackButton>
      
      <Form onSubmit={handleSubmit}>
        <Title>🏆 Crea Nuova Lega</Title>
        
        <FormGroup>
          <Label>Nome Lega *</Label>
          <Input
            name="nome"
            placeholder="Inserisci il nome della lega"
            value={form?.nome || 'Nome'}
            onChange={handleChange}
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Modalità *</Label>
          <Select name="modalita" value={form?.modalita || ''} onChange={handleChange}>
            <option value="Serie A Classic">Serie A Classic</option>
            <option value="Serie A Mantra">Serie A Mantra</option>
            <option value="Euroleghe Classic">Euroleghe Classic</option>
            <option value="Euroleghe Mantra">Euroleghe Mantra</option>
          </Select>
        </FormGroup>
        
        <FormGroup>
          <Label>
            <input
              type="checkbox"
              name="is_pubblica"
              checked={form?.is_pubblica || false}
              onChange={handleChange}
            />
            {' '}Lega Pubblica
          </Label>
          {!form?.is_pubblica || false && (
            <Input
              name="password"
              type="password"
              placeholder="Password (obbligatoria per leghe private) *"
              value={form?.password || ''}
              onChange={handleChange}
              required={!form?.is_pubblica || false}
              style={{ marginTop: '0.5rem' }}
            />
          )}
        </FormGroup>
        
        <FormGroup>
          <Label>Configurazione Squadre</Label>
          <NumberInputs>
            <Input
              name="max_squadre"
              type="number"
              placeholder="Numero massimo squadre"
              value={form?.max_squadre || ''}
              onChange={handleChange}
            />
            <Input
              name="min_giocatori"
              type="number"
              placeholder="Min giocatori per squadra"
              value={form?.min_giocatori || ''}
              onChange={handleChange}
            />
            <Input
              name="max_giocatori"
              type="number"
              placeholder="Max giocatori per squadra"
              value={form?.max_giocatori || ''}
              onChange={handleChange}
            />
          </NumberInputs>
        </FormGroup>
        
        <FormGroup>
          <Label>Funzionalità Avanzate</Label>
          <CheckboxGroup>
            <CheckboxLabel>
              <input
                type="checkbox"
                name="roster_ab"
                checked={form?.roster_ab || false}
                onChange={handleChange}
              />
              Roster A/B
            </CheckboxLabel>
            <CheckboxLabel>
              <input
                type="checkbox"
                name="cantera"
                checked={form?.cantera || false}
                onChange={handleChange}
              />
              Cantera
            </CheckboxLabel>
            <CheckboxLabel>
              <input
                type="checkbox"
                name="contratti"
                checked={form?.contratti || false}
                onChange={handleChange}
              />
              Contratti
            </CheckboxLabel>
            <CheckboxLabel>
              <input
                type="checkbox"
                name="triggers"
                checked={form?.triggers || false}
                onChange={handleChange}
              />
              Triggers
            </CheckboxLabel>
          </CheckboxGroup>
        </FormGroup>
        
        <FormGroup>
          <Label>🔗 Configurazione Scraping Automatico (Opzionale)</Label>
          <small style={{ color: '#666', marginBottom: '1rem', display: 'block' }}>
            Configura l'importazione automatica dei dati da una piattaforma esterna
          </small>
          
          <FormGroup>
            <Label>URL Lega Fantacalcio</Label>
            <Input
              name="fantacalcio_url"
              type="url"
              placeholder="https://esempio-url-piattaforma/lega/..."
              value={form.fantacalcio_url}
              onChange={handleChange}
            />
            <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
              L'URL della tua lega sulla piattaforma esterna
            </small>
          </FormGroup>
          
          <FormGroup>
            <Label>Username Fantacalcio</Label>
            <Input
              name="fantacalcio_username"
              type="text"
              placeholder="Il tuo username sulla piattaforma esterna"
              value={form.fantacalcio_username}
              onChange={handleChange}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Password Fantacalcio</Label>
            <Input
              name="fantacalcio_password"
              type="password"
              placeholder="La tua password sulla piattaforma esterna"
              value={form.fantacalcio_password}
              onChange={handleChange}
            />
            <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
              Le credenziali sono necessarie per accedere ai dati della lega
            </small>
          </FormGroup>
          
          <CheckboxLabel style={{ marginTop: '1rem' }}>
            <input
              type="checkbox"
              name="scraping_automatico"
              checked={form.scraping_automatico}
              onChange={handleChange}
            />
            Abilita scraping automatico (aggiorna dati ogni 3 ore)
          </CheckboxLabel>
          
          {(form.fantacalcio_url || form.fantacalcio_username || form.fantacalcio_password) && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={testScraping}
                disabled={testingScraping || !form.fantacalcio_url.trim() || !form.fantacalcio_username.trim() || !form.fantacalcio_password.trim()}
                style={{
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  marginBottom: '1rem'
                }}
              >
                {testingScraping ? '🔄 Test in corso...' : '🧪 Testa Connessione'}
              </button>
              
              {scrapingTestResult && (
                <div style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  backgroundColor: scrapingTestResult.success ? '#d4edda' : '#f8d7da',
                  color: scrapingTestResult.success ? '#155724' : '#721c24',
                  border: `1px solid ${scrapingTestResult.success ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                  {scrapingTestResult.message}
                  {scrapingTestResult.success && scrapingTestResult.data && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      <strong>Dati trovati:</strong>
                      {scrapingTestResult.data.rose && (
                        <div>📊 {scrapingTestResult.data.rose?.length || 0} squadre trovate</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </FormGroup>
        
        <FormGroup>
          <Label>Regolamento PDF (opzionale)</Label>
          <FileInput>
            <input
              type="file"
              name="pdf"
              accept="application/pdf"
              onChange={handleFile}
            />
          </FileInput>
        </FormGroup>
        
        <FormGroup>
          <Label>File Excel Squadre *</Label>
          <FileInput>
            <input
              type="file"
              name="excel"
              accept=".xls,.xlsx"
              onChange={handleFile}
              required
            />
          </FileInput>
          <small style={{ color: '#666', marginTop: '0.5rem', display: 'block' }}>
            Il file Excel deve contenere le squadre con i relativi giocatori
          </small>
        </FormGroup>
        
        {error && <Message className="error">{error}</Message>}
        {warnings?.length || 0 > 0 && (
          <Message style={{ backgroundColor: "#fff3cd", color: "#856404", border: "1px solid #ffeaa7" }}>
            <strong>⚠️ Attenzione:</strong>
            {warnings?.map((warning, index) => (
              <div key={index}>{warning}</div>
            ))}
          </Message>
        )}        {success && (
          <Message className="success">
            Lega creata con successo! Reindirizzamento in corso...
          </Message>
        )}
        
        <SubmitButton type="submit" disabled={submitting}>
          {submitting ? 'Creazione in corso...' : 'Crea Lega'}
        </SubmitButton>
      </Form>
    </Container>
  );
};

export default CreaLega; 