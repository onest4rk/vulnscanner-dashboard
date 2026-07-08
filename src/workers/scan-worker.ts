import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import { prisma } from "../lib/prisma";
import type { Severity, FindingStatus } from "@prisma/client";

const execFileAsync = promisify(execFile);
const NMAP_BINARY = process.env.NMAP_BINARY || "/usr/bin/nmap";
const SCAN_OUTPUT_DIR = process.env.SCAN_OUTPUT_DIR || "/tmp/scan-output";

function parseNmapXml(xml: string): Array<{
  ip: string;
  hostname: string;
  status: string;
  osGuess: string;
  ports: Array<{ port: number; protocol: string; state: string; service: string; version: string }>;
}> {
  const hosts: Array<any> = [];
  const hostRegex = /<host>([\s\S]*?)<\/host>/g;
  let hostMatch: RegExpExecArray | null;

  while ((hostMatch = hostRegex.exec(xml)) !== null) {
    const hostBlock = hostMatch[1];
    const statusMatch = hostBlock.match(/<status state="([^"]+)"\/>/);
    const addrMatch = hostBlock.match(/<address addr="([^"]+)" addrtype="ipv4"/);
    const hostnameMatch = hostBlock.match(/<hostname name="([^"]+)"/);
    const osMatch = hostBlock.match(/<osmatch name="([^"]+)"/);

    const ports: Array<any> = [];
    const portRegex = /<port protocol="([^"]+)" portid="(\d+)">([\s\S]*?)<\/port>/g;
    let portMatch: RegExpExecArray | null;

    while ((portMatch = portRegex.exec(hostBlock)) !== null) {
      const proto = portMatch[1];
      const portNum = parseInt(portMatch[2], 10);
      const portBlock = portMatch[3];
      const stateMatch = portBlock.match(/<state state="([^"]+)"\/>/);
      const serviceMatch = portBlock.match(/<service name="([^"]+)"(?: product="([^"]*)")?(?: version="([^"]*)")?/);

      ports.push({
        port: portNum,
        protocol: proto,
        state: stateMatch ? stateMatch[1] : "unknown",
        service: serviceMatch ? serviceMatch[1] : "",
        version: serviceMatch && serviceMatch[3] ? serviceMatch[3] : "",
      });
    }

    hosts.push({
      ip: addrMatch ? addrMatch[1] : "unknown",
      hostname: hostnameMatch ? hostnameMatch[1] : "",
      status: statusMatch ? statusMatch[1] : "unknown",
      osGuess: osMatch ? osMatch[1] : "",
      ports,
    });
  }

  return hosts;
}

function generateFindings(
  scanRunId: string,
  hosts: Array<{ ip: string; ports: Array<{ port: number; service: string; version: string }> }>
) {
  const findings: Array<any> = [];

  for (const host of hosts) {
    for (const p of host.ports) {
      if (p.port === 22) {
        findings.push({
          scanRunId,
          title: `SSH Exposed on ${host.ip}`,
          description: `SSH service (${p.version || "unknown version"}) is exposed on ${host.ip}:22.`,
          severity: "MEDIUM",
          cvss: 5.3,
          status: "OPEN",
          pluginId: "SSH-001",
          pluginName: "SSH Exposure Check",
          remediation: "Restrict SSH access by IP allowlist and use key-based authentication.",
        });
      }
      if (p.port === 5432) {
        findings.push({
          scanRunId,
          title: `PostgreSQL Exposed on ${host.ip}`,
          description: `PostgreSQL database (${p.version || "unknown version"}) is exposed on ${host.ip}:5432.`,
          severity: "CRITICAL",
          cvss: 9.1,
          status: "OPEN",
          pluginId: "DB-003",
          pluginName: "Database Exposure Check",
          remediation: "Restrict PostgreSQL to trusted IPs and use strong authentication.",
        });
      }
      if (p.port === 3306) {
        findings.push({
          scanRunId,
          title: `MySQL Exposed on ${host.ip}`,
          description: `MySQL database (${p.version || "unknown version"}) is exposed on ${host.ip}:3306.`,
          severity: "CRITICAL",
          cvss: 8.8,
          status: "OPEN",
          pluginId: "DB-004",
          pluginName: "MySQL Exposure Check",
          remediation: "Restrict MySQL to trusted IPs and use strong authentication.",
        });
      }
      if (p.port === 80 || p.port === 443) {
        findings.push({
          scanRunId,
          title: `Web Server Detected on ${host.ip}:${p.port}`,
          description: `${p.service} (${p.version || "unknown version"}) running on ${host.ip}:${p.port}.`,
          severity: "LOW",
          cvss: 2.6,
          status: "OPEN",
          pluginId: "WEB-001",
          pluginName: "Web Server Detection",
          remediation: "Ensure web server is patched and uses HTTPS with secure ciphers.",
        });
      }
      if (p.port === 21) {
        findings.push({
          scanRunId,
          title: `FTP Exposed on ${host.ip}`,
          description: `FTP service (${p.version || "unknown version"}) is exposed on ${host.ip}:21. FTP transmits credentials in cleartext.`,
          severity: "HIGH",
          cvss: 7.4,
          status: "OPEN",
          pluginId: "FTP-001",
          pluginName: "FTP Exposure Check",
          remediation: "Replace FTP with SFTP or FTPS. Disable anonymous access.",
        });
      }
      if (p.port === 23) {
        findings.push({
          scanRunId,
          title: `Telnet Exposed on ${host.ip}`,
          description: `Telnet service (${p.version || "unknown version"}) is exposed on ${host.ip}:23. Telnet is unencrypted.`,
          severity: "HIGH",
          cvss: 7.8,
          status: "OPEN",
          pluginId: "TELNET-001",
          pluginName: "Telnet Exposure Check",
          remediation: "Disable Telnet and use SSH instead.",
        });
      }
    }
  }

  if (findings.length === 0) {
    findings.push({
      scanRunId,
      title: "No Major Findings",
      description: "No significant vulnerabilities detected on open ports.",
      severity: "NONE",
      cvss: 0,
      status: "OPEN",
      pluginId: "INFO-001",
      pluginName: "Informational Check",
      remediation: "Continue routine monitoring.",
    });
  }

  return findings;
}

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

  const target = scanRun.job.target.target;
  console.log("[ScanWorker] Setting scan run " + scanRunId + " to RUNNING for target " + target);

  await prisma.scanRun.update({
    where: { id: scanRunId },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  let rawOutput = "";
  let exitCode = 0;
  let parsedHosts: Array<any> = [];

  try {
    if (!fs.existsSync(SCAN_OUTPUT_DIR)) {
      fs.mkdirSync(SCAN_OUTPUT_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputFile = path.join(SCAN_OUTPUT_DIR, `nmap_${target}_${timestamp}.xml`);

    console.log("[ScanWorker] Running nmap against " + target);

    const { stdout, stderr } = await execFileAsync(NMAP_BINARY, [
      "-sV", "-sC", "-O",
      "-oX", outputFile,
      target,
    ], { timeout: 600000 });

    rawOutput = stdout + "\n" + stderr;

    if (fs.existsSync(outputFile)) {
      const xmlContent = fs.readFileSync(outputFile, "utf-8");
      rawOutput += "\n\n--- XML Output ---\n" + xmlContent;
      parsedHosts = parseNmapXml(xmlContent);
      console.log("[ScanWorker] Parsed " + parsedHosts.length + " hosts from nmap output");
    } else {
      rawOutput += "\n\n[ERROR] No XML output file was created by nmap";
    }

    console.log("[ScanWorker] nmap completed for target " + target);
  } catch (err: any) {
    exitCode = err.code || 1;
    rawOutput = err.stdout || "";
    rawOutput += "\n" + (err.stderr || "");
    rawOutput += "\n\n[ERROR] " + (err.message || "Unknown error");
    console.error("[ScanWorker] nmap failed for target " + target + ": " + (err.message || "Unknown error"));
  }

  for (const host of parsedHosts) {
    const created = await prisma.hostResult.create({
      data: {
        scanRunId,
        ip: host.ip,
        hostname: host.hostname,
        status: host.status,
        osGuess: host.osGuess,
        ports: {
          create: host.ports.map((p: any) => ({
            port: p.port,
            protocol: p.protocol,
            state: p.state,
            service: p.service,
            version: p.version,
          })),
        },
      },
    });
    console.log("[ScanWorker] Stored host " + created.ip + " with " + host.ports.length + " ports");
  }

  if (parsedHosts.length > 0) {
    const findings = generateFindings(scanRunId, parsedHosts);
    if (findings.length > 0) {
      await prisma.finding.createMany({ data: findings as any });
      console.log("[ScanWorker] Created " + findings.length + " findings");
    }
  }

  const completedAt = new Date();
  const duration = Math.floor(
    (completedAt.getTime() - (scanRun.startedAt?.getTime() || scanRun.createdAt.getTime())) / 1000
  );

  const finalStatus = exitCode === 0 ? "COMPLETED" : "FAILED";

  await prisma.scanRun.update({
    where: { id: scanRunId },
    data: {
      status: finalStatus,
      completedAt,
      duration,
      rawOutput: rawOutput.slice(0, 50000),
      exitCode,
      errorLog: exitCode !== 0 ? rawOutput.slice(0, 5000) : "",
    },
  });

  console.log("[ScanWorker] Scan run " + scanRunId + " " + finalStatus + " in " + duration + "s");
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

if (require.main === module) {
  run().catch(console.error);
}
