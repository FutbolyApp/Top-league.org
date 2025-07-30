import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../components/AuthContext';
import { api } from '../api/config';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const Title = styled.h1`
  text-align: center;
  color: #333;
  margin-bottom: 1rem;
  font-size: 2.5rem;
  font-weight: 300;
`;

const Subtitle = styled.p`
  text-align: center;
  color: #666;
  margin-bottom: 3rem;
  font-size: 1.1rem;
`;

const PlansSection = styled.div`
  margin-bottom: 4rem;
`;

const PlansTitle = styled.h2`
  text-align: center;
  color: #333;
  margin-bottom: 1rem;
  font-size: 2rem;
  font-weight: 400;
`;

const PlansGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const PlanCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }

  ${props => props.featured && `
    border-color: #FFA94D;
    transform: scale(1.05);
    
    &:hover {
      transform: scale(1.05) translateY(-5px);
    }
  `}
`;

const PlanName = styled.h3`
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
`;

const PlanPrice = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: #FFA94D;
  margin-bottom: 1rem;
`;

const PlanFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
  text-align: left;
`;

const FeatureItem = styled.li`
  padding: 0.5rem 0;
  color: #555;
  display: flex;
  align-items: center;
`;

const PlanButton = styled.button`
  background: #FFA94D;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
  width: 100%;
  margin-top: 1rem;

  &:hover {
    background: #e6953a;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const AddonsSection = styled.div`
  margin-bottom: 4rem;
`;

const AddonsTitle = styled.h2`
  text-align: center;
  color: #333;
  margin-bottom: 1rem;
  font-size: 2rem;
  font-weight: 400;
`;

const AddonsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const AddonCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-3px);
  }
`;

const AddonName = styled.h4`
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
`;

const AddonPrice = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: #FFA94D;
  margin-bottom: 0.5rem;
`;

const AddonDescription = styled.p`
  color: #666;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const AddonButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s ease;
  width: 100%;

  &:hover {
    background: #0056b3;
  }
`;

const UserLimitsSection = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 2rem;
  margin-top: 3rem;
`;

const UserLimitsTitle = styled.h3`
  color: #333;
  margin-bottom: 1rem;
  text-align: center;
`;

const LimitsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const LimitItem = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const LimitLabel = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
`;

const LimitValue = styled.div`
  font-size: 1.5rem;
  color: #FFA94D;
  font-weight: 700;
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.2rem;
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 3rem;
  color: #dc3545;
  font-size: 1.2rem;
`;

const ReferralSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const ReferralTitle = styled.h3`
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
`;

const ReferralDescription = styled.p`
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.6;
`;

const ReferralCodeContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
`;

const ReferralCodeInput = styled.input`
  flex: 1;
  padding: 0.8rem;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #FFA94D;
  }
`;

const ReferralButton = styled.button`
  padding: 0.8rem 1.5rem;
  background: #FFA94D;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s ease;
  
  &:hover {
    background: #e6953a;
  }
`;

const ReferralStatus = styled.div`
  padding: 1rem;
  border-radius: 6px;
  margin-top: 1rem;
  font-weight: 500;
`;

const ReferralSuccess = styled(ReferralStatus)`
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
`;

const ReferralError = styled(ReferralStatus)`
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
`;

const MyReferralSection = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 2rem;
  margin-top: 2rem;
`;

const MyReferralTitle = styled.h4`
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.3rem;
`;

const ReferralCodeDisplay = styled.div`
  background: white;
  border: 2px solid #FFA94D;
  border-radius: 6px;
  padding: 1rem;
  font-family: monospace;
  font-size: 1.2rem;
  font-weight: bold;
  text-align: center;
  margin: 1rem 0;
`;

const CopyButton = styled.button`
  padding: 0.8rem 1.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
  
  &:hover {
    background: #0056b3;
  }
`;

const GenerateButton = styled.button`
  padding: 1rem 2rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  transition: background 0.3s ease;
  
  &:hover {
    background: #218838;
  }
`;

const ReferralInfo = styled.div`
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #666;
  
  ul {
    margin-top: 0.5rem;
    padding-left: 1.5rem;
  }
  
  li {
    margin-bottom: 0.3rem;
  }
`;

const Piani = () => {
  console.log('🔍 Piani.js - Componente montato');
  
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [plans, setPlans] = useState([]);
  const [addons, setAddons] = useState([]);
  const [userLimits, setUserLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referralValid, setReferralValid] = useState(null);
  const [myReferralCode, setMyReferralCode] = useState(null);

  useEffect(() => {
    loadData();
  }, [token]);

  // Carica AdSense solo una volta quando il componente è montato
  useEffect(() => {
    const loadAdSense = () => {
      if (window.adsbygoogle && window.adsbygoogle.push) {
        try {
          window.adsbygoogle.push({});
        } catch (error) {
          console.log('AdSense già caricato o errore:', error);
        }
      }
    };

    // Aspetta che il DOM sia pronto
    setTimeout(loadAdSense, 1000);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Piani.js - Iniziando caricamento dati...');
      console.log('🔍 Piani.js - Token:', token ? 'Presente' : 'Mancante');

      // Carica i piani
      const plansResponse = await api.get('/subscriptions/plans', token);
      console.log('🔍 Piani.js - Plans response:', plansResponse);
      console.log('🔍 Piani.js - Plans array:', plansResponse.data?.plans);
      setPlans(plansResponse.data?.plans || []);
      console.log('🔍 Piani.js - Plans state settato');

      // Carica gli add-on
      const addonsResponse = await api.get('/subscriptions/addons', token);
      console.log('🔍 Piani.js - Addons response:', addonsResponse);
      console.log('🔍 Piani.js - Addons array:', addonsResponse.data?.addons);
      setAddons(addonsResponse.data?.addons || []);
      console.log('🔍 Piani.js - Addons state settato');

      // Carica i limiti utente
      const limitsResponse = await api.get('/subscriptions/my-limits', token);
      console.log('🔍 Piani.js - Limits response:', limitsResponse);
      setUserLimits(limitsResponse.data || limitsResponse);

      // Carica il codice referral dell'utente (gestisce errori silenziosamente)
      try {
        const referralResponse = await api.get('/subscriptions/my-referral-code', token);
        console.log('🔍 Piani.js - Referral response:', referralResponse);
        setMyReferralCode(referralResponse.data || referralResponse);
      } catch (referralError) {
        console.log('🔍 Piani.js - Codice referral non disponibile:', referralError.message);
        setMyReferralCode({ hasCode: false, code: null });
      }

      console.log('🔍 Piani.js - Caricamento completato');
    } catch (error) {
      console.error('🔍 Piani.js - Errore nel caricamento dei dati:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanPurchase = async (planId) => {
    try {
      // Simula il pagamento per ora
      console.log('Acquisto piano:', planId);
      alert('Funzionalità di pagamento in sviluppo. Per ora, il piano è stato attivato gratuitamente.');
    } catch (error) {
      console.error('Errore nell\'acquisto del piano:', error);
      alert('Errore nell\'acquisto del piano');
    }
  };

  const handlePlanSelection = (plan) => {
    console.log('Piano selezionato:', plan);
    handlePlanPurchase(plan.id);
  };

  const handleAddonPurchase = async (addonId) => {
    try {
      if (!token) {
        navigate('/login');
        return;
      }

      // Crea ordine PayPal per add-on
      const response = await api.post('/subscriptions/create-paypal-order-addon', { 
        addonId, 
        referralCode: referralValid?.valid ? referralCode : null 
      }, token);
      
      if (response.success) {
        // Reindirizza a PayPal
        window.location.href = response.approvalUrl;
      }
    } catch (err) {
      console.error('Errore nell\'acquisto dell\'add-on:', err);
      alert('Errore nell\'acquisto dell\'add-on');
    }
  };

  const verifyReferralCode = async () => {
    try {
      if (!referralCode.trim()) {
        setReferralValid(null);
        return;
      }

      const response = await api.post('/subscriptions/verify-referral-code', { code: referralCode });
      setReferralValid(response);
    } catch (err) {
      console.error('Errore nella verifica codice referral:', err);
      setReferralValid({ success: false, valid: false, message: 'Errore nella verifica' });
    }
  };

  const generateMyReferralCode = async () => {
    try {
      console.log('🔍 Piani.js - Generando codice referral...');
      const response = await api.post('/subscriptions/generate-referral-code', {}, token);
      console.log('🔍 Piani.js - Codice referral generato:', response);
      setMyReferralCode(response);
    } catch (error) {
      console.error('🔍 Piani.js - Errore nella generazione codice referral:', error);
      alert('Errore nella generazione del codice referral');
    }
  };

  const parseFeatures = (featuresJson) => {
    try {
      return JSON.parse(featuresJson);
    } catch {
      return {};
    }
  };

  if (loading) {
    return <LoadingContainer>Caricamento abbonamenti...</LoadingContainer>;
  }

  if (error) {
    return <ErrorContainer>Errore: {error}</ErrorContainer>;
  }

  console.log('🔍 Piani.js - Rendering con:', {
    plans: plans.length,
    addons: addons.length,
    userLimits,
    myReferralCode
  });

  return (
    <Container>
      <Title>Abbonamenti</Title>
      <Subtitle>Scegli il piano più adatto alle tue esigenze</Subtitle>
      
      {/* Sezione Limiti Attuali */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '1.5rem', 
        borderRadius: '8px', 
        marginBottom: '2rem',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#495057' }}>I Tuoi Limiti Attuali</h3>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div>
            <strong>Leghe</strong>
            <br />
            {userLimits?.currentLeagues || 0} / {userLimits?.maxLeagues === -1 ? '∞' : userLimits?.maxLeagues || 1}
          </div>
          <div>
            <strong>Tornei</strong>
            <br />
            {userLimits?.currentTournaments || 0} / {userLimits?.maxTournaments === -1 ? '∞' : userLimits?.maxTournaments || 1}
          </div>
          <div>
            <strong>Squadre</strong>
            <br />
            {userLimits?.currentSquads || 0} / {userLimits?.maxSquads === -1 ? '∞' : userLimits?.maxSquads || 10}
          </div>
        </div>
      </div>

      <PlansSection>
        <PlansTitle>Abbonamenti Disponibili</PlansTitle>
        <PlansGrid>
          {plans.map((plan) => {
            const originalPrice = parseFloat(plan.price);
            let discountedPrice = originalPrice;
            let discountAmount = 0;
            
            if (referralValid && plan.name !== 'free') {
              if (plan.name === 'gold') {
                discountedPrice = 26.00;
                discountAmount = originalPrice - discountedPrice;
              } else if (plan.name === 'diamond') {
                discountedPrice = 100.00;
                discountAmount = originalPrice - discountedPrice;
              } else {
                discountedPrice = originalPrice * 0.75;
                discountAmount = originalPrice - discountedPrice;
              }
            }
            
            return (
              <PlanCard 
                key={plan.id} 
                featured={plan.name === 'gold'}
                onClick={() => handlePlanSelection(plan)}
              >
                <PlanName>{plan.display_name}</PlanName>
                <PlanPrice>
                  {referralValid ? (
                    <>
                      <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '1.5rem' }}>
                        €{originalPrice.toFixed(2)}
                      </span>
                      <br />
                      <span style={{ color: '#28a745', fontSize: '0.9rem' }}>
                        {plan.name === 'free' ? 'Gratuito' : 
                         plan.name === 'gold' ? '€26.00 con referral!' :
                         plan.name === 'diamond' ? '€100.00 con referral!' :
                         `€${discountedPrice.toFixed(2)} con referral!`}
                      </span>
                      <br />
                      {plan.name !== 'free' && (
                        <span style={{ color: '#28a745', fontSize: '0.9rem' }}>
                          Risparmi €{discountAmount.toFixed(2)}!
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                        €{originalPrice.toFixed(2)}
                      </span>
                      {plan.name === 'gold' && (
                        <>
                          <br />
                          <span style={{ color: '#28a745', fontWeight: 'bold' }}>€26.00 con referral!</span>
                                          </>
                      )}
                      {plan.name === 'diamond' && (
                        <>
                          <br />
                          <span style={{ color: '#28a745', fontWeight: 'bold' }}>€100.00 con referral!</span>
                        </>
                      )}
                      <br />
                      <span style={{ fontSize: '0.9rem', color: '#666' }}>
                        {plan.name === 'free' && '(Gratuito)'}
                        {plan.name === 'gold' && '(€0.86 per partecipante)'}
                        {plan.name === 'diamond' && '(Piano illimitato)'}
                      </span>
                    </>
                  )}
                </PlanPrice>
              
              <PlanFeatures>
                {plan.max_leagues === -1 ? (
                  <FeatureItem>Leghe illimitate</FeatureItem>
                ) : (
                  <FeatureItem>Massimo {plan.max_leagues} leghe</FeatureItem>
                )}
                {plan.max_tournaments === -1 ? (
                  <FeatureItem>Tornei illimitati</FeatureItem>
                ) : (
                  <FeatureItem>Massimo {plan.max_tournaments} tornei</FeatureItem>
                )}
                {plan.max_squads === -1 ? (
                  <FeatureItem>Squadre illimitate</FeatureItem>
                ) : (
                  <FeatureItem>Massimo {plan.max_squads} squadre</FeatureItem>
                )}
                
                {/* Features specifiche per piano */}
                {plan.name === 'free' && (
                  <>
                    <FeatureItem>❌ No Loghi squadra personalizzabili</FeatureItem>
                    <FeatureItem>❌ No Scraping automatico</FeatureItem>
                    <FeatureItem>❌ No Cantera</FeatureItem>
                    <FeatureItem>❌ No Roster A/B</FeatureItem>
                    <FeatureItem>❌ No Triggers</FeatureItem>
                    <FeatureItem>❌ No Contratti</FeatureItem>
                    <FeatureItem>❌ No upload Excel modificabile</FeatureItem>
                  </>
                )}
                
                {plan.name === 'gold' && (
                  <>
                    <FeatureItem>Loghi squadra personalizzabili</FeatureItem>
                    <FeatureItem>❌ No Scraping automatico</FeatureItem>
                    <FeatureItem>❌ No Cantera</FeatureItem>
                    <FeatureItem>❌ No Roster A/B</FeatureItem>
                    <FeatureItem>❌ No Triggers</FeatureItem>
                    <FeatureItem>❌ No Contratti</FeatureItem>
                    <FeatureItem>Upload Excel modificabile post-creazione</FeatureItem>
                  </>
                )}
                
                {plan.name === 'diamond' && (
                  <>
                    <FeatureItem>Loghi squadra personalizzabili</FeatureItem>
                    <FeatureItem>Scraping automatico giornaliero</FeatureItem>
                    <FeatureItem>Cantera attivabile</FeatureItem>
                    <FeatureItem>Roster A/B gestibile</FeatureItem>
                    <FeatureItem>Triggers utilizzabili</FeatureItem>
                    <FeatureItem>Contratti attivi</FeatureItem>
                    <FeatureItem>Upload/download Excel modificato</FeatureItem>
                  </>
                )}
              </PlanFeatures>
              
              {/* Descrizione del piano */}
              <div style={{ 
                marginTop: '1rem', 
                padding: '0.8rem', 
                background: '#f8f9fa', 
                borderRadius: '6px',
                fontSize: '0.9rem',
                color: '#666',
                textAlign: 'center'
              }}>
                {plan.name === 'silver' && '🎯 Ideale per mini-leghe tra amici'}
                {plan.name === 'gold' && '🎯 Perfetto per chi vuole qualcosa di più serio'}
                {plan.name === 'elite' && '🎯 Per admin esperti e community grandi'}
                {plan.name === 'diamond' && '💎 Piano Premium - Illimitato'}
              </div>
              
              <PlanButton onClick={() => handlePlanPurchase(plan.id)}>
                Acquista {plan.display_name}
              </PlanButton>
            </PlanCard>
          );
        })}
        </PlansGrid>
      </PlansSection>

      {/* Sezione Referral Sotto i Piani */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '1.5rem', 
        borderRadius: '8px', 
        marginBottom: '2rem',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#495057' }}>Sistema Referral</h3>
        
        {/* Verifica Codice Referral */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '0.5rem', color: '#333', fontSize: '1rem' }}>Verifica Codice Referral</h4>
          <p style={{ marginBottom: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
            Hai un codice referral di un amico? Inseriscilo qui per ottenere il 25% di sconto!
          </p>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Inserisci codice referral"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                flex: 1,
                fontSize: '0.9rem'
              }}
            />
            <button
              onClick={verifyReferralCode}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Verifica
            </button>
          </div>
          
          {referralValid && (
            referralValid.valid ? (
              <div style={{ marginTop: '0.5rem', color: '#28a745', fontSize: '0.9rem' }}>
                {referralValid.message}
                <div style={{ marginTop: '0.25rem' }}>
                  Sconto del {referralValid.discount}% applicabile! Referral di: {referralValid.referrer}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '0.5rem', color: '#dc3545', fontSize: '0.9rem' }}>
                {referralValid.message}
              </div>
            )
          )}
        </div>

        {/* Il Mio Codice Referral */}
        {token && (
          <div>
            <h4 style={{ marginBottom: '0.5rem', color: '#333', fontSize: '1rem' }}>Il Mio Codice Referral</h4>
            <p style={{ marginBottom: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
              Condividi il tuo codice con gli amici e ottieni sconti quando si registrano!
            </p>
            
            {myReferralCode?.hasCode ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{
                  padding: '0.5rem',
                  backgroundColor: '#e9ecef',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem'
                }}>
                  {myReferralCode.code}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(myReferralCode.code);
                    alert('Codice copiato negli appunti!');
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Copia
                </button>
              </div>
            ) : (
              <button
                onClick={generateMyReferralCode}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  marginBottom: '0.5rem'
                }}
              >
                Genera Codice Referral
              </button>
            )}
            
            <div style={{ fontSize: '0.8rem', color: '#666' }}>
              <strong>Come funziona:</strong>
              <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.5rem' }}>
                <li>Condividi il tuo codice con un amico</li>
                <li>Il tuo amico si registra e usa il codice</li>
                <li>Entrambi ottenete il 25% di sconto sul prossimo acquisto!</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <AddonsSection>
        <AddonsTitle>Add-on Opzionali</AddonsTitle>
        <Subtitle>
          Potenzia il tuo piano con funzionalità aggiuntive acquistabili anche dopo la creazione della lega
        </Subtitle>
        
        <div style={{ 
          background: '#e3f2fd', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '2rem',
          border: '1px solid #2196f3'
        }}>
          <p style={{ margin: 0, color: '#1976d2', fontSize: '0.9rem' }}>
            <strong>💡 Suggerimento:</strong> Gli add-on possono essere acquistati in qualsiasi momento, anche dopo aver creato la lega. 
            Sono validi per la stagione corrente e si possono combinare tra loro.
          </p>
        </div>

        <AddonsGrid>
          {addons.map((addon) => {
            // Mappa delle icone per add-on
            const addonIcons = {
              'scraping': '🔍',
              'cantera': '🧬',
              'contratti': '⚖️',
              'excel_multiplo': '📂',
              'triggers': '🎯',
              'roster_ab': '🔄'
            };
            
            return (
              <AddonCard key={addon.id}>
                <AddonName>
                  {addonIcons[addon.name] || '📦'} {addon.display_name}
                </AddonName>
                <AddonPrice>€{addon.price}</AddonPrice>
                <AddonDescription>{addon.description}</AddonDescription>
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: '#666', 
                  marginBottom: '1rem',
                  fontStyle: 'italic'
                }}>
                  {addon.duration === 'season' ? 'Valido per la stagione' : 'Permanente'}
                </div>
                <AddonButton onClick={() => handleAddonPurchase(addon.id)}>
                  Acquista Add-on
                </AddonButton>
              </AddonCard>
            );
          })}
        </AddonsGrid>
      </AddonsSection>

      {/* Banner AdSense - Fine Pagina */}
      <div style={{ 
        margin: '2rem 0', 
        padding: '1rem', 
        background: '#f8f9fa', 
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <ins className="adsbygoogle"
             style={{display: 'block'}}
             data-ad-format="autorelaxed"
             data-ad-client="ca-pub-7020083324789333"
             data-ad-slot="2495642063">
        </ins>
      </div>
    </Container>
  );
};

export default Piani; 