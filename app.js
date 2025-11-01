// Gold HyperFlow Scalper - Live Dashboard JavaScript
let tradesChart = null;
let pieChart = null;
let updateInterval = null;
let lastUpdateTime = null;

// Debug logger
function debug(message, data = null) {
    if (CONFIG.DEBUG_MODE) {
        console.log(`[GHFS Dashboard] ${message}`, data || '');
    }
}

// Format currency
function formatCurrency(value) {
    const num = parseFloat(value) || 0;
    return '$' + num.toFixed(2);
}

// Format percentage
function formatPercent(value) {
    const num = parseFloat(value) || 0;
    return num.toFixed(1) + '%';
}

// Format date
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    } catch (e) {
        return dateString;
    }
}

// Format duration
function formatDuration(seconds) {
    const sec = parseInt(seconds) || 0;
    const minutes = Math.floor(sec / 60);
    const remainingSeconds = sec % 60;
    return `${minutes}m ${remainingSeconds}s`;
}

// Update connection status
function updateConnectionStatus(connected) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('connectionStatus');
    
    if (connected) {
        statusDot.classList.remove('disconnected');
        statusText.textContent = 'Connected';
    } else {
        statusDot.classList.add('disconnected');
        statusText.textContent = 'Disconnected';
    }
}

// Fetch data from Google Apps Script
async function fetchData(action) {
    try {
        const url = `${CONFIG.GOOGLE_SCRIPT_URL}?action=${action}`;
        debug(`Fetching ${action}...`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        debug(`${action} response:`, data);
        
        if (data.status === 'success') {
            return data.data;
        } else {
            throw new Error(data.message || 'Unknown error');
        }
    } catch (error) {
        console.error(`Error fetching ${action}:`, error);
        return null;
    }
}

// Update live statistics
async function updateLiveStats() {
    const stats = await fetchData('getLiveStats');
    
    if (!stats) {
        updateConnectionStatus(false);
        return;
    }
    
    updateConnectionStatus(true);
    
    // Update all stat cards
    document.getElementById('balance').textContent = formatCurrency(stats.Balance);
    document.getElementById('equity').textContent = formatCurrency(stats.Equity);
    
    const floatingPL = parseFloat(stats['Floating P/L']) || 0;
    const floatingEl = document.getElementById('floatingPL');
    floatingEl.textContent = formatCurrency(floatingPL);
    floatingEl.className = 'stat-value ' + (floatingPL >= 0 ? 'positive' : 'negative');
    
    document.getElementById('dailyTrades').textContent = stats['Daily Trades'] || '0';
    document.getElementById('wins').textContent = stats['Daily Wins'] || '0';
    document.getElementById('losses').textContent = stats['Daily Losses'] || '0';
    document.getElementById('winRate').textContent = formatPercent(stats['Win Rate']);
    
    const dailyPL = parseFloat(stats['Daily P/L']) || 0;
    const dailyPLEl = document.getElementById('dailyPL');
    dailyPLEl.textContent = formatCurrency(dailyPL);
    dailyPLEl.className = 'stat-value ' + (dailyPL >= 0 ? 'positive' : 'negative');
    
    document.getElementById('consecLosses').textContent = stats['Consecutive Losses'] || '0';
    document.getElementById('openPositions').textContent = stats['Open Positions'] || '0';
    
    // Update EA status
    const statusEl = document.getElementById('eaStatus');
    const status = stats.Status || 'UNKNOWN';
    statusEl.textContent = status;
    statusEl.className = 'stat-value';
    
    if (status === 'MONITORING' || status === 'IN_POSITION') {
        statusEl.classList.add('positive');
    } else if (status === 'LOCKOUT' || status === 'LIMIT_REACHED') {
        statusEl.classList.add('negative');
    }
    
    // Update last trade
    const lastTradeDirection = stats['Last Trade Direction'] || 'NONE';
    const lastTradeProfit = parseFloat(stats['Last Trade Profit']) || 0;
    const lastTradeEl = document.getElementById('lastTrade');
    
    if (lastTradeDirection !== 'NONE') {
        lastTradeEl.textContent = `${lastTradeDirection} (${formatCurrency(lastTradeProfit)})`;
        lastTradeEl.className = 'stat-value ' + (lastTradeProfit >= 0 ? 'positive' : 'negative');
    } else {
        lastTradeEl.textContent = 'NONE';
        lastTradeEl.className = 'stat-value';
    }
    
    // Update last update time
    const now = new Date();
    document.getElementById('lastUpdate').textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    lastUpdateTime = now;
}

// Update trade history
async function updateTradeHistory() {
    const trades = await fetchData(`getTradeHistory&limit=${CONFIG.MAX_TRADES_DISPLAY}`);
    
    if (!trades || trades.length === 0) {
        document.getElementById('tradesTableBody').innerHTML = 
            '<tr><td colspan="9" class="no-data">No trades recorded yet</td></tr>';
        return;
    }
    
    let html = '';
    trades.forEach((trade, index) => {
        const profit = parseFloat(trade.Profit) || 0;
        const profitClass = profit >= 0 ? 'profit-positive' : 'profit-negative';
        const profitSymbol = profit >= 0 ? '+' : '';
        
        html += `<tr>
            <td>${index + 1}</td>
            <td><span class="type-${trade.Type}">${trade.Type}</span></td>
            <td>${formatDate(trade['Open Time'])}</td>
            <td>${formatDate(trade['Close Time'])}</td>
            <td>${parseFloat(trade['Open Price']).toFixed(5)}</td>
            <td>${parseFloat(trade['Close Price']).toFixed(5)}</td>
            <td>${parseFloat(trade.Lots).toFixed(2)}</td>
            <td class="${profitClass}">${profitSymbol}${formatCurrency(profit)}</td>
            <td>${formatDuration(trade.Duration)}</td>
        </tr>`;
    });
    
    document.getElementById('tradesTableBody').innerHTML = html;
    
    // Update charts with trade data
    updateTradesChart(trades);
}

// Update daily reports
async function updateDailyReports() {
    const reports = await fetchData(`getDailyReports&days=${CONFIG.MAX_DAYS_DISPLAY}`);
    
    if (!reports || reports.length === 0) {
        document.getElementById('dailyReportsTableBody').innerHTML = 
            '<tr><td colspan="8" class="no-data">No daily reports available yet</td></tr>';
        return;
    }
    
    let html = '';
    reports.forEach(report => {
        const netPL = parseFloat(report['Net P/L']) || 0;
        const plClass = netPL >= 0 ? 'profit-positive' : 'profit-negative';
        const plSymbol = netPL >= 0 ? '+' : '';
        
        html += `<tr>
            <td>${new Date(report.Date).toLocaleDateString('en-US')}</td>
            <td>${report['Total Trades'] || 0}</td>
            <td class="profit-positive">${report.Wins || 0}</td>
            <td class="profit-negative">${report.Losses || 0}</td>
            <td>${formatPercent(report['Win Rate'])}</td>
            <td class="${plClass}">${plSymbol}${formatCurrency(netPL)}</td>
            <td class="profit-positive">${formatCurrency(report['Best Trade'])}</td>
            <td class="profit-negative">${formatCurrency(report['Worst Trade'])}</td>
        </tr>`;
    });
    
    document.getElementById('dailyReportsTableBody').innerHTML = html;
}

// Update trades chart
function updateTradesChart(trades) {
    if (!trades || trades.length === 0) return;
    
    const ctx = document.getElementById('tradesChart');
    if (!ctx) return;
    
    // Prepare data for chart (last 20 trades)
    const recentTrades = trades.slice(0, 20).reverse();
    const labels = recentTrades.map((trade, idx) => `T${idx + 1}`);
    const profits = recentTrades.map(trade => parseFloat(trade.Profit) || 0);
    const colors = profits.map(p => p >= 0 ? CONFIG.COLORS.success : CONFIG.COLORS.danger);
    
    // Destroy existing chart
    if (tradesChart) {
        tradesChart.destroy();
    }
    
    // Create new chart
    tradesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Profit/Loss ($)',
                data: profits,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#b0b7c3',
                        font: { size: 14, weight: '600' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(20, 25, 45, 0.95)',
                    titleColor: CONFIG.COLORS.primary,
                    bodyColor: '#fff',
                    borderColor: CONFIG.COLORS.primary,
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return 'P/L: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#8892a6',
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.05)'
                    }
                },
                x: {
                    ticks: {
                        color: '#8892a6'
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.05)'
                    }
                }
            }
        }
    });
    
    // Update pie chart
    updatePieChart(trades);
}

// Update pie chart
function updatePieChart(trades) {
    if (!trades || trades.length === 0) return;
    
    const ctx = document.getElementById('pieChart');
    if (!ctx) return;
    
    // Count wins and losses
    let wins = 0, losses = 0;
    trades.forEach(trade => {
        const profit = parseFloat(trade.Profit) || 0;
        if (profit > 0) wins++;
        else if (profit < 0) losses++;
    });
    
    // Destroy existing chart
    if (pieChart) {
        pieChart.destroy();
    }
    
    // Create new chart
    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [`Wins (${wins})`, `Losses (${losses})`],
            datasets: [{
                data: [wins, losses],
                backgroundColor: [
                    'rgba(74, 222, 128, 0.8)',
                    'rgba(248, 113, 113, 0.8)'
                ],
                borderColor: [
                    CONFIG.COLORS.success,
                    CONFIG.COLORS.danger
                ],
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#b0b7c3',
                        font: { size: 14, weight: '600' },
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(20, 25, 45, 0.95)',
                    titleColor: CONFIG.COLORS.primary,
                    bodyColor: '#fff',
                    borderColor: CONFIG.COLORS.primary,
                    borderWidth: 1,
                    padding: 12
                }
            }
        }
    });
}

// Update all data
async function updateAll() {
    debug('Updating all data...');
    await Promise.all([
        updateLiveStats(),
        updateTradeHistory(),
        updateDailyReports()
    ]);
    debug('All data updated');
}

// Initialize dashboard
function initDashboard() {
    debug('Initializing dashboard...');
    
    // Set Chart.js defaults
    Chart.defaults.color = '#b0b7c3';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.1)';
    Chart.defaults.font.family = "'Inter', sans-serif";
    
    // Initial update
    updateAll();
    
    // Set up auto-update
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    
    updateInterval = setInterval(() => {
        updateAll();
    }, CONFIG.UPDATE_INTERVAL);
    
    debug(`Auto-update enabled (${CONFIG.UPDATE_INTERVAL}ms interval)`);
}

// Start dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Gold HyperFlow Scalper Dashboard - Initializing...');
    console.log('Google Script URL:', CONFIG.GOOGLE_SCRIPT_URL);
    
    initDashboard();
    
    // Handle visibility change to pause/resume updates
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            debug('Page hidden - pausing updates');
            if (updateInterval) {
                clearInterval(updateInterval);
            }
        } else {
            debug('Page visible - resuming updates');
            initDashboard();
        }
    });
});

// Handle errors globally
window.addEventListener('error', function(event) {
    console.error('Dashboard error:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});
