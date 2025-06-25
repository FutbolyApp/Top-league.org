import jwt from 'jsonwebtoken';

const JWT_SECRET = 'topleague_secret'; // In produzione usare env

export function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token mancante' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token non fornito' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token non valido' });
  }
}

export function requireSuperAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token mancante' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token non fornito' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    console.log('requireSuperAdmin - Payload JWT:', payload);
    console.log('requireSuperAdmin - Ruolo nel payload:', payload.ruolo);
    console.log('requireSuperAdmin - Confronto con superadmin:', payload.ruolo === 'superadmin' || payload.ruolo === 'SuperAdmin');
    
    if (payload.ruolo !== 'superadmin' && payload.ruolo !== 'SuperAdmin') {
      console.log('requireSuperAdmin - Accesso negato: ruolo non valido');
      return res.status(403).json({ error: 'Accesso negato: richiesto SuperAdmin' });
    }
    console.log('requireSuperAdmin - Accesso autorizzato');
    req.user = payload;
    next();
  } catch (e) {
    console.log('requireSuperAdmin - Errore verifica token:', e.message);
    return res.status(401).json({ error: 'Token non valido' });
  }
}

export function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token mancante' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token non fornito' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.ruolo !== 'admin' && payload.ruolo !== 'superadmin') {
      return res.status(403).json({ error: 'Accesso negato: richiesto Admin o SuperAdmin' });
    }
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token non valido' });
  }
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token di accesso richiesto' });
  }
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token non valido' });
  }
}

export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      ruolo: user.ruolo 
    }, 
    JWT_SECRET, 
    { expiresIn: '24h' }
  );
} 