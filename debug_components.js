// Script per diagnosticare il problema dei componenti React
console.log('🔍 DEBUG SCRIPT: Starting component diagnosis');

// Verifica se React è caricato
if (typeof React !== 'undefined') {
    console.log('✅ React is loaded');
} else {
    console.log('❌ React is NOT loaded');
}

// Verifica se ReactDOM è caricato
if (typeof ReactDOM !== 'undefined') {
    console.log('✅ ReactDOM is loaded');
} else {
    console.log('❌ ReactDOM is NOT loaded');
}

// Verifica se styled-components è caricato
if (typeof styled !== 'undefined') {
    console.log('✅ styled-components is loaded');
} else {
    console.log('❌ styled-components is NOT loaded');
}

// Verifica se react-router-dom è caricato
if (typeof useNavigate !== 'undefined') {
    console.log('✅ react-router-dom is loaded');
} else {
    console.log('❌ react-router-dom is NOT loaded');
}

// Verifica se il DOM è pronto
if (document.readyState === 'complete') {
    console.log('✅ DOM is ready');
} else {
    console.log('❌ DOM is not ready, state:', document.readyState);
}

// Verifica se ci sono errori JavaScript
window.addEventListener('error', function(e) {
    console.error('🔍 DEBUG SCRIPT: JavaScript error caught:', e.error);
    console.error('🔍 DEBUG SCRIPT: Error message:', e.message);
    console.error('🔍 DEBUG SCRIPT: Error filename:', e.filename);
    console.error('🔍 DEBUG SCRIPT: Error line:', e.lineno);
    console.error('🔍 DEBUG SCRIPT: Error column:', e.colno);
});

// Verifica se ci sono errori di caricamento risorse
window.addEventListener('load', function() {
    console.log('🔍 DEBUG SCRIPT: Window loaded');
    
    // Verifica se il root element esiste
    const rootElement = document.getElementById('root');
    if (rootElement) {
        console.log('✅ Root element found');
        console.log('🔍 Root element children:', rootElement.children.length);
    } else {
        console.log('❌ Root element NOT found');
    }
});

console.log('🔍 DEBUG SCRIPT: Diagnosis complete'); 