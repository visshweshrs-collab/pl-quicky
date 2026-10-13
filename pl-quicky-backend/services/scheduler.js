const cron = require("node-cron");
const { syncFixtures, syncLiveMatches } = require("../scripts/sync_fixtures");

let isHourlySyncRunning = false;
let isLiveSyncRunning = false;

let schedulerStats = {
  startedAt: null,
  hourlyCronExpression: "0 * * * *",
  liveCronExpression: "*/2 * * * *",
  fullSyncRunCount: 0,
  liveSyncRunCount: 0,
  lastFullSyncAt: null,
  lastLiveSyncAt: null,
  lastFullSyncResult: null,
  lastLiveSyncResult: null
};

let hourlyJob = null;
let liveJob = null;

/**
 * Executes a full fixture synchronization with exact logging format.
 */
async function runFullSync(triggerSource = "automatic") {
  if (isHourlySyncRunning) {
    console.log(`[Scheduler] Full sync already in progress, skipping (${triggerSource}).`);
    return { skipped: true, reason: "in_progress" };
  }

  isHourlySyncRunning = true;
  console.log("Fixture sync started");

  try {
    const result = await syncFixtures();
    console.log(`Updated ${result.updatedCount} fixtures`);
    console.log(`Inserted ${result.insertedCount} new fixtures`);
    console.log("Sync completed");

    schedulerStats.fullSyncRunCount++;
    schedulerStats.lastFullSyncAt = new Date().toISOString();
    schedulerStats.lastFullSyncResult = result;

    return result;
  } catch (error) {
    console.error(`[Scheduler] Fixture sync error (${triggerSource}):`, error.message);
    return { error: error.message };
  } finally {
    isHourlySyncRunning = false;
  }
}

/**
 * Checks for and synchronizes actively live matches.
 */
async function runLiveSync() {
  if (isLiveSyncRunning || isHourlySyncRunning) {
    return;
  }

  isLiveSyncRunning = true;
  try {
    const result = await syncLiveMatches();
    schedulerStats.liveSyncRunCount++;
    schedulerStats.lastLiveSyncAt = new Date().toISOString();
    schedulerStats.lastLiveSyncResult = result;

    if (result && result.activeCount > 0) {
      console.log(`[Scheduler] Live monitor: synced ${result.activeCount} active match(es), updated: ${result.updatedCount}`);
    } else {
      console.log(`[Scheduler] Live monitor check: 0 active matches in live window (${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })} IST)`);
    }

    return result;
  } catch (error) {
    console.error("[Scheduler] Live match sync error:", error.message);
    return { error: error.message };
  } finally {
    isLiveSyncRunning = false;
  }
}

/**
 * Returns current scheduler status and statistics.
 */
function getSchedulerStatus() {
  return {
    active: hourlyJob !== null && liveJob !== null,
    schedules: {
      hourlyFullSync: {
        cron: schedulerStats.hourlyCronExpression,
        description: "Runs at minute 0 of every hour to detect new fixtures, completed matches, updated statuses, and rescheduled dates"
      },
      liveMatchMonitor: {
        cron: schedulerStats.liveCronExpression,
        description: "Runs every 2 minutes to detect active live matches and update real-time scores and status without polling every second"
      }
    },
    stats: schedulerStats
  };
}

/**
 * Initializes background cron schedules.
 */
function initScheduler() {
  // If jobs are already active (e.g. In case of re-import), stop them first to prevent duplicates
  if (hourlyJob) {
    hourlyJob.stop();
  }
  if (liveJob) {
    liveJob.stop();
  }

  schedulerStats.startedAt = new Date().toISOString();
  console.log("[Scheduler] Initializing automatic fixture synchronization scheduler...");

  // 1. Regular full fixture sync: runs once every hour (at minute 0)
  // Cron expression: "0 * * * *"
  hourlyJob = cron.schedule(schedulerStats.hourlyCronExpression, async () => {
    console.log("[Scheduler] Hourly fixture sync triggered by cron schedule.");
    await runFullSync("hourly_cron");
  });

  // 2. Active live match monitor: runs every 2 minutes
  // Cron expression: "*/2 * * * *"
  // During an actively live match, updates scores/status every 2 minutes without polling every second.
  liveJob = cron.schedule(schedulerStats.liveCronExpression, async () => {
    await runLiveSync();
  });

  console.log("[Scheduler] Automatic fixture synchronization scheduler started (Hourly full sync: '0 * * * *', Live monitor: '*/2 * * * *').");

  // Run a non-blocking startup check shortly after boot to catch any live or overdue matches
  setTimeout(() => {
    runLiveSync().catch((err) => {
      console.warn("[Scheduler] Startup live sync check warning:", err.message);
    });
  }, 3000);

  return {
    hourlyJob,
    liveJob,
    runFullSync,
    runLiveSync,
    getSchedulerStatus
  };
}

module.exports = {
  initScheduler,
  runFullSync,
  runLiveSync,
  getSchedulerStatus
};
