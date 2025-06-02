import { init as initDB } from "./db.js";
import { init as initToday } from "./today.js";
import { init as initRecords, populateTable } from "./records.js";
import { init as initStatistics, updateChart } from "./statistics.js";

let db,
  todayModule,
  currentTab = "today";

(async function () {
  try {
    // Show loading state
    showLoading();

    // Initialize database
    db = await initDB();

    // Initialize modules
    todayModule = initToday(db);
    initRecords(db, activateTab);
    initStatistics(db);

    // Setup navigation
    setupNavigation();

    // Hide loading and show initial tab
    hideLoading();
    activateTab("today");

    console.log("✅ Time Tracker Assistant initialized successfully!");
  } catch (error) {
    console.error("❌ Failed to initialize Time Tracker Assistant:", error);
    showErrorState(error);
  }
})();

function setupNavigation() {
  const navLinks = document.querySelectorAll("nav a");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const tabId = e.target.getAttribute("href").substring(1);
      activateTab(tabId);
    });
  });

  // Handle browser back/forward
  window.addEventListener("popstate", (e) => {
    if (e.state && e.state.tab) {
      activateTab(e.state.tab, false);
    }
  });
}

function activateTab(tabId, updateHistory = true) {
  if (currentTab === tabId) return;

  const navLinks = document.querySelectorAll("nav a");
  const sections = document.querySelectorAll("main section");

  // Update navigation
  navLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href") === `#${tabId}`) {
      link.classList.add("active");
    }
  });

  // Update sections
  sections.forEach((section) => {
    section.classList.remove("active");
  });

  const targetSection = document.getElementById(`${tabId}-section`);
  if (targetSection) {
    targetSection.classList.add("active");
  }

  // Update history
  if (updateHistory) {
    const url = new URL(window.location);
    url.hash = tabId;
    history.pushState({ tab: tabId }, "", url);
  }

  // Tab-specific actions
  switch (tabId) {
    case "today":
      // Today tab is always fresh
      break;
    case "records":
      populateTable();
      break;
    case "statistics":
      updateChart();
      break;
  }

  currentTab = tabId;

  // Add analytics tracking (optional)
  trackTabView(tabId);
}

function trackTabView(tabId) {
  // Simple analytics tracking
  const timestamp = new Date().toISOString();
  const views = JSON.parse(localStorage.getItem("tab_views") || "{}");
  views[tabId] = (views[tabId] || 0) + 1;
  localStorage.setItem("tab_views", JSON.stringify(views));
  localStorage.setItem("last_active", timestamp);
}

function showLoading() {
  const loadingDiv = document.createElement("div");
  loadingDiv.id = "loading-overlay";
  loadingDiv.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner">⏱️</div>
            <h3>Loading Time Tracker Assistant...</h3>
            <p>Initializing your productivity dashboard</p>
        </div>
    `;

  document.body.appendChild(loadingDiv);
  addLoadingStyles();
}

function hideLoading() {
  const loadingDiv = document.getElementById("loading-overlay");
  if (loadingDiv) {
    loadingDiv.style.opacity = "0";
    setTimeout(() => loadingDiv.remove(), 300);
  }
}

function showErrorState(error) {
  hideLoading();

  const errorDiv = document.createElement("div");
  errorDiv.id = "error-overlay";
  errorDiv.innerHTML = `
        <div class="error-content">
            <div class="error-icon">❌</div>
            <h3>Failed to Initialize</h3>
            <p>There was an error loading the Time Tracker Assistant.</p>
            <div class="error-details">
                <strong>Error:</strong> ${error.message}
            </div>
            <button onclick="window.location.reload()" class="retry-button">
                🔄 Try Again
            </button>
        </div>
    `;

  document.body.appendChild(errorDiv);
  addErrorStyles();
}

function addLoadingStyles() {
  if (document.querySelector("#loading-styles")) return;

  const style = document.createElement("style");
  style.id = "loading-styles";
  style.textContent = `
        #loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            transition: opacity 0.3s ease;
        }
        
        .loading-content {
            text-align: center;
            color: white;
            max-width: 400px;
            padding: 40px;
        }
        
        .loading-spinner {
            font-size: 4rem;
            animation: spin 2s linear infinite;
            margin-bottom: 20px;
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .loading-content h3 {
            margin: 0 0 10px 0;
            font-size: 1.5rem;
        }
        
        .loading-content p {
            margin: 0;
            opacity: 0.9;
        }
    `;

  document.head.appendChild(style);
}

function addErrorStyles() {
  if (document.querySelector("#error-styles")) return;

  const style = document.createElement("style");
  style.id = "error-styles";
  style.textContent = `
        #error-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        
        .error-content {
            text-align: center;
            color: white;
            max-width: 500px;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        
        .error-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        
        .error-content h3 {
            margin: 0 0 15px 0;
            font-size: 1.8rem;
        }
        
        .error-content p {
            margin: 0 0 20px 0;
            opacity: 0.9;
        }
        
        .error-details {
            background: rgba(0, 0, 0, 0.2);
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-family: monospace;
            text-align: left;
            word-break: break-word;
        }
        
        .retry-button {
            background: white;
            color: #ff6b6b;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .retry-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }
    `;

  document.head.appendChild(style);
}

// Handle initial page load with hash
window.addEventListener("DOMContentLoaded", () => {
  const hash = window.location.hash.substring(1);
  if (hash && ["today", "records", "statistics"].includes(hash)) {
    // Wait for initialization to complete
    setTimeout(() => activateTab(hash), 100);
  }
});

// Export for global access if needed
window.TimeTracker = {
  activateTab,
  getCurrentTab: () => currentTab,
  getDatabase: () => db,
  getTodayModule: () => todayModule,
};
