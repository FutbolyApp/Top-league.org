// Comprehensive Express error handling middleware with detailed logging
import { getDb } from '../db/mariadb.js';

// Enhanced error handler middleware
export const errorHandler = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const requestId = req.headers['x-request-id'] || Math.random().toString(36).substr(2, 9);
  
  // Enhanced error logging with context
  console.error('🚨 EXPRESS ERROR HANDLER:', {
    requestId,
    timestamp,
    method: req.method,
    url: req.url,
    endpoint: req.path,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id || 'anonymous',
    error: {
      message: err.message,
      name: err.name,
      stack: err.stack,
      status: err.status || 500
    },
    requestBody: req.body,
    requestHeaders: {
      authorization: req.headers.authorization ? 'present' : 'missing',
      'content-type': req.headers['content-type'],
      'x-frontend-version': req.headers['x-frontend-version']
    }
  });

  // Enhanced error response based on error type
  let statusCode = err.status || 500;
  let errorMessage = err.message || 'Errore interno del server';
  let errorDetails = null;

  // Handle specific error types
  switch (err.name) {
    case 'ValidationError':
      statusCode = 400;
      errorMessage = 'Dati di input non validi';
      errorDetails = err.details;
      break;
      
    case 'UnauthorizedError':
    case 'JsonWebTokenError':
    case 'TokenExpiredError':
      statusCode = 401;
      errorMessage = 'Token non valido o scaduto';
      break;
      
    case 'ForbiddenError':
      statusCode = 403;
      errorMessage = 'Accesso negato';
      break;
      
    case 'NotFoundError':
      statusCode = 404;
      errorMessage = 'Risorsa non trovata';
      break;
      
    case 'DatabaseError':
      statusCode = 503;
      errorMessage = 'Errore del database';
      errorDetails = {
        code: err.code,
        sqlMessage: err.sqlMessage
      };
      break;
      
    case 'NetworkError':
      statusCode = 503;
      errorMessage = 'Servizio non disponibile';
      break;
      
    default:
      // Handle MySQL/MariaDB specific errors
      if (err.code) {
        switch (err.code) {
          case 'ER_DUP_ENTRY':
            statusCode = 409;
            errorMessage = 'Risorsa già esistente';
            break;
          case 'ER_NO_REFERENCED_ROW_2':
            statusCode = 400;
            errorMessage = 'Riferimento non valido';
            break;
          case 'ER_BAD_FIELD_ERROR':
            statusCode = 500;
            errorMessage = 'Errore del database';
            errorDetails = {
              field: err.sqlMessage?.match(/Unknown column '(.+)'/)?.[1],
              sql: err.sql
            };
            break;
          default:
            statusCode = 500;
            errorMessage = 'Errore del database';
        }
      }
  }

  // Enhanced error response structure
  const errorResponse = {
    error: errorMessage,
    status: statusCode,
    timestamp,
    requestId,
    endpoint: req.path,
    method: req.method
  };

  // Add details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = errorDetails || err.message;
    errorResponse.stack = err.stack;
  }

  // Log database connection status
  const db = getDb();
  if (!db) {
    console.error('🚨 DATABASE NOT AVAILABLE in error handler');
    errorResponse.error = 'Database non disponibile';
    statusCode = 503;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// Enhanced async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Enhanced validation error handler
export const validationErrorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    console.error('🚨 VALIDATION ERROR:', {
      endpoint: req.path,
      method: req.method,
      errors: err.details,
      body: req.body
    });
    
    return res.status(400).json({
      error: 'Dati di input non validi',
      details: err.details,
      status: 400,
      timestamp: new Date().toISOString()
    });
  }
  next(err);
};

// Enhanced database error handler
export const databaseErrorHandler = (err, req, res, next) => {
  if (err.code && err.code.startsWith('ER_')) {
    console.error('🚨 DATABASE ERROR:', {
      endpoint: req.path,
      method: req.method,
      code: err.code,
      sqlMessage: err.sqlMessage,
      sql: err.sql
    });
    
    return res.status(500).json({
      error: 'Errore del database',
      status: 500,
      timestamp: new Date().toISOString()
    });
  }
  next(err);
};

// Enhanced 404 handler
export const notFoundHandler = (req, res, next) => {
  console.log('🔍 404 NOT FOUND:', {
    method: req.method,
    url: req.url,
    endpoint: req.path,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress
  });
  
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    status: 404,
    timestamp: new Date().toISOString()
  });
}; 