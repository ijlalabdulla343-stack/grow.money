// Configuration for Gold HyperFlow Scalper Dashboard
const CONFIG = {
    // Your Google Apps Script Web App URL
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzg3g1vCoPqOswbuzXeeQi6gO3zoA2GwQp850SD8gaf-nGYpT_X1azjZUOB2LkaTmUq/exec',
    
    // Update interval in milliseconds (5000 = 5 seconds)
    UPDATE_INTERVAL: 5000,
    
    // Chart colors
    COLORS: {
        primary: '#667eea',
        secondary: '#764ba2',
        success: '#4ade80',
        danger: '#f87171',
        warning: '#fbbf24',
        info: '#60a5fa',
        background: 'rgba(102, 126, 234, 0.1)',
        border: 'rgba(102, 126, 234, 0.3)'
    },
    
    // Number of trades to display in history
    MAX_TRADES_DISPLAY: 50,
    
    // Number of days to show in daily reports
    MAX_DAYS_DISPLAY: 30,
    
    // Enable debug mode (logs to console)
    DEBUG_MODE: false
};
