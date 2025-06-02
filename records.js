import { loadRecordForDate } from "./today.js";

let db, activateTab;

export function init(dbInstance, activateTabFn) {
  db = dbInstance;
  activateTab = activateTabFn;
  populateTable();
}

export function populateTable() {
  const tbody = document.querySelector("#records-table tbody");
  const recordsContent = document.getElementById("records-content");

  tbody.innerHTML = "";
  const records = db.getAllRecords();

  if (records.length === 0) {
    recordsContent.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 3rem; margin-bottom: 20px;">📊</div>
                <h3>No records yet!</h3>
                <p>Start tracking your time to see your productivity records here.</p>
                <button onclick="document.querySelector('nav a[href=&quot;#today&quot;]').click()">
                    📅 Go to Today
                </button>
            </div>
        `;
    return;
  }

  // Restore table if it was replaced with empty state
  if (!document.querySelector("#records-table")) {
    recordsContent.innerHTML = `
            <table id="records-table">
                <thead>
                    <tr>
                        <th>📅 Date</th>
                        <th>⏰ Hours</th>
                        <th>💪 Workout</th>
                        <th>🛠️ Actions</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        `;
  }

  const newTbody = document.querySelector("#records-table tbody");

  records.forEach((record, index) => {
    const tr = document.createElement("tr");
    tr.style.animationDelay = `${index * 0.1}s`;
    tr.className = "fade-in-row";

    const workoutEmoji = record.workout === "Yes" ? "✅" : "❌";
    const formattedDate = formatDate(record.date);
    const hoursDisplay = parseFloat(record.hours).toFixed(1);

    tr.innerHTML = `
            <td>
                <strong>${formattedDate}</strong>
                <br><small>${getDayOfWeek(record.date)}</small>
            </td>
            <td>
                <span class="hours-badge ${getHoursBadgeClass(
                  record.hours
                )}">${hoursDisplay}h</span>
            </td>
            <td>
                <span class="workout-status">${workoutEmoji}</span>
            </td>
            <td>
                <button class="edit-btn" title="Edit this record">
                    ✏️ Edit
                </button>
                <button class="delete-btn danger" title="Delete this record">
                    🗑️ Delete
                </button>
            </td>
        `;

    newTbody.appendChild(tr);

    // Add event listeners
    const editBtn = tr.querySelector(".edit-btn");
    const deleteBtn = tr.querySelector(".delete-btn");

    editBtn.addEventListener("click", () => editRecord(record.date));
    deleteBtn.addEventListener("click", () => deleteRecord(record.date));
  });

  // Add CSS animations if not already added
  addAnimationStyles();
}

function editRecord(date) {
  loadRecordForDate(date);
  activateTab("today");

  // Show a brief notification
  showNotification(`📝 Editing record for ${formatDate(date)}`, "info");
}

function deleteRecord(date) {
  const formattedDate = formatDate(date);

  if (
    confirm(
      `🗑️ Are you sure you want to delete the record for ${formattedDate}?\n\nThis action cannot be undone.`
    )
  ) {
    if (db.deleteRecord(date)) {
      populateTable();
      showNotification(
        `✅ Record for ${formattedDate} deleted successfully`,
        "success"
      );
    } else {
      showNotification(
        `❌ Failed to delete record for ${formattedDate}`,
        "error"
      );
    }
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getDayOfWeek(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

function getHoursBadgeClass(hours) {
  const h = parseFloat(hours);
  if (h >= 8) return "hours-excellent";
  if (h >= 6) return "hours-good";
  if (h >= 4) return "hours-okay";
  return "hours-low";
}

function showNotification(message, type = "info") {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach((n) => n.remove());

  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function addAnimationStyles() {
  if (document.querySelector("#records-animations")) return;

  const style = document.createElement("style");
  style.id = "records-animations";
  style.textContent = `
        .fade-in-row {
            opacity: 0;
            animation: fadeInUp 0.5s ease forwards;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .hours-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-weight: bold;
            color: white;
            font-size: 0.9rem;
        }
        
        .hours-excellent {
            background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
        }
        
        .hours-good {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .hours-okay {
            background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
            color: #333;
        }
        
        .hours-low {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
        }
        
        .workout-status {
            font-size: 1.2rem;
        }
        
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            transition: opacity 0.3s ease;
        }
        
        .notification-success {
            background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
        }
        
        .notification-error {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
        }
        
        .notification-info {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        @media (max-width: 768px) {
            .notification {
                left: 20px;
                right: 20px;
                top: 10px;
            }
            
            table {
                font-size: 0.9rem;
            }
            
            button {
                padding: 8px 12px;
                font-size: 0.8rem;
            }
        }
    `;

  document.head.appendChild(style);
}
