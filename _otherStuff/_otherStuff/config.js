// Configurazione per il Playwright Scraper
module.exports = {
    // Credenziali Fantacalcio (sostituisci con le tue)
    credentials: {
        username: process.env.FANTACALCIO_USERNAME || 'TUA_EMAIL',
        password: process.env.FANTACALCIO_PASSWORD || 'TUA_PASSWORD'
    },
    
    // URL di test
    urls: {
        login: 'https://www.fantacalcio.it/login',
        home: 'https://www.fantacalcio.it',
        leghe: 'https://leghe.fantacalcio.it/topleague'
    },
    
    // Impostazioni scraper
    scraper: {
        headless: false, // true per produzione
        timeout: 30000,
        maxLoginAttempts: 3,
        screenshotOnError: true
    },
    
    // Selettori per Fantacalcio
    selectors: {
        login: {
            username: '#username, input[name="username"], input[type="email"], input[name="email"]',
            password: '#password, input[name="password"], input[type="password"]',
            submit: 'button[type="submit"], input[type="submit"], .login-button, .btn-login'
        },
        cookie: {
            accept: [
                '#onetrust-accept-btn-handler',
                '#onetrust-reject-all-handler',
                '.onetrust-accept-btn-handler',
                '.onetrust-reject-all-handler'
            ]
        }
    }
}; 