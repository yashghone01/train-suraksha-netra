let temp = 35, gas = 180, hum = 60, gyro = 1.5;
const labels = Array(30).fill("");

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

function update(chart, value) {
  chart.data.datasets[0].data.push(value);
  if (chart.data.datasets[0].data.length > 30)
      chart.data.datasets[0].data.shift();
  chart.update();
}

setInterval(() => {
  temp += (Math.random()-0.5)*1.5;
  gas  += (Math.random()-0.5)*10;
  hum  += (Math.random()-0.5)*2;
  gyro += (Math.random()-0.5)*0.3;

  document.getElementById("tempValue").innerText = temp.toFixed(1)+" °C";
  document.getElementById("gasValue").innerText  = gas.toFixed(0)+" ppm";
  document.getElementById("humValue").innerText  = hum.toFixed(0)+" %";
  document.getElementById("gyroValue").innerText = gyro.toFixed(2)+" °";

  update(tempChart, temp);
  update(gasChart, gas);
  update(humChart, hum);
  update(gyroChart, gyro);
}, 1000);


