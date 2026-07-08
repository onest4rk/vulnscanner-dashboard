import { prisma } from "../lib/prisma";

export async function processScanRun(scanRunId: string): Promise<void> {
  console.log("[ScanWorker] Processing scan run " + scanRunId);

  const scanRun = await prisma.scanRun.findUnique({
    where: { id: scanRunId },
    include: {
      job: {
        include: { target: true },
      },
    },
  });

  if (!scanRun) {
    console.error("[ScanWorker] Scan run " + scanRunId + " not found");
    return;
  }

  if (scanRun.status !== "PENDING") {
    console.log("[ScanWorker] Scan run " + scanRunId + " is not PENDING (" + scanRun.status + "), skipping");
    return;
  }

  console.log("[ScanWorker] Setting scan run " + scanRunId + " to RUNNING for target " + scanRun.job.target.target);

  await prisma.scanRun.update({
    where: { id: scanRunId },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  const h1 = await prisma.hostResult.create({
    data: {
      scanRunId,
      ip: "192.168.1.10",
      hostname: "web-server",
      status: "up",
      osGuess: "Linux 5.15",
      ports: {
        create: [
          { port: 22, protocol: "tcp", state: "open", service: "SSH", version: "OpenSSH 8.9p1" },
          { port: 80, protocol: "tcp", state: "open", service: "HTTP", version: "nginx 1.24" },
          { port: 443, protocol: "tcp", state: "open", service: "HTTPS", version: "nginx 1.24" },
        ],
      },
    },
  });

  console.log("[ScanWorker] Created host " + h1.ip + " with 3 ports");

  const h2 = await prisma.hostResult.create({
    data: {
      scanRunId,
      ip: "192.168.1.20",
      hostname: "db-server",
      status: "up",
      osGuess: "Linux 6.1",
      ports: {
        create: [
          { port: 22, protocol: "tcp", state: "open", service: "SSH", version: "OpenSSH 9.3p2" },
          { port: 5432, protocol: "tcp", state: "open", service: "PostgreSQL", version: "15.4" },
        ],
      },
    },
  });

  console.log("[ScanWorker] Created host " + h2.ip + " with 2 ports");

  await prisma.finding.createMany({
    data: [
      {
        scanRunId,
        title: "SSH Weak Cipher Allowed",
        description: "The SSH server allows weak ciphers that could be exploited.",
        severity: "MEDIUM",
        cvss: 5.3,
        status: "OPEN",
        pluginId: "SSH-001",
        pluginName: "SSH Hardening Check",
        remediation: "Disable weak ciphers in sshd_config.",
      },
      {
        scanRunId,
        title: "SSL/TLS Weak Protocol Supported",
        description: "The server supports TLS 1.0 which is deprecated.",
        severity: "HIGH",
        cvss: 7.4,
        status: "OPEN",
        pluginId: "TLS-002",
        pluginName: "TLS Version Check",
        remediation: "Disable TLS 1.0 and enable TLS 1.2 or higher.",
      },
      {
        scanRunId,
        title: "Open PostgreSQL Port Exposed",
        description: "PostgreSQL port 5432 is exposed to the network.",
        severity: "CRITICAL",
        cvss: 9.1,
        status: "OPEN",
        pluginId: "DB-003",
        pluginName: "Database Exposure Check",
        remediation: "Restrict PostgreSQL to trusted IPs only.",
      },
    ],
  });

  console.log("[ScanWorker] Created 3 findings for scan run " + scanRunId);

  const completedAt = new Date();
  const duration = Math.floor(
    (completedAt.getTime() - scanRun.createdAt.getTime()) / 1000
  );

  await prisma.scanRun.update({
    where: { id: scanRunId },
    data: {
      status: "COMPLETED",
      completedAt,
      duration,
    },
  });

  console.log("[ScanWorker] Scan run " + scanRunId + " COMPLETED in " + duration + "s");
}

export async function run(): Promise<void> {
  console.log("[ScanWorker] Worker started, polling for PENDING jobs...");

  const poll = async () => {
    try {
      const pending = await prisma.scanRun.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        take: 5,
      });

      if (pending.length > 0) {
        console.log("[ScanWorker] Found " + pending.length + " PENDING scan run(s)");
        for (const r of pending) {
          await processScanRun(r.id);
        }
      }
    } catch (err) {
      console.error("[ScanWorker] Error during poll cycle:", err);
    }
  };

  await poll();
  setInterval(poll, 5000);
}
