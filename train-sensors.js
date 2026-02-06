// This logic checks HOW the page was loaded
window.onload = function() {
    // Check if the page was refreshed/reloaded
    const perfEntries = performance.getEntriesByType("navigation");
    const isRefresh = perfEntries.length > 0 && perfEntries[0].type === "reload";

    if (isRefresh) {
        // ONLY clear alerts if the user clicked the browser Refresh button
        localStorage.removeItem("railAlerts");
        console.log("Alerts cleared because of browser Refresh.");
    } else {
        // Do nothing if just navigating via links (switching tabs)
        console.log("Navigation detected - Alerts preserved.");
    }
};

let temp = 35, gas = 180, hum = 60, gyro = 1.5;
const labels = Array(30).fill("");

// Track last alert time for each sensor to prevent "spamming" the inbox
let lastAlertTimes = { temp: 0, gas: 0, hum: 0, gyro: 0 };

// 1. Function to create the charts
function createChart(id, color) {
  return new Chart(document.getElementById(id), {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: [],
        borderColor: color,
        tension: 0.4,
        fill: false
      }]
    },
    options: {
      animation: false,
      scales: {
        x: { display:false },
        y: { beginAtZero:false }
      }
    }
  });
}

const tempChart = createChart("tempChart", "#ef4444");
const gasChart  = createChart("gasChart", "#f59e0b");
const humChart  = createChart("humChart", "#22c55e");
const gyroChart = createChart("gyroChart", "#38bdf8");

// 2. Function to update chart data
function update(chart, value) {
  chart.data.datasets[0].data.push(value);
  if (chart.data.datasets[0].data.length > 30)
      chart.data.datasets[0].data.shift();
  chart.update();
}

// 3. Function to SEND alerts with a 30-second cooldown per sensor type
function triggerAlert(sensorKey, type, message) {
    const now = Date.now();
    
    // Maintain the 30-second cooldown per sensor type
    if (now - lastAlertTimes[sensorKey] < 30000) return; 

    lastAlertTimes[sensorKey] = now;

    // UPDATED: Added 'second' to the time formatting
    const newAlert = {
        time: new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit', // This adds the seconds (e.g., :03)
            hour12: true       // Ensures PM/AM is shown
        }),
        type: type,
        message: message,
        status: "CRITICAL"
    };

    let alerts = JSON.parse(localStorage.getItem("railAlerts")) || [];
    alerts.unshift(newAlert); 
    if (alerts.length > 10) alerts.pop();
    localStorage.setItem("railAlerts", JSON.stringify(alerts));
}

// 4. MAIN LOOP
setInterval(() => {
  // REDUCED PROBABILITIES: Sensors stay Green ~93-95% of the time
  let tChance = Math.random();
  if (tChance < 0.93) temp = 25 + Math.random() * 10;
  else if (tChance < 0.98) temp = 36 + Math.random() * 9;
  else temp = 46 + Math.random() * 10;

  let gChance = Math.random();
  if (gChance < 0.95) gas = 100 + Math.random() * 150;
  else if (gChance < 0.99) gas = 301 + Math.random() * 250;
  else gas = 601 + Math.random() * 300;

  let hChance = Math.random();
  if (hChance < 0.95) hum = 40 + Math.random() * 20;
  else hum = 81 + Math.random() * 10;

  let yChance = Math.random();
  if (yChance < 0.97) gyro = Math.random() * 15;
  else gyro = 301 + Math.random() * 50;

  // --- Update UI Colors and Trigger Alerts ---

  // Temperature
  let tCol = temp <= 35 ? "#22c55e" : temp <= 45 ? "#f59e0b" : "#ef4444";
  document.getElementById("tempValue").innerText = temp.toFixed(1) + " °C";
  document.getElementById("tempValue").style.color = tCol;
  tempChart.data.datasets[0].borderColor = tCol;
  if (temp > 45) triggerAlert("temp", "🌡 Temp", "Engine Overheat: " + temp.toFixed(1) + "°C");

  // Gas
  let gCol = gas < 300 ? "#22c55e" : gas <= 600 ? "#f59e0b" : "#ef4444";
  document.getElementById("gasValue").innerText = gas.toFixed(0) + " ppm";
  document.getElementById("gasValue").style.color = gCol;
  gasChart.data.datasets[0].borderColor = gCol;
  if (gas > 600) triggerAlert("gas", "🔥 Gas", "Leakage Detected: " + gas.toFixed(0) + " ppm");

  // Humidity
  let hCol = (hum >= 30 && hum <= 70) ? "#22c55e" : "#ef4444";
  document.getElementById("humValue").innerText = hum.toFixed(0) + " %";
  document.getElementById("humValue").style.color = hCol;
  humChart.data.datasets[0].borderColor = hCol;
  if (hum > 80) triggerAlert("hum", "💧 Hum", "High Moisture Risk: " + hum.toFixed(0) + "%");

  // Gyro
  let yCol = gyro < 20 ? "#22c55e" : gyro <= 300 ? "#f59e0b" : "#ef4444";
  document.getElementById("gyroValue").innerText = gyro.toFixed(2) + " °";
  document.getElementById("gyroValue").style.color = yCol;
  gyroChart.data.datasets[0].borderColor = yCol;
  if (gyro > 300) triggerAlert("gyro", "🧭 Gyro", "Sudden Jerk Detected!");

  // Update Charts
  update(tempChart, temp);
  update(gasChart, gas);
  update(humChart, hum);
  update(gyroChart, gyro);
}, 1000);