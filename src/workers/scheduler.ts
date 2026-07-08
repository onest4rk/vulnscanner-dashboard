import cron from "node-cron";
import { prisma } from "../lib/prisma";

export async function checkScheduledJobs(): Promise<void> {
  console.log("[Scheduler] Checking scheduled jobs...");

  const targets = await prisma.scanTarget.findMany({
    where: {
      enabled: true,
      scanFrequency: { not: "" },
    },
    include: {
      scanJobs: {
        where: { scheduled: true },
      },
    },
  });

  console.log("[Scheduler] Found " + targets.length + " enabled targets with scan frequency");

  for (const target of targets) {
    if (!cron.validate(target.scanFrequency)) {
      console.log("[Scheduler] Invalid cron expression for target " + target.name + ": " + target.scanFrequency);
      continue;
    }

    for (const job of target.scanJobs) {
      const lastRun = await prisma.scanRun.findFirst({
        where: { jobId: job.id },
        orderBy: { createdAt: "desc" },
      });

      const now = new Date();
      let shouldTrigger = false;

      if (!lastRun) {
        shouldTrigger = true;
      } else {
        const elapsed = now.getTime() - lastRun.createdAt.getTime();
        const freqParts = target.scanFrequency.split(" ");
        const intervalMinutes = freqParts.length >= 2 ? parseInt(freqParts[1]) || 60 : 60;

        if (elapsed >= intervalMinutes * 60 * 1000) {
          shouldTrigger = true;
        }
      }

      if (shouldTrigger) {
        console.log("[Scheduler] Triggering scan run for job " + job.id + " on target " + target.name);

        try {
          const run = await prisma.scanRun.create({
            data: {
              jobId: job.id,
              status: "PENDING",
            },
          });

          await prisma.scheduleLog.create({
            data: {
              jobId: job.id,
              invokedAt: new Date(),
              output: "Triggered by scheduler",
            },
          });

          console.log("[Scheduler] Created scan run " + run.id + " for job " + job.id);
        } catch (err) {
          console.error("[Scheduler] Failed to trigger scan for job " + job.id + ":", err);
        }
      }
    }
  }

  console.log("[Scheduler] Check complete");
}

export function startScheduler(): void {
  console.log("[Scheduler] Starting scheduler...");

  cron.schedule("* * * * *", () => {
    checkScheduledJobs().catch((err) => {
      console.error("[Scheduler] Error in scheduled check:", err);
    });
  });

  console.log("[Scheduler] Scheduler running (every minute)");
}

if (require.main === module) {
  startScheduler();
}
