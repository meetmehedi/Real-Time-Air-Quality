// Configuration and Initial State
let currentAqi = 142;
let chartInstance = null;
const aqiDataHistory = Array.from({length: 24}, () => Math.floor(Math.random() * 50) + 100);
const labelsHistory = Array.from({length: 24}, (_, i) => {
    const d = new Date();
    d.setHours(d.getHours() - (23 - i));
    return `${d.getHours()}:00`;
});

// Update the real-time clock
function updateClock() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// Define AQI categories and their visual properties
function getAqiCategory(aqi) {
    if (aqi <= 50) return { label: 'Good', desc: 'Air quality is satisfactory, and air pollution poses little or no risk.', colorClass: 'good' };
    if (aqi <= 100) return { label: 'Moderate', desc: 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.', colorClass: 'moderate' };
    if (aqi <= 150) return { label: 'Unhealthy for Sensitive Groups', desc: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.', colorClass: 'unhealthy-sg' };
    if (aqi <= 200) return { label: 'Unhealthy', desc: 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.', colorClass: 'unhealthy' };
    if (aqi <= 300) return { label: 'Very Unhealthy', desc: 'Health alert: The risk of health effects is increased for everyone.', colorClass: 'very-unhealthy' };
    return { label: 'Hazardous', desc: 'Health warning of emergency conditions: everyone is more likely to be affected.', colorClass: 'hazardous' };
}

// Map a specific pollutant value to a category (Simplified mappings for demo purposes)
function getPollutantStatus(name, value) {
    let status = 'good';
    switch (name) {
        case 'PM2.5': status = value < 12 ? 'good' : value < 35.4 ? 'moderate' : value < 55.4 ? 'unhealthy-sg' : value < 150 ? 'unhealthy' : 'hazardous'; break;
        case 'PM10': status = value < 54 ? 'good' : value < 154 ? 'moderate' : value < 254 ? 'unhealthy-sg' : 'unhealthy'; break;
        case 'NO2': status = value < 53 ? 'good' : value < 100 ? 'moderate' : value < 360 ? 'unhealthy' : 'hazardous'; break;
        default: status = 'good';
    }
    return status;
}

// Update the Main UI elements
function updateDashboard(data) {
    // Update Main AQI
    const aqiElement = document.getElementById('current-aqi');
    aqiElement.textContent = data.aqi;
    
    // Update Ring Stroke
    const ring = document.getElementById('aqi-ring');
    const radius = ring.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    const percent = Math.min(data.aqi / 300, 1); // Normalize up to 300 for display
    const offset = circumference - (percent * circumference);
    ring.style.strokeDashoffset = offset;

    // Update Status Text and Description
    const category = getAqiCategory(data.aqi);
    document.getElementById('aqi-status-text').textContent = category.label;
    document.getElementById('aqi-status-desc').textContent = category.desc;

    // Update Colors based on category
    const mainCard = document.getElementById('main-aqi-card');
    
    // Clear old classes
    ['good', 'moderate', 'unhealthy-sg', 'unhealthy', 'very-unhealthy', 'hazardous'].forEach(cls => {
        document.getElementById('aqi-status-text').classList.remove(`status-${cls}`);
        ring.classList.remove(`status-${cls}`);
    });
    
    document.getElementById('aqi-status-text').classList.add(`status-${category.colorClass}`);
    ring.classList.add(`status-${category.colorClass}`);

    // Update Weather
    document.getElementById('temp-val').textContent = `${(data.temp).toFixed(1)}°C`;
    document.getElementById('humid-val').textContent = `${Math.round(data.humidity)}%`;

    // Update Pollutants
    updatePollutantCard('pm25', 'PM2.5', data.pm25, 'µg/m³', 150);
    updatePollutantCard('pm10', 'PM10', data.pm10, 'µg/m³', 300);
    updatePollutantCard('no2', 'NO2', data.no2, 'ppb', 150);
    updatePollutantCard('o3', 'O3', data.o3, 'ppb', 100);
    updatePollutantCard('co', 'CO', data.co, 'ppm', 10);
    updatePollutantCard('so2', 'SO2', data.so2, 'ppb', 75);
}

function updatePollutantCard(idPrefix, name, value, unit, maxScale) {
    document.getElementById(`${idPrefix}-val`).textContent = value.toFixed(1);
    const card = document.getElementById(`${idPrefix}-val`).closest('.p-card');
    const statusSpan = card.querySelector('.p-status');
    const barFill = card.querySelector('.p-fill');
    
    const status = getPollutantStatus(name, value);
    
    // Update textual status
    statusSpan.textContent = status.replace('-sg', '').toUpperCase();
    statusSpan.className = `p-status status-${status}-bg`;
    
    // Update progress bar
    const percentage = Math.min((value / maxScale) * 100, 100);
    barFill.style.width = `${percentage}%`;
    barFill.className = `p-fill bg-fill-${status}`;
}

// Initialize Chart.js graph
function initChart() {
    const ctx = document.getElementById('aqiChart').getContext('2d');
    
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');   
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labelsHistory,
            datasets: [{
                label: 'AQI',
                data: aqiDataHistory,
                borderColor: '#3b82f6',
                borderWidth: 3,
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#0f172a',
                pointBorderColor: '#3b82f6',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleFont: { family: 'Outfit', size: 14 },
                    bodyFont: { family: 'Inter', size: 13 },
                    padding: 12,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                    ticks: { maxTicksLimit: 8 }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                    beginAtZero: true,
                    suggestedMax: 200
                }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
        }
    });
}

function appendToChart(newAqi) {
    if (!chartInstance) return;
    
    // Add new data
    const d = new Date();
    const timeLabel = `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
    
    chartInstance.data.labels.push(timeLabel);
    chartInstance.data.datasets[0].data.push(newAqi);
    
    // Remove oldest data to keep array length constant
    if(chartInstance.data.labels.length > 24) {
        chartInstance.data.labels.shift();
        chartInstance.data.datasets[0].data.shift();
    }
    
    chartInstance.update();
}


// Simulation Loop to update data every 5 seconds
function simulateData() {
    // Generate slight random variations
    const fluctuation = (Math.random() - 0.5) * 10;
    currentAqi = Math.max(0, Math.min(500, currentAqi + fluctuation));
    
    const simulatedData = {
        aqi: Math.round(currentAqi),
        temp: 28 + (Math.random() - 0.5) * 2,
        humidity: 65 + (Math.random() - 0.5) * 5,
        pm25: (currentAqi * 0.35) + (Math.random() * 5),
        pm10: (currentAqi * 0.6) + (Math.random() * 8),
        no2: 12 + (Math.random() * 10),
        o3: 25 + (Math.random() * 15),
        co: 0.3 + (Math.random() * 0.5),
        so2: 2 + (Math.random() * 3)
    };

    updateDashboard(simulatedData);
    
    // Update chart randomly every few ticks for visual effect
    if(Math.random() > 0.5) {
        appendToChart(simulatedData.aqi);
    }
}

// Search Functionality
function handleSearch() {
    const input = document.getElementById('location-input');
    const city = input.value.trim();
    if (!city) return;
    
    // Simulate loading a new city's data
    // Randomize the new AQI base between 20 and 250
    currentAqi = Math.floor(Math.random() * 230) + 20;
    
    // Clear and reset chart history slightly based on new AQI
    for (let i = 0; i < chartInstance.data.datasets[0].data.length; i++) {
        chartInstance.data.datasets[0].data[i] = Math.max(0, currentAqi + (Math.random() - 0.5) * 40);
    }
    chartInstance.update();
    
    // Trigger an immediate update
    simulateData();
    
    // Visual feedback
    input.blur();
    const btnIcon = document.querySelector('#search-btn i');
    btnIcon.className = 'ph ph-check';
    setTimeout(() => {
        btnIcon.className = 'ph ph-magnifying-glass';
    }, 1500);
}

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    // Do initial update
    simulateData();
    // Set interval for simulated live updates
    setInterval(simulateData, 4000);
    
    // Search listeners
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('location-input');
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', handleSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
    }
});
