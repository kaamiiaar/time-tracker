let db,
  isRunning = false,
  startTime = 0,
  elapsedTime = 0,
  intervalId,
  currentTotalHours = 0;

export function init(dbInstance) {
  db = dbInstance;

  const datePicker = document.getElementById("date-picker");
  const totalHoursSpan = document.getElementById("total-hours");
  const workoutStatusSpan = document.getElementById("workout-status");
  const manualHoursInput = document.getElementById("manual-hours");
  const workoutCheckbox = document.getElementById("workout");
  const startPauseBtn = document.getElementById("start-pause");
  const resetBtn = document.getElementById("reset");
  const sessionTimeSpan = document.getElementById("session-time");
  const saveDayBtn = document.getElementById("save-day");

  // Set initial date to today
  datePicker.value = new Date().toISOString().split("T")[0];
  loadRecord(datePicker.value);

  // Event listeners
  datePicker.addEventListener("change", () => loadRecord(datePicker.value));
  workoutCheckbox.addEventListener("change", updateDisplay);
  startPauseBtn.addEventListener("click", toggleStopwatch);
  resetBtn.addEventListener("click", resetStopwatch);
  saveDayBtn.addEventListener("click", saveRecord);

  // Manual hours - add on Enter key or when input loses focus
  manualHoursInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addManualHours();
    }
  });

  manualHoursInput.addEventListener("blur", () => {
    if (manualHoursInput.value && parseFloat(manualHoursInput.value) > 0) {
      addManualHours();
    }
  });

  // Auto-save when workout changes
  workoutCheckbox.addEventListener("change", saveRecord);

  async function loadRecord(date) {
    try {
      const record = await db.getRecord(date);
      currentTotalHours = await db.getTotalHoursForDate(date);
      workoutCheckbox.checked = record.workout === "Yes";
      manualHoursInput.value = ""; // Always start fresh for adding
      updateDisplay();
      await loadTimeEntries(date);
      resetStopwatch();
    } catch (error) {
      console.error("Failed to load record:", error);
      // Set defaults on error
      currentTotalHours = 0;
      workoutCheckbox.checked = false;
      updateDisplay();
    }
  }

  async function loadTimeEntries(date) {
    try {
      const entriesResult = await db.getTimeEntries(date);
      const entries = Array.isArray(entriesResult) ? entriesResult : [];
      const entriesList = document.getElementById("time-entries-list");

      if (!entriesList) {
        console.error("Time entries list element not found");
        return;
      }

      if (entries.length === 0) {
        entriesList.innerHTML = `
          <div class="empty-entries">
            <p>No time entries yet. Use the stopwatch or add manual hours to get started!</p>
          </div>
        `;
        return;
      }

      // Build the entries list with bulk selection controls
      const bulkControls = `
        <div class="bulk-controls">
          <label class="bulk-select">
            <input type="checkbox" id="select-all">
            <span>Select All</span>
          </label>
          <button id="delete-selected" class="delete-selected" disabled>
            🗑️ Delete Selected (<span id="selected-count">0</span>)
          </button>
        </div>
      `;

      const entriesHtml = entries
        .map((entry) => {
          // Ensure entry is a valid object with required properties
          if (!entry || typeof entry !== "object") {
            console.warn("Invalid entry:", entry);
            return "";
          }

          const formattedTime = formatHoursToHMS(entry.hours || 0);
          const timestamp = formatTimestamp(
            entry.created_at || new Date().toISOString()
          );
          const icon = entry.type === "manual" ? "✏️" : "⏱️";
          const typeLabel =
            entry.type === "manual" ? "Manual Entry" : "Stopwatch Session";

          return `
          <div class="time-entry ${entry.type || "manual"}">
            <div class="entry-checkbox">
              <input type="checkbox" class="entry-select" value="${
                entry.id || ""
              }">
            </div>
            <div class="entry-info">
              <div class="entry-type">${icon} ${typeLabel}</div>
              <div class="entry-time">${formattedTime}</div>
              <div class="entry-timestamp">${timestamp}</div>
            </div>
            <div class="entry-actions">
              <button class="delete-entry" data-entry-id="${entry.id || 0}">
                🗑️ Delete
              </button>
            </div>
          </div>
        `;
        })
        .filter((entry) => entry !== "") // Remove empty entries
        .join("");

      entriesList.innerHTML = bulkControls + entriesHtml;

      // Add event listeners after creating the HTML
      setupTimeEntriesEventListeners();
    } catch (error) {
      console.error("Failed to load time entries:", error);
    }
  }

  function setupTimeEntriesEventListeners() {
    // Select all checkbox
    const selectAllCheckbox = document.getElementById("select-all");
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener("change", toggleSelectAll);
    }

    // Delete selected button
    const deleteSelectedBtn = document.getElementById("delete-selected");
    if (deleteSelectedBtn) {
      deleteSelectedBtn.addEventListener("click", async () => {
        await deleteSelected();
      });
    }

    // Individual entry checkboxes
    const entryCheckboxes = document.querySelectorAll(".entry-select");
    entryCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", updateBulkControls);
    });

    // Individual delete buttons
    const deleteButtons = document.querySelectorAll(".delete-entry");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", async (e) => {
        const entryId = parseInt(e.target.getAttribute("data-entry-id"));
        await deleteEntry(entryId);
      });
    });
  }

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  async function addManualHours() {
    const hoursToAdd = parseFloat(manualHoursInput.value) || 0;

    if (hoursToAdd > 0) {
      try {
        const date = datePicker.value;
        const entryId = await db.addTimeEntry(
          date,
          hoursToAdd,
          "manual",
          "Manual time entry"
        );

        if (entryId) {
          currentTotalHours = await db.getTotalHoursForDate(date);
          manualHoursInput.value = ""; // Reset input after adding
          updateDisplay();
          await loadTimeEntries(date); // Refresh the entries list
          showAddConfirmation(hoursToAdd);
        } else {
          showErrorMessage("Failed to add manual hours");
        }
      } catch (error) {
        console.error("Failed to add manual hours:", error);
        showErrorMessage("Failed to add manual hours");
      }
    }
  }

  function updateDisplay() {
    totalHoursSpan.textContent = formatHoursToHMS(currentTotalHours);
    workoutStatusSpan.textContent = workoutCheckbox.checked ? "✅" : "❌";
  }

  function formatHoursToHMS(decimalHours) {
    const totalSeconds = Math.round(decimalHours * 3600); // Convert to total seconds
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours === 0 && minutes === 0 && seconds === 0) {
      return "0h 0m";
    }

    let result = "";
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0) result += `${minutes}m `;
    if (seconds > 0 || (hours === 0 && minutes === 0)) result += `${seconds}s`;

    return result.trim();
  }

  function toggleStopwatch() {
    if (!isRunning) {
      startStopwatch();
    } else {
      pauseStopwatch();
    }
  }

  function startStopwatch() {
    isRunning = true;
    startTime = Date.now() - elapsedTime;
    startPauseBtn.textContent = "⏸️ Pause";
    startPauseBtn.style.background =
      "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)";

    intervalId = setInterval(() => {
      elapsedTime = Date.now() - startTime;
      updateStopwatchDisplay();
    }, 1000);
  }

  async function pauseStopwatch() {
    isRunning = false;
    clearInterval(intervalId);
    startPauseBtn.textContent = "▶️ Start";
    startPauseBtn.style.background =
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

    // Add elapsed time as a stopwatch entry
    const elapsedHours = elapsedTime / (1000 * 60 * 60);
    const date = datePicker.value;

    if (elapsedHours > 0) {
      try {
        const entryId = await db.addTimeEntry(
          date,
          elapsedHours,
          "stopwatch",
          "Stopwatch session"
        );

        if (entryId) {
          currentTotalHours = await db.getTotalHoursForDate(date);
          updateDisplay();
          await loadTimeEntries(date); // Refresh the entries list
          showStopwatchConfirmation(elapsedHours);
        } else {
          showErrorMessage("Failed to save stopwatch time");
        }
      } catch (error) {
        console.error("Failed to save stopwatch time:", error);
        showErrorMessage("Failed to save stopwatch time");
      }
    }

    // Reset stopwatch after adding time
    elapsedTime = 0;
    updateStopwatchDisplay();
  }

  function resetStopwatch() {
    isRunning = false;
    clearInterval(intervalId);
    elapsedTime = 0;
    startPauseBtn.textContent = "▶️ Start";
    startPauseBtn.style.background =
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    updateStopwatchDisplay();
  }

  function updateStopwatchDisplay() {
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    sessionTimeSpan.textContent = `${hours
      .toString()
      .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  async function deleteEntry(entryId) {
    if (confirm("🗑️ Are you sure you want to delete this time entry?")) {
      // Find the delete button and show loading state
      const deleteButton = document.querySelector(
        `[data-entry-id="${entryId}"]`
      );
      if (deleteButton) {
        const originalText = deleteButton.innerHTML;
        deleteButton.disabled = true;
        deleteButton.innerHTML = "🔄 Deleting...";

        // Defer the heavy work to avoid blocking the UI
        setTimeout(async () => {
          try {
            if (await db.deleteTimeEntry(entryId)) {
              const date = datePicker.value;
              currentTotalHours = await db.getTotalHoursForDate(date);
              updateDisplay();
              await loadTimeEntries(date); // Refresh the entries list
              showDeleteConfirmation();
            } else {
              showErrorMessage("Failed to delete entry");
              // Re-enable button on failure
              deleteButton.disabled = false;
              deleteButton.innerHTML = originalText;
            }
          } catch (error) {
            console.error("Failed to delete entry:", error);
            showErrorMessage("Failed to delete entry");
            // Re-enable button on error
            deleteButton.disabled = false;
            deleteButton.innerHTML = originalText;
          }
        }, 10);
      } else {
        // Fallback if button not found
        try {
          if (await db.deleteTimeEntry(entryId)) {
            const date = datePicker.value;
            currentTotalHours = await db.getTotalHoursForDate(date);
            updateDisplay();
            await loadTimeEntries(date);
            showDeleteConfirmation();
          } else {
            showErrorMessage("Failed to delete entry");
          }
        } catch (error) {
          console.error("Failed to delete entry:", error);
          showErrorMessage("Failed to delete entry");
        }
      }
    }
  }

  async function saveRecord() {
    try {
      const date = datePicker.value;
      const workout = workoutCheckbox.checked;

      // Update workout status in daily record
      if (await db.insertOrUpdateRecord(date, currentTotalHours, workout)) {
        updateDisplay();
      } else {
        showErrorMessage("Failed to save data");
      }
    } catch (error) {
      console.error("Failed to save record:", error);
      showErrorMessage("Failed to save data");
    }
  }

  function showAddConfirmation(hoursAdded) {
    const originalText = saveDayBtn.textContent;
    const formattedHours = formatHoursToHMS(hoursAdded);
    saveDayBtn.textContent = `✅ Added ${formattedHours}!`;
    saveDayBtn.style.background =
      "linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)";

    setTimeout(() => {
      saveDayBtn.textContent = originalText;
      saveDayBtn.style.background =
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    }, 2000);
  }

  function showStopwatchConfirmation(hoursAdded) {
    const originalText = saveDayBtn.textContent;
    const formattedHours = formatHoursToHMS(hoursAdded);
    saveDayBtn.textContent = `⏱️ Stopwatch: ${formattedHours} saved!`;
    saveDayBtn.style.background =
      "linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)";

    setTimeout(() => {
      saveDayBtn.textContent = originalText;
      saveDayBtn.style.background =
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    }, 2000);
  }

  function showDeleteConfirmation() {
    const originalText = saveDayBtn.textContent;
    saveDayBtn.textContent = "✅ Entry deleted!";
    saveDayBtn.style.background =
      "linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)";

    setTimeout(() => {
      saveDayBtn.textContent = originalText;
      saveDayBtn.style.background =
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    }, 2000);
  }

  function showBulkDeleteConfirmation(message) {
    const originalText = saveDayBtn.textContent;
    saveDayBtn.textContent = message;
    saveDayBtn.style.background =
      "linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)";

    setTimeout(() => {
      saveDayBtn.textContent = originalText;
      saveDayBtn.style.background =
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    }, 2000);
  }

  function showErrorMessage(message) {
    const originalText = saveDayBtn.textContent;
    saveDayBtn.textContent = `❌ ${message}`;
    saveDayBtn.style.background =
      "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)";

    setTimeout(() => {
      saveDayBtn.textContent = originalText;
      saveDayBtn.style.background =
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    }, 3000);
  }

  function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById("select-all");
    const entryCheckboxes = document.querySelectorAll(".entry-select");

    entryCheckboxes.forEach((checkbox) => {
      checkbox.checked = selectAllCheckbox.checked;
    });

    updateBulkControls();
  }

  function updateBulkControls() {
    const entryCheckboxes = document.querySelectorAll(".entry-select");
    const selectedCheckboxes = document.querySelectorAll(
      ".entry-select:checked"
    );
    const selectAllCheckbox = document.getElementById("select-all");
    const deleteSelectedBtn = document.getElementById("delete-selected");
    const selectedCountSpan = document.getElementById("selected-count");

    const totalCount = entryCheckboxes.length;
    const selectedCount = selectedCheckboxes.length;

    // Update select all checkbox state
    if (selectedCount === 0) {
      selectAllCheckbox.indeterminate = false;
      selectAllCheckbox.checked = false;
    } else if (selectedCount === totalCount) {
      selectAllCheckbox.indeterminate = false;
      selectAllCheckbox.checked = true;
    } else {
      selectAllCheckbox.indeterminate = true;
      selectAllCheckbox.checked = false;
    }

    // Update delete button state
    deleteSelectedBtn.disabled = selectedCount === 0;
    selectedCountSpan.textContent = selectedCount;

    // Update button text
    if (selectedCount === 0) {
      deleteSelectedBtn.innerHTML =
        '🗑️ Delete Selected (<span id="selected-count">0</span>)';
    } else {
      deleteSelectedBtn.innerHTML = `🗑️ Delete Selected (<span id="selected-count">${selectedCount}</span>)`;
    }
  }

  async function deleteSelected() {
    const selectedCheckboxes = document.querySelectorAll(
      ".entry-select:checked"
    );
    const selectedIds = Array.from(selectedCheckboxes).map((cb) =>
      parseInt(cb.value)
    );

    if (selectedIds.length === 0) return;

    const confirmMessage =
      selectedIds.length === 1
        ? "🗑️ Are you sure you want to delete this time entry?"
        : `🗑️ Are you sure you want to delete ${selectedIds.length} time entries?\n\nThis action cannot be undone.`;

    if (confirm(confirmMessage)) {
      // Immediately disable the button and show loading state
      const deleteSelectedBtn = document.getElementById("delete-selected");
      const originalText = deleteSelectedBtn.innerHTML;
      deleteSelectedBtn.disabled = true;
      deleteSelectedBtn.innerHTML = "🔄 Deleting...";

      // Defer the heavy work to avoid blocking the UI
      setTimeout(async () => {
        try {
          let deletedCount = 0;

          // Use Promise.all for parallel deletion instead of sequential
          const deletePromises = selectedIds.map(async (id) => {
            try {
              const success = await db.deleteTimeEntry(id);
              if (success) deletedCount++;
              return success;
            } catch (error) {
              console.error(`Failed to delete entry ${id}:`, error);
              return false;
            }
          });

          await Promise.all(deletePromises);

          if (deletedCount > 0) {
            const date = datePicker.value;
            // Update total hours and refresh UI
            currentTotalHours = await db.getTotalHoursForDate(date);
            updateDisplay();
            await loadTimeEntries(date); // Refresh the entries list

            const message =
              deletedCount === 1
                ? "✅ Entry deleted!"
                : `✅ ${deletedCount} entries deleted!`;
            showBulkDeleteConfirmation(message);
          } else {
            showErrorMessage("Failed to delete entries");
          }
        } catch (error) {
          console.error("Failed to delete entries:", error);
          showErrorMessage("Failed to delete entries");
        } finally {
          // Re-enable the button
          deleteSelectedBtn.disabled = false;
          deleteSelectedBtn.innerHTML = originalText;
        }
      }, 10); // Small delay to allow UI to update
    }
  }

  // Expose public methods
  const publicMethods = {
    loadRecordForDate: async (date) => {
      datePicker.value = date;
      await loadRecord(date);
    },
    getCurrentData: () => ({
      date: datePicker.value,
      hours: currentTotalHours,
      workout: workoutCheckbox.checked,
    }),
  };

  // Make methods available globally for onclick handlers (only needed for external access)
  window.todayModule = publicMethods;

  return publicMethods;
}

export async function loadRecordForDate(date) {
  if (window.todayModule && window.todayModule.loadRecordForDate) {
    await window.todayModule.loadRecordForDate(date);
  }
}
