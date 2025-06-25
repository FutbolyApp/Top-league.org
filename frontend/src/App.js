import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import { NotificationProvider } from './components/NotificationSystem';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Leghe from './pages/Leghe';
import CreaLega from './pages/CreaLega';
import UniscitiLega from './pages/UniscitiLega';
import DettaglioLega from './pages/DettaglioLega';
import DettaglioSquadra from './pages/DettaglioSquadra';
import ModificaSquadra from './pages/ModificaSquadra';
import ModificaLega from './pages/ModificaLega';
import GestioneSquadreLega from './pages/GestioneSquadreLega';
import ModificaSquadraCompleta from './pages/ModificaSquadraCompleta';
import ModificaGiocatoreCompleta from './pages/ModificaGiocatoreCompleta';
import CreaGiocatore from './pages/CreaGiocatore';
import DettaglioGiocatore from './pages/DettaglioGiocatore';
import AreaAdmin from './pages/AreaAdmin';
import AreaManager from './pages/AreaManager';
import SuperAdminAccess from './pages/SuperAdminAccess';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import DashboardAvanzata from './pages/DashboardAvanzata';
import ProponiOfferta from './pages/ProponiOfferta';
import ScrapingManager from './pages/ScrapingManager';
import GestioneCredenziali from './pages/GestioneCredenziali';
import TorneiManager from './pages/TorneiManager';
import PagaContratti from './pages/PagaContratti';
import './index.css';

function AppRoutes() {
  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/leghe" element={<ProtectedRoute><Leghe /></ProtectedRoute>} />
        <Route path="/area-admin" element={<ProtectedRoute><AreaAdmin /></ProtectedRoute>} />
        <Route path="/area-admin/:legaId" element={<ProtectedRoute><AreaAdmin /></ProtectedRoute>} />
        <Route path="/area-manager" element={<ProtectedRoute><AreaManager /></ProtectedRoute>} />
        <Route path="/proponi-offerta" element={<ProtectedRoute><ProponiOfferta /></ProtectedRoute>} />
        <Route path="/unisciti-lega" element={<ProtectedRoute><UniscitiLega /></ProtectedRoute>} />
        <Route path="/lega/:id" element={<ProtectedRoute><DettaglioLega /></ProtectedRoute>} />
        <Route path="/squadra/:id" element={<ProtectedRoute><DettaglioSquadra /></ProtectedRoute>} />
        <Route path="/modifica-squadra/:id" element={<ProtectedRoute><ModificaSquadra /></ProtectedRoute>} />
        <Route path="/giocatore/:id" element={<ProtectedRoute><DettaglioGiocatore /></ProtectedRoute>} />
        <Route path="/crea-lega" element={<ProtectedRoute><CreaLega /></ProtectedRoute>} />
        <Route path="/tornei/:legaId" element={<ProtectedRoute><TorneiManager /></ProtectedRoute>} />
        <Route path="/paga-contratti" element={<ProtectedRoute><PagaContratti /></ProtectedRoute>} />
        <Route path="/scraping" element={<ProtectedRoute><ScrapingManager /></ProtectedRoute>} />
        <Route path="/scraping-manager/:legaId" element={<ProtectedRoute><ScrapingManager /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/super-admin-access" element={<ProtectedRoute><SuperAdminAccess /></ProtectedRoute>} />
        <Route path="/super-admin-dashboard" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
        <Route path="/dashboard-avanzata" element={<ProtectedRoute><DashboardAvanzata /></ProtectedRoute>} />
        <Route path="/super-admin/lega/:id/edit" element={<ProtectedRoute><ModificaLega /></ProtectedRoute>} />
        <Route path="/gestione-squadre-lega/:id" element={<ProtectedRoute><GestioneSquadreLega /></ProtectedRoute>} />
        <Route path="/modifica-squadra-completa/:id" element={<ProtectedRoute><ModificaSquadraCompleta /></ProtectedRoute>} />
        <Route path="/modifica-giocatore-completa/:id" element={<ProtectedRoute><ModificaGiocatoreCompleta /></ProtectedRoute>} />
        <Route path="/crea-giocatore" element={<ProtectedRoute><CreaGiocatore /></ProtectedRoute>} />
        <Route path="/gestione-credenziali/:legaId" element={<ProtectedRoute><GestioneCredenziali /></ProtectedRoute>} />
        <Route path="*" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppRoutes />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
