// --- THINGSPEAK HARDWARE CONFIGURATION ---
const CHANNEL_ID = '3263535'; 
const READ_API_KEY = '2L5XBEJJ8WHEQXXX'; 
const TS_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}&results=1`;

// --- GLOBAL VARIABLES ---
let temp = 0, gas = 0, hum = 0, gyro = 0, speed = 0; 
const labels = Array(30).fill("");
let lastAlertTimes = { temp: 0, gas: 0, hum: 0, gyro: 0, speed: 0 };

// SMART RESET: Only clear alerts if the user clicks the browser Refresh button
window.onload = function() {
    const perfEntries = performance.getEntriesByType("navigation");
    const isRefresh = perfEntries.length > 0 && perfEntries[0].type === "reload";
    if (isRefresh) { 
        localStorage.removeItem("railAlerts"); 
        console.log("Alerts cleared due to Refresh.");
    }
};

// 1. Chart Creation Helper
function createChart(id, color) {
  return new Chart(document.getElementById(id), {
    type: "line",
    data: {
      labels,
      datasets: [{ data: [], borderColor: color, tension: 0.4, fill: false }]
    },
    options: { animation: false, scales: { x: { display:false }, y: { beginAtZero:false } } }
  });
}

const tempChart = createChart("tempChart", "#ef4444");
const gasChart  = createChart("gasChart", "#f59e0b");
const humChart  = createChart("humChart", "#22c55e");
const gyroChart = createChart("gyroChart", "#38bdf8");

function updateChartData(chart, value) {
  chart.data.datasets[0].data.push(value);
  if (chart.data.datasets[0].data.length > 30) chart.data.datasets[0].data.shift();
  chart.update();
}

// 2. Alert Logic with 30-Second Cooldown
function triggerAlert(sensorKey, type, message) {
    const now = Date.now();
    if (now - lastAlertTimes[sensorKey] < 30000) return; 
    lastAlertTimes[sensorKey] = now;

    const newAlert = {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
        type: type, message: message, status: "CRITICAL"
    };

    let alerts = JSON.parse(localStorage.getItem("railAlerts")) || [];
    alerts.unshift(newAlert); 
    if (alerts.length > 10) alerts.pop();
    localStorage.setItem("railAlerts", JSON.stringify(alerts));
}

// 3. FETCH REAL DATA FROM THINGSPEAK
async function fetchHardwareData() {
    try {
        const response = await fetch(TS_URL);
        const data = await response.json();
        const latest = data.feeds[0];

        // Mapped to your specific fields:
        temp  = parseFloat(latest.field1) || 0; 
        hum   = parseFloat(latest.field2) || 0; 
        gas   = parseFloat(latest.field3) || 0; 
        gyro  = parseFloat(latest.field4) || 0; 
        speed = parseFloat(latest.field6) || 0; // Speed in km/h

        updateDashboard();
    } catch (error) {
        console.error("ThingSpeak Connection Error:", error);
    }
}

// 4. UPDATE DASHBOARD UI
function updateDashboard() {
  // Speed Logic: Conversion km/h to m/s
  let speedMs = (speed * 5) / 18;
  const speedEl = document.getElementById("speedValue");
  if (speedEl) {
      speedEl.innerText = speedMs.toFixed(2) + " m/s";
      speedEl.style.color = speedMs > 27.78 ? "#ef4444" : "#22c55e"; 
  }
  if (speedMs > 27.78) triggerAlert("speed", "🚄 Speed", "Overspeeding: " + speedMs.toFixed(2) + " m/s");

  // Temperature
  let tCol = temp <= 35 ? "#22c55e" : temp <= 45 ? "#f59e0b" : "#ef4444";
  document.getElementById("tempValue").innerText = temp.toFixed(1) + " °C";
  document.getElementById("tempValue").style.color = tCol;
  tempChart.data.datasets[0].borderColor = tCol;
  if (temp > 45) triggerAlert("temp", "🌡 Temp", "Hardware Overheat: " + temp.toFixed(1) + "°C");

  // Humidity
  let hCol = (hum >= 30 && hum <= 70) ? "#22c55e" : "#ef4444";
  document.getElementById("humValue").innerText = hum.toFixed(0) + " %";
  document.getElementById("humValue").style.color = hCol;
  humChart.data.datasets[0].borderColor = hCol;
  if (hum > 80) triggerAlert("hum", "💧 Hum", "High Moisture: " + hum.toFixed(0) + "%");

  // Gas
  let gCol = gas < 300 ? "#22c55e" : gas <= 600 ? "#f59e0b" : "#ef4444";
  document.getElementById("gasValue").innerText = gas.toFixed(0) + " ppm";
  document.getElementById("gasValue").style.color = gCol;
  gasChart.data.datasets[0].borderColor = gCol;
  if (gas > 600) triggerAlert("gas", "🔥 Gas", "Leakage Detected: " + gas.toFixed(0) + " ppm");

  // Gyro
  let yCol = gyro < 20 ? "#22c55e" : gyro <= 300 ? "#f59e0b" : "#ef4444";
  document.getElementById("gyroValue").innerText = gyro.toFixed(2) + " °";
  document.getElementById("gyroValue").style.color = yCol;
  gyroChart.data.datasets[0].borderColor = yCol;
  if (gyro > 300) triggerAlert("gyro", "🧭 Gyro", "Sudden Jerk Detected!");

  // Chart Updates
  updateChartData(tempChart, temp);
  updateChartData(gasChart, gas);
  updateChartData(humChart, hum);
  updateChartData(gyroChart, gyro);
}

// Start Cycle
setInterval(fetchHardwareData, 200); 
fetchHardwareData();