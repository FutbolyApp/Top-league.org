import jwt from 'jsonwebtoken';

function getJwtSecret() {
  return process.env.JWT_SECRET || 'topleague_secret';
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token mancante' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token non fornito' });
  try {
    const JWT_SECRET = getJwtSecret();
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    console.error('JWT verification error:', e.message);
    console.error('JWT_SECRET used:', getJwtSecret() ? 'set' : 'not set');
    return res.status(401).json({ error: 'Token non valido' });
  }
}

export function requireSuperAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token mancante' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token non fornito' });
  try {
    const JWT_SECRET = getJwtSecret();
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
    console.error('JWT verification error in requireSuperAdmin:', e.message);
    console.error('JWT_SECRET used:', getJwtSecret() ? 'set' : 'not set');
    return res.status(401).json({ error: 'Token non valido' });
  }
}

export function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token mancante' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token non fornito' });
  try {
    const JWT_SECRET = getJwtSecret();
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.ruolo !== 'admin' && payload.ruolo !== 'superadmin' && payload.ruolo !== 'SuperAdmin') {
      return res.status(403).json({ error: 'Accesso negato: richiesto Admin o SuperAdmin' });
    }
    req.user = payload;
    next();
  } catch (e) {
    console.error('JWT verification error in requireAdmin:', e.message);
    console.error('JWT_SECRET used:', getJwtSecret() ? 'set' : 'not set');
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
    const JWT_SECRET = getJwtSecret();
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    console.error('JWT verification error in authenticateToken:', error.message);
    console.error('JWT_SECRET used:', getJwtSecret() ? 'set' : 'not set');
    return res.status(403).json({ message: 'Token non valido' });
  }
}

export function generateToken(user) {
  const JWT_SECRET = getJwtSecret();
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      ruolo: user.ruolo 
    }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
} 

export function requireLegaAdminOrSuperAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token mancante' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token non fornito' });
  try {
    const JWT_SECRET = getJwtSecret();
    const payload = jwt.verify(token, JWT_SECRET);
    console.log('requireLegaAdminOrSuperAdmin - Payload JWT:', payload);
    console.log('requireLegaAdminOrSuperAdmin - Ruolo nel payload:', payload.ruolo);
    
    // Permette accesso a superadmin o admin di lega
    if (payload.ruolo !== 'superadmin' && payload.ruolo !== 'SuperAdmin' && payload.ruolo !== 'admin') {
      console.log('requireLegaAdminOrSuperAdmin - Accesso negato: ruolo non valido');
      return res.status(403).json({ error: 'Accesso negato: richiesto Admin o SuperAdmin' });
    }
    console.log('requireLegaAdminOrSuperAdmin - Accesso autorizzato');
    req.user = payload;
    next();
  } catch (e) {
    console.error('JWT verification error in requireLegaAdminOrSuperAdmin:', e.message);
    console.error('JWT_SECRET used:', getJwtSecret() ? 'set' : 'not set');
    return res.status(401).json({ error: 'Token non valido' });
  }
}

export function requireSubadminOrAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token mancante' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token non fornito' });
  try {
    const JWT_SECRET = getJwtSecret();
    const payload = jwt.verify(token, JWT_SECRET);
    console.log('requireSubadminOrAdmin - Payload JWT:', payload);
    console.log('requireSubadminOrAdmin - Ruolo nel payload:', payload.ruolo);
    
    // Permette accesso a superadmin, admin o subadmin
    if (payload.ruolo !== 'superadmin' && payload.ruolo !== 'SuperAdmin' && payload.ruolo !== 'admin' && payload.ruolo !== 'subadmin') {
      console.log('requireSubadminOrAdmin - Accesso negato: ruolo non valido');
      return res.status(403).json({ error: 'Accesso negato: richiesto Subadmin, Admin o SuperAdmin' });
    }
    console.log('requireSubadminOrAdmin - Accesso autorizzato');
    req.user = payload;
    next();
  } catch (e) {
    console.error('JWT verification error in requireSubadminOrAdmin:', e.message);
    console.error('JWT_SECRET used:', getJwtSecret() ? 'set' : 'not set');
    return res.status(401).json({ error: 'Token non valido' });
  }
} 