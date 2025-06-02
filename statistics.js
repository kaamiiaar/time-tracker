let db, chart;

export function init(dbInstance) {
  db = dbInstance;
  // Ensure the statistics section is ready before initializing
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initializeStatistics();
    });
  } else {
    initializeStatistics();
  }
}

function initializeStatistics() {
  // Wait for Chart.js to be available before setting up the chart
  waitForChart()
    .then(() => {
      setupChart();
    })
    .catch((error) => {
      console.error("Failed to load Chart.js:", error);
      showChartError();
    });
}

// Wait for Chart.js to be available
function waitForChart() {
  return new Promise((resolve, reject) => {
    if (typeof Chart !== "undefined") {
      resolve();
      return;
    }

    let attempts = 0;
    const maxAttempts = 100; // 10 seconds total

    const checkChart = setInterval(() => {
      attempts++;
      if (typeof Chart !== "undefined") {
        clearInterval(checkChart);
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkChart);
        reject(new Error("Chart.js failed to load"));
      }
    }, 100);
  });
}

export function updateChart() {
  // Ensure we have a valid database connection
  if (!db) {
    console.error("Database not initialized");
    showChartError();
    return;
  }

  const stats = db.getStatistics();

  if (stats.recentData.length === 0) {
    showEmptyState();
    return;
  }

  // Hide empty state if it exists
  const emptyState = document.querySelector("#statistics-section .empty-state");
  if (emptyState) {
    emptyState.remove();
  }

  // Ensure chart container exists
  const chartContainer = document.querySelector(".chart-container");
  if (!chartContainer) {
    console.error("Chart container not found");
    return;
  }

  if (!document.querySelector("#stats-chart")) {
    chartContainer.innerHTML =
      '<canvas id="stats-chart" width="400" height="200"></canvas>';

    // Wait for Chart.js to be available before setting up
    waitForChart()
      .then(() => {
        setupChart();
        updateChartData(stats);
        updateStatsSummary(stats);
      })
      .catch((error) => {
        console.error("Chart.js not available:", error);
        showChartError();
      });
    return;
  }

  updateChartData(stats);
  updateStatsSummary(stats);
}

function setupChart() {
  const canvas = document.getElementById("stats-chart");
  if (!canvas) {
    console.error("Canvas element not found");
    return;
  }

  // Double-check Chart.js is available
  if (typeof Chart === "undefined") {
    console.error("Chart.js is not available");
    showChartError();
    return;
  }

  const ctx = canvas.getContext("2d");

  try {
    // Destroy existing chart if it exists
    if (chart) {
      chart.destroy();
    }

    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Hours Worked",
            data: [],
            borderColor: "#667eea",
            backgroundColor: "rgba(102, 126, 234, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#667eea",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
          },
          {
            label: "Workout Days",
            data: [],
            borderColor: "#4ecdc4",
            backgroundColor: "rgba(78, 205, 196, 0.1)",
            borderWidth: 2,
            fill: false,
            tension: 0.2,
            pointBackgroundColor: "#4ecdc4",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Productivity Trends (Last 30 Days)",
            font: {
              size: 18,
              weight: "bold",
            },
            color: "#333",
          },
          legend: {
            display: true,
            position: "top",
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12,
                weight: "600",
              },
            },
          },
          tooltip: {
            mode: "index",
            intersect: false,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            borderColor: "#667eea",
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              title: function (context) {
                return formatChartDate(context[0].label);
              },
              label: function (context) {
                if (context.datasetIndex === 0) {
                  return `⏰ ${context.parsed.y.toFixed(1)} hours worked`;
                } else {
                  return `💪 ${
                    context.parsed.y === 1 ? "Workout completed" : "No workout"
                  }`;
                }
              },
            },
          },
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: "Date",
              font: {
                size: 14,
                weight: "bold",
              },
            },
            grid: {
              color: "rgba(0, 0, 0, 0.1)",
            },
            ticks: {
              maxTicksLimit: 10,
              callback: function (value, index) {
                const date = this.getLabelForValue(value);
                return formatTickDate(date);
              },
            },
          },
          y: {
            type: "linear",
            display: true,
            position: "left",
            title: {
              display: true,
              text: "Hours Worked",
              font: {
                size: 14,
                weight: "bold",
              },
            },
            beginAtZero: true,
            grid: {
              color: "rgba(0, 0, 0, 0.1)",
            },
            ticks: {
              stepSize: 1,
              callback: function (value) {
                return value + "h";
              },
            },
          },
          y1: {
            type: "linear",
            display: true,
            position: "right",
            title: {
              display: true,
              text: "Workout",
              font: {
                size: 14,
                weight: "bold",
              },
            },
            min: 0,
            max: 1,
            grid: {
              drawOnChartArea: false,
            },
            ticks: {
              stepSize: 1,
              callback: function (value) {
                return value === 1 ? "✅" : "❌";
              },
            },
          },
        },
        interaction: {
          mode: "nearest",
          axis: "x",
          intersect: false,
        },
      },
    });
  } catch (error) {
    console.error("Error creating chart:", error);
    showChartError();
  }
}

function updateChartData(stats) {
  if (!chart) {
    console.warn("Chart not initialized yet");
    return;
  }

  // Ensure stats and recentData are valid
  if (!stats || !stats.recentData || !Array.isArray(stats.recentData)) {
    console.warn("Invalid stats data for chart update:", stats);
    return;
  }

  // Format data for Chart.js
  const labels = stats.recentData.map((d) => d?.date || "");
  const hoursData = stats.recentData.map((d) => parseFloat(d?.hours || 0));
  const workoutData = stats.recentData.map((d) => (d?.workout ? 1 : 0));

  // Update chart data
  chart.data.labels = labels;
  chart.data.datasets[0].data = hoursData;
  chart.data.datasets[1].data = workoutData;

  // Update the chart
  chart.update();
}

function updateStatsSummary(stats) {
  // Create or update stats summary
  let summaryDiv = document.querySelector("#stats-summary");
  if (!summaryDiv) {
    summaryDiv = document.createElement("div");
    summaryDiv.id = "stats-summary";
    const chartContainer = document.querySelector(".chart-container");
    if (chartContainer && chartContainer.parentNode) {
      chartContainer.parentNode.insertBefore(summaryDiv, chartContainer);
    } else {
      console.error("Chart container parent not found");
      return;
    }
  }

  summaryDiv.innerHTML = `
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-icon">📊</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.totalDays}</div>
                    <div class="stat-label">Total Days Tracked</div>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">⏱️</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.totalHours.toFixed(
                      1
                    )}h</div>
                    <div class="stat-label">Total Hours Worked</div>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">📈</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.avgHours.toFixed(1)}h</div>
                    <div class="stat-label">Average Hours/Day</div>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">💪</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.workoutPercentage.toFixed(
                      0
                    )}%</div>
                    <div class="stat-label">Workout Consistency</div>
                </div>
            </div>
        </div>
        <div class="insights">
            <h3>📝 Insights</h3>
            <div class="insights-content">
                ${generateInsights(stats)}
            </div>
        </div>
    `;

  addStatsStyles();
}

function generateInsights(stats) {
  const insights = [];

  // Ensure stats object is valid
  if (!stats || typeof stats !== "object") {
    return insights
      .map((insight) => `<div class="insight-item">${insight}</div>`)
      .join("");
  }

  const avgHours = stats.avgHours || 0;
  const workoutPercentage = stats.workoutPercentage || 0;
  const recentData = Array.isArray(stats.recentData) ? stats.recentData : [];

  if (avgHours >= 8) {
    insights.push(
      "🌟 Excellent productivity! You're consistently working full days."
    );
  } else if (avgHours >= 6) {
    insights.push(
      "👍 Good work habits! You're maintaining solid productivity."
    );
  } else if (avgHours >= 4) {
    insights.push(
      "📈 Room for improvement. Consider setting higher daily goals."
    );
  } else {
    insights.push(
      "🎯 Let's boost your productivity! Try setting a 6-hour daily target."
    );
  }

  if (workoutPercentage >= 80) {
    insights.push(
      "💪 Amazing workout consistency! Keep up the healthy lifestyle."
    );
  } else if (workoutPercentage >= 50) {
    insights.push(
      "🏃‍♂️ Good workout routine! Try to be more consistent for better results."
    );
  } else {
    insights.push(
      "🌱 Consider adding more physical activity to boost your energy and focus."
    );
  }

  if (recentData.length >= 7) {
    const recentWeek = recentData.slice(-7);
    const weekTotal = recentWeek.reduce(
      (sum, day) => sum + parseFloat(day?.hours || 0),
      0
    );
    if (weekTotal >= 40) {
      insights.push(
        "🔥 Great week! You've hit a full work week of productivity."
      );
    }
  }

  return insights
    .map((insight) => `<div class="insight-item">${insight}</div>`)
    .join("");
}

function showEmptyState() {
  const statisticsSection = document.getElementById("statistics-section");
  statisticsSection.innerHTML = `
        <h2>Productivity Statistics</h2>
        <div class="empty-state">
            <div style="font-size: 3rem; margin-bottom: 20px;">📈</div>
            <h3>No data to display yet!</h3>
            <p>Start tracking your productive hours to see beautiful statistics and insights here.</p>
            <button onclick="document.querySelector('nav a[href=&quot;#today&quot;]').click()">
                📅 Start Tracking
            </button>
        </div>
    `;
}

function formatChartDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTickDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function showChartError() {
  const chartContainer = document.querySelector(".chart-container");
  if (chartContainer) {
    chartContainer.innerHTML = `
      <div class="chart-error">
        <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
        <h3>Chart Loading Error</h3>
        <p>Unable to load the chart visualization. Your data is safe - try refreshing the page.</p>
        <button onclick="window.location.reload()" style="margin-top: 15px;">
          🔄 Refresh Page
        </button>
      </div>
    `;
  }
}

function addStatsStyles() {
  if (document.querySelector("#stats-styles")) return;

  const style = document.createElement("style");
  style.id = "stats-styles";
  style.textContent = `
        #stats-summary {
            margin-bottom: 25px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-item {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
            transition: transform 0.3s ease;
        }
        
        .stat-item:hover {
            transform: translateY(-2px);
        }
        
        .stat-icon {
            font-size: 2rem;
            margin-right: 15px;
        }
        
        .stat-content {
            flex: 1;
        }
        
        .stat-value {
            font-size: 1.8rem;
            font-weight: bold;
            line-height: 1;
        }
        
        .stat-label {
            font-size: 0.9rem;
            opacity: 0.9;
            margin-top: 5px;
        }
        
        .insights {
            background: #f8f9ff;
            border-radius: 12px;
            padding: 20px;
            border-left: 4px solid #667eea;
        }
        
        .insights h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 1.2rem;
        }
        
        .insight-item {
            background: white;
            padding: 12px 15px;
            margin-bottom: 10px;
            border-radius: 8px;
            border-left: 3px solid #667eea;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .insight-item:last-child {
            margin-bottom: 0;
        }
        
        .chart-container {
            height: 400px;
        }
        
        #stats-chart {
            max-height: 400px;
        }
        
        .chart-error {
            text-align: center;
            padding: 40px;
            color: #666;
            background: #f8f9ff;
            border-radius: 8px;
            border: 2px dashed #ddd;
        }
        
        .chart-error h3 {
            color: #333;
            margin-bottom: 10px;
        }
        
        @media (max-width: 768px) {
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .stat-item {
                padding: 15px;
            }
            
            .stat-icon {
                font-size: 1.5rem;
                margin-right: 10px;
            }
            
            .stat-value {
                font-size: 1.5rem;
            }
            
            .chart-container {
                height: 300px;
            }
        }
    `;

  document.head.appendChild(style);
}
