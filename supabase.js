import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/+esm";

let supabase;

async function getEnvironmentVariables() {
  // Try multiple sources for environment variables in order of preference

  // 1. Try to fetch from Vercel API endpoint (production)
  try {
    const response = await fetch("/api/env");
    if (response.ok) {
      const env = await response.json();
      if (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY) {
        console.log("✅ Environment variables loaded from Vercel API");
        return {
          url: env.VITE_SUPABASE_URL,
          key: env.VITE_SUPABASE_ANON_KEY,
        };
      }
    }
  } catch (error) {
    console.log("Could not fetch from API endpoint:", error.message);
  }

  // 2. Try to load from local config.js (for development)
  try {
    const configModule = await import("./config.js");
    if (
      configModule.config &&
      configModule.config.SUPABASE_URL &&
      configModule.config.SUPABASE_ANON_KEY
    ) {
      console.log("✅ Environment variables loaded from local config");
      return {
        url: configModule.config.SUPABASE_URL,
        key: configModule.config.SUPABASE_ANON_KEY,
      };
    }
  } catch (error) {
    console.log("No local config.js found, which is expected in production");
  }

  // 3. Check if running in Vite dev environment
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (url && key) {
      console.log("✅ Environment variables loaded from Vite");
      return { url, key };
    }
  }

  // 4. Check process.env (Node.js environment)
  if (typeof process !== "undefined" && process.env) {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    if (url && key) {
      console.log("✅ Environment variables loaded from process.env");
      return { url, key };
    }
  }

  return { url: null, key: null };
}

export async function init() {
  try {
    const { url: supabaseUrl, key: supabaseKey } =
      await getEnvironmentVariables();

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Missing Supabase environment variables. Please check your .env file or Vercel environment settings."
      );
    }

    supabase = createClient(supabaseUrl, supabaseKey);

    // Test connection
    const { error } = await supabase
      .from("daily_records")
      .select("count")
      .limit(1);
    if (error && error.code === "42P01") {
      // Tables don't exist, create them
      await createTables();
    }

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
    console.error("Supabase initialization failed:", error);
    throw error;
  }
}

async function createTables() {
  try {
    // Note: In a real Supabase setup, you would create these tables via the Supabase dashboard
    // or SQL editor, not through the client. This is just for reference.
    console.log(
      "Tables should be created in Supabase dashboard with the following structure:"
    );
    console.log(`
      -- Daily records table
      CREATE TABLE daily_records (
        date TEXT PRIMARY KEY,
        hours REAL DEFAULT 0,
        workout TEXT DEFAULT 'No',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Time entries table  
      CREATE TABLE time_entries (
        id SERIAL PRIMARY KEY,
        date TEXT NOT NULL,
        hours REAL NOT NULL,
        type TEXT NOT NULL, -- 'manual' or 'stopwatch'
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Enable Row Level Security (RLS)
      ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;
      ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

      -- Create policies (allow all operations for now - you may want to restrict this)
      CREATE POLICY "Allow all operations" ON daily_records FOR ALL USING (true);
      CREATE POLICY "Allow all operations" ON time_entries FOR ALL USING (true);
    `);
  } catch (error) {
    console.error("Table creation reference failed:", error);
  }
}

async function addTimeEntry(date, hours, type, description = "") {
  try {
    const { data, error } = await supabase
      .from("time_entries")
      .insert({
        date,
        hours,
        type,
        description,
      })
      .select("id")
      .single();

    if (error) throw error;

    // Update the daily total
    await updateDailyTotal(date);
    return data.id;
  } catch (error) {
    console.error("Failed to add time entry:", error);
    return false;
  }
}

async function getTimeEntries(date) {
  try {
    const { data, error } = await supabase
      .from("time_entries")
      .select("id, hours, type, description, created_at")
      .eq("date", date)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase error in getTimeEntries:", error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to get time entries:", error);
    return [];
  }
}

async function deleteTimeEntry(entryId) {
  try {
    // Get the date before deleting to update the total
    const { data: entryData, error: getError } = await supabase
      .from("time_entries")
      .select("date")
      .eq("id", entryId)
      .single();

    if (getError) throw getError;

    const { error: deleteError } = await supabase
      .from("time_entries")
      .delete()
      .eq("id", entryId);

    if (deleteError) throw deleteError;

    // Update the daily total
    if (entryData?.date) {
      await updateDailyTotal(entryData.date);
    }
    return true;
  } catch (error) {
    console.error("Failed to delete time entry:", error);
    return false;
  }
}

async function getTotalHoursForDate(date) {
  try {
    const { data, error } = await supabase
      .from("time_entries")
      .select("hours")
      .eq("date", date);

    if (error) throw error;

    const total =
      data?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0;
    return total;
  } catch (error) {
    console.error("Failed to get total hours:", error);
    return 0;
  }
}

async function updateDailyTotal(date) {
  try {
    const totalHours = await getTotalHoursForDate(date);

    // Check if record exists
    const { data: existingData } = await supabase
      .from("daily_records")
      .select("workout")
      .eq("date", date);

    const workout =
      existingData && existingData.length > 0 ? existingData[0].workout : "No";

    const { error } = await supabase.from("daily_records").upsert({
      date,
      hours: totalHours,
      workout,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  } catch (error) {
    console.error("Failed to update daily total:", error);
  }
}

async function getRecord(date) {
  try {
    const { data, error } = await supabase
      .from("daily_records")
      .select("hours, workout")
      .eq("date", date);

    if (error) {
      throw error;
    }

    // Return first record if exists, otherwise return default
    return data && data.length > 0 ? data[0] : { hours: 0, workout: "No" };
  } catch (error) {
    console.error("Failed to get record:", error);
    return { hours: 0, workout: "No" };
  }
}

async function insertOrUpdateRecord(date, hours, workout) {
  try {
    const { error } = await supabase.from("daily_records").upsert({
      date,
      hours,
      workout: workout ? "Yes" : "No",
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Failed to insert/update record:", error);
    return false;
  }
}

async function deleteRecord(date) {
  try {
    // Delete all time entries for this date
    const { error: entriesError } = await supabase
      .from("time_entries")
      .delete()
      .eq("date", date);

    if (entriesError) throw entriesError;

    // Delete the daily record
    const { error: recordError } = await supabase
      .from("daily_records")
      .delete()
      .eq("date", date);

    if (recordError) throw recordError;
    return true;
  } catch (error) {
    console.error("Failed to delete record:", error);
    return false;
  }
}

async function getAllRecords() {
  try {
    const { data, error } = await supabase
      .from("daily_records")
      .select("date, hours, workout")
      .order("date", { ascending: false });

    if (error) {
      console.error("Supabase error in getAllRecords:", error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to get all records:", error);
    return [];
  }
}

async function getStatistics(timeRange = "week") {
  try {
    const defaultStats = {
      totalDays: 0,
      totalHours: 0,
      avgHours: 0,
      workoutDays: 0,
      workoutPercentage: 0,
      recentData: [],
    };

    // Build query based on time range
    let query = supabase
      .from("daily_records")
      .select("date, hours, workout")
      .order("date", { ascending: false });

    // Add date filter for past week if needed
    if (timeRange === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split("T")[0];
      query = query.gte("date", weekAgoStr);
    }

    // Get all records
    const { data: records, error } = await query;

    if (error) {
      console.error("Supabase error in getStatistics:", error);
      return defaultStats;
    }

    if (!Array.isArray(records) || records.length === 0) {
      return defaultStats;
    }

    const stats = {
      totalDays: records.length,
      totalHours: records.reduce(
        (sum, record) => sum + (parseFloat(record?.hours) || 0),
        0
      ),
      avgHours: 0,
      workoutDays: records.filter((record) => record?.workout === "Yes").length,
      workoutPercentage: 0,
      recentData: [],
    };

    stats.avgHours =
      stats.totalDays > 0 ? stats.totalHours / stats.totalDays : 0;
    stats.workoutPercentage =
      stats.totalDays > 0 ? (stats.workoutDays / stats.totalDays) * 100 : 0;

    // Get recent data for chart - limit based on time range
    const limit = timeRange === "week" ? 7 : 30;
    stats.recentData = records
      .slice(0, limit)
      .reverse()
      .map((record) => ({
        date: record?.date || "",
        hours: parseFloat(record?.hours) || 0,
        workout: record?.workout === "Yes",
      }));

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
