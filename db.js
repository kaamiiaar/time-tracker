let db;

export async function init() {
  try {
    const SQL = await initSqlJs({
      locateFile: (file) =>
        `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`,
    });

    const savedDB = localStorage.getItem("time_tracker_db");
    if (savedDB) {
      const uint8array = new Uint8Array(
        savedDB.split(",").map((x) => parseInt(x))
      );
      db = new SQL.Database(uint8array);
    } else {
      db = new SQL.Database();
      createTables();
    }

    // Ensure tables exist even if loading from storage
    createTables();

    return {
      getRecord,
      insertOrUpdateRecord,
      deleteRecord,
      getAllRecords,
      getStatistics,
      addTimeEntry,
      getTimeEntries,
      deleteTimeEntry,
      getTotalHoursForDate,
    };
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}

function createTables() {
  // Original table for daily summary
  db.run(`
        CREATE TABLE IF NOT EXISTS daily_records (
            date TEXT PRIMARY KEY,
            hours REAL DEFAULT 0,
            workout TEXT DEFAULT 'No',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // New table for individual time entries
  db.run(`
        CREATE TABLE IF NOT EXISTS time_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            hours REAL NOT NULL,
            type TEXT NOT NULL, -- 'manual' or 'stopwatch'
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

function saveDB() {
  try {
    const data = db.export();
    const array = Array.from(data);
    localStorage.setItem("time_tracker_db", array.join(","));
  } catch (error) {
    console.error("Failed to save database:", error);
  }
}

function addTimeEntry(date, hours, type, description = "") {
  try {
    const stmt = db.prepare(`
            INSERT INTO time_entries (date, hours, type, description)
            VALUES ($date, $hours, $type, $description)
        `);
    stmt.run({
      $date: date,
      $hours: hours,
      $type: type,
      $description: description,
    });
    const entryId = db.exec("SELECT last_insert_rowid()")[0].values[0][0];
    stmt.free();

    // Update the daily total
    updateDailyTotal(date);
    saveDB();
    return entryId;
  } catch (error) {
    console.error("Failed to add time entry:", error);
    return false;
  }
}

function getTimeEntries(date) {
  try {
    const results = [];
    const stmt = db.prepare(`
            SELECT id, hours, type, description, created_at
            FROM time_entries 
            WHERE date = $date 
            ORDER BY created_at ASC
        `);
    stmt.bind({ $date: date });
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (error) {
    console.error("Failed to get time entries:", error);
    return [];
  }
}

function deleteTimeEntry(entryId) {
  try {
    // Get the date before deleting to update the total
    const getDateStmt = db.prepare(
      "SELECT date FROM time_entries WHERE id = $id"
    );
    getDateStmt.bind({ $id: entryId });
    let date = null;
    if (getDateStmt.step()) {
      date = getDateStmt.get()[0];
    }
    getDateStmt.free();

    const stmt = db.prepare("DELETE FROM time_entries WHERE id = $id");
    stmt.run({ $id: entryId });
    stmt.free();

    // Update the daily total
    if (date) {
      updateDailyTotal(date);
    }
    saveDB();
    return true;
  } catch (error) {
    console.error("Failed to delete time entry:", error);
    return false;
  }
}

function getTotalHoursForDate(date) {
  try {
    const stmt = db.prepare(`
            SELECT SUM(hours) as total
            FROM time_entries 
            WHERE date = $date
        `);
    stmt.bind({ $date: date });
    let total = 0;
    if (stmt.step()) {
      total = stmt.getAsObject().total || 0;
    }
    stmt.free();
    return total;
  } catch (error) {
    console.error("Failed to get total hours:", error);
    return 0;
  }
}

function updateDailyTotal(date) {
  try {
    const totalHours = getTotalHoursForDate(date);
    const stmt = db.prepare(`
            INSERT OR REPLACE INTO daily_records (date, hours, workout, updated_at)
            VALUES ($date, $hours, 
                    COALESCE((SELECT workout FROM daily_records WHERE date = $date), 'No'),
                    CURRENT_TIMESTAMP)
        `);
    stmt.run({
      $date: date,
      $hours: totalHours,
    });
    stmt.free();
  } catch (error) {
    console.error("Failed to update daily total:", error);
  }
}

function getRecord(date) {
  try {
    const stmt = db.prepare(
      "SELECT hours, workout FROM daily_records WHERE date = $date"
    );
    stmt.bind({ $date: date });
    const result = stmt.step()
      ? stmt.getAsObject()
      : { hours: 0, workout: "No" };
    stmt.free();
    return result;
  } catch (error) {
    console.error("Failed to get record:", error);
    return { hours: 0, workout: "No" };
  }
}

function insertOrUpdateRecord(date, hours, workout) {
  try {
    const stmt = db.prepare(`
            INSERT OR REPLACE INTO daily_records (date, hours, workout, updated_at) 
            VALUES ($date, $hours, $workout, CURRENT_TIMESTAMP)
        `);
    stmt.run({
      $date: date,
      $hours: hours,
      $workout: workout ? "Yes" : "No",
    });
    stmt.free();
    saveDB();
    return true;
  } catch (error) {
    console.error("Failed to insert/update record:", error);
    return false;
  }
}

function deleteRecord(date) {
  try {
    // Delete all time entries for this date
    const deleteEntriesStmt = db.prepare(
      "DELETE FROM time_entries WHERE date = $date"
    );
    deleteEntriesStmt.run({ $date: date });
    deleteEntriesStmt.free();

    // Delete the daily record
    const stmt = db.prepare("DELETE FROM daily_records WHERE date = $date");
    stmt.run({ $date: date });
    stmt.free();
    saveDB();
    return true;
  } catch (error) {
    console.error("Failed to delete record:", error);
    return false;
  }
}

function getAllRecords() {
  try {
    const results = [];
    const stmt = db.prepare(
      "SELECT date, hours, workout FROM daily_records ORDER BY date DESC"
    );
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (error) {
    console.error("Failed to get all records:", error);
    return [];
  }
}

function getStatistics() {
  try {
    const stats = {
      totalDays: 0,
      totalHours: 0,
      avgHours: 0,
      workoutDays: 0,
      workoutPercentage: 0,
      recentData: [],
    };

    // Get basic statistics
    const totalStmt = db.prepare(`
            SELECT 
                COUNT(*) as totalDays, 
                SUM(hours) as totalHours,
                AVG(hours) as avgHours,
                SUM(CASE WHEN workout = 'Yes' THEN 1 ELSE 0 END) as workoutDays
            FROM daily_records
        `);

    if (totalStmt.step()) {
      const result = totalStmt.getAsObject();
      stats.totalDays = result.totalDays || 0;
      stats.totalHours = result.totalHours || 0;
      stats.avgHours = result.avgHours || 0;
      stats.workoutDays = result.workoutDays || 0;
      stats.workoutPercentage =
        stats.totalDays > 0 ? (stats.workoutDays / stats.totalDays) * 100 : 0;
    }
    totalStmt.free();

    // Get recent 30 days data for chart
    const recentStmt = db.prepare(`
            SELECT date, hours, workout 
            FROM daily_records 
            ORDER BY date DESC 
            LIMIT 30
        `);

    while (recentStmt.step()) {
      stats.recentData.push(recentStmt.getAsObject());
    }
    recentStmt.free();

    // Reverse to get chronological order
    stats.recentData.reverse();

    return stats;
  } catch (error) {
    console.error("Failed to get statistics:", error);
    return {
      totalDays: 0,
      totalHours: 0,
      avgHours: 0,
      workoutDays: 0,
      workoutPercentage: 0,
      recentData: [],
    };
  }
}
