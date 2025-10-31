let priceChart;
let chartData = {
  labels: [],
  datasets: [{ label: 'Equity', data: [] }]
};

async function fetchData() {
  const url = CONFIG.GOOGLE_SCRIPT_URL;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    updateUI(data);
    document.getElementById('status').textContent = '✅ Web sync OK';
  } catch (err) {
    console.error('Fetch error:', err);
    document.getElementById('status').textContent = '⚠ Fetch error: ' + err.message;
  }
}

function updateUI(data) {
  if (!data) return;

  document.getElementById('balance').textContent = data.balance ?? '—';
  document.getElementById('equity').textContent = data.equity ?? '—';
  document.getElementById('floatingPL').textContent = data.floatingPL ?? '—';
  document.getElementById('dailyTrades').textContent = data.dailyTrades ?? '—';
  document.getElementById('winRate').textContent = data.winRate ?? '—';
  document.getElementById('dailyPL').textContent = data.dailyPL ?? '—';
  document.getElementById('statusEA').textContent = data.status ?? '—';
  document.getElementById('lastTrade').textContent =
    data.lastTrade ? `${data.lastTrade.direction} (${data.lastTrade.profit})` : '—';

  // Chart update (based on Sheet2/Sheet3 history)
  if (Array.isArray(data.history)) {
    chartData.labels = data.history.map(h => new Date(h.t).toLocaleTimeString());
    chartData.datasets[0].data = data.history.map(h => h.price);
    priceChart.update();
  }

  // Activity log
  const act = document.getElementById('activity');
  act.innerHTML = '';
  (data.activity || []).slice().reverse().forEach(msg => {
    const li = document.createElement('li');
    li.textContent = msg;
    act.appendChild(li);
  });

  // Recent trades table (Sheet2)
  const tableBody = document.querySelector('#tradesTable tbody');
  tableBody.innerHTML = '';
  (data.trades || []).slice(-10).reverse().forEach(trade => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${trade['Trade ID'] ?? ''}</td>
      <td>${trade['Type (BUY/SELL)'] ?? ''}</td>
      <td>${trade['Open Time'] ?? ''}</td>
      <td>${trade['Close Time'] ?? ''}</td>
      <td>${trade['Profit'] ?? ''}</td>
      <td>${trade['Lots'] ?? ''}</td>
      <td>${trade['Duration (seconds)'] ?? ''}</td>
    `;
    tableBody.appendChild(row);
  });
}

function initChart() {
  const ctx = document.getElementById('priceChart').getContext('2d');
  priceChart = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      animation: false,
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { x: { display: true }, y: { display: true } }
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initChart();
  fetchData();
  setInterval(fetchData, CONFIG.UPDATE_INTERVAL_MS || 5000);
});
