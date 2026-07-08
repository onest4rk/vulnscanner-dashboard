import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: hashedPassword,
      name: "Admin User",
      role: "ADMIN",
    },
  });
  console.log("Created admin user: " + admin.email);

  const analystPassword = await bcrypt.hash("analyst123", 12);
  const analyst = await prisma.user.upsert({
    where: { email: "analyst@example.com" },
    update: {},
    create: {
      email: "analyst@example.com",
      password: analystPassword,
      name: "Analyst User",
      role: "ANALYST",
    },
  });
  console.log("Created analyst user: " + analyst.email);

  const viewerPassword = await bcrypt.hash("viewer123", 12);
  const viewer = await prisma.user.upsert({
    where: { email: "viewer@example.com" },
    update: {},
    create: {
      email: "viewer@example.com",
      password: viewerPassword,
      name: "Viewer User",
      role: "VIEWER",
    },
  });
  console.log("Created viewer user: " + viewer.email);

  const scanner = await prisma.scannerConfig.upsert({
    where: { id: "seed-scanner-nmap" },
    update: {},
    create: {
      id: "seed-scanner-nmap",
      name: "nmap",
      engine: "nmap",
      binaryPath: "/usr/bin/nmap",
      args: "-sV -sC -O",
      enabled: true,
    },
  });
  console.log("Created scanner config: " + scanner.name);

  const target1 = await prisma.scanTarget.upsert({
    where: { id: "seed-target-web" },
    update: {},
    create: {
      id: "seed-target-web",
      name: "Web Development Server",
      target: "192.168.1.0/24",
      environment: "DEV",
      owner: admin.name,
      tags: "web,development",
      notes: "Main web development environment",
      scanFrequency: "0 2 * * *",
      userId: admin.id,
      enabled: true,
    },
  });
  console.log("Created target: " + target1.name);

  const target2 = await prisma.scanTarget.upsert({
    where: { id: "seed-target-db" },
    update: {},
    create: {
      id: "seed-target-db",
      name: "Database Server",
      target: "10.0.1.5",
      environment: "STAGING",
      owner: admin.name,
      tags: "database,staging",
      notes: "Staging database server with PostgreSQL",
      scanFrequency: "0 4 * * 0",
      userId: admin.id,
      enabled: true,
    },
  });
  console.log("Created target: " + target2.name);

  const target3 = await prisma.scanTarget.upsert({
    where: { id: "seed-target-staging" },
    update: {},
    create: {
      id: "seed-target-staging",
      name: "Staging Environment",
      target: "10.0.2.0/24",
      environment: "STAGING",
      owner: analyst.name,
      tags: "staging,full-stack",
      notes: "Full staging environment for pre-prod testing",
      scanFrequency: "0 6 * * 1",
      userId: analyst.id,
      enabled: true,
    },
  });
  console.log("Created target: " + target3.name);

  const target4 = await prisma.scanTarget.upsert({
    where: { id: "seed-target-prod" },
    update: {},
    create: {
      id: "seed-target-prod",
      name: "Production API Gateway",
      target: "203.0.113.50",
      environment: "PRODUCTION",
      owner: admin.name,
      tags: "production,api",
      notes: "Production API gateway - handle with care",
      scanFrequency: "",
      userId: admin.id,
      enabled: true,
    },
  });
  console.log("Created target: " + target4.name);

  const job1 = await prisma.scanJob.upsert({
    where: { id: "seed-job-web" },
    update: {},
    create: {
      id: "seed-job-web",
      targetId: target1.id,
      userId: admin.id,
      scannerId: scanner.id,
      cronExpr: "0 2 * * *",
      scheduled: true,
      priority: 5,
    },
  });
  console.log("Created scan job: " + job1.id);

  const job2 = await prisma.scanJob.upsert({
    where: { id: "seed-job-db" },
    update: {},
    create: {
      id: "seed-job-db",
      targetId: target2.id,
      userId: admin.id,
      scannerId: scanner.id,
      cronExpr: "0 4 * * 0",
      scheduled: true,
      priority: 3,
    },
  });
  console.log("Created scan job: " + job2.id);

  const run1 = await prisma.scanRun.upsert({
    where: { id: "seed-run-1" },
    update: {},
    create: {
      id: "seed-run-1",
      jobId: job1.id,
      status: "COMPLETED",
      startedAt: new Date("2026-07-07T02:00:00Z"),
      completedAt: new Date("2026-07-07T02:15:30Z"),
      duration: 930,
    },
  });
  console.log("Created scan run: " + run1.id);

  const run2 = await prisma.scanRun.upsert({
    where: { id: "seed-run-2" },
    update: {},
    create: {
      id: "seed-run-2",
      jobId: job2.id,
      status: "COMPLETED",
      startedAt: new Date("2026-07-05T04:00:00Z"),
      completedAt: new Date("2026-07-05T04:08:45Z"),
      duration: 525,
    },
  });
  console.log("Created scan run: " + run2.id);

  const run3 = await prisma.scanRun.upsert({
    where: { id: "seed-run-3" },
    update: {},
    create: {
      id: "seed-run-3",
      jobId: job1.id,
      status: "COMPLETED",
      startedAt: new Date("2026-07-06T02:00:00Z"),
      completedAt: new Date("2026-07-06T02:12:10Z"),
      duration: 730,
    },
  });
  console.log("Created scan run: " + run3.id);

  const host1 = await prisma.hostResult.upsert({
    where: { id: "seed-host-1" },
    update: {},
    create: {
      id: "seed-host-1",
      scanRunId: run1.id,
      ip: "192.168.1.10",
      hostname: "web-dev-01",
      status: "up",
      osGuess: "Ubuntu 22.04",
    },
  });
  console.log("Created host: " + host1.ip);

  const host2 = await prisma.hostResult.upsert({
    where: { id: "seed-host-2" },
    update: {},
    create: {
      id: "seed-host-2",
      scanRunId: run1.id,
      ip: "192.168.1.11",
      hostname: "web-dev-02",
      status: "up",
      osGuess: "Debian 12",
    },
  });
  console.log("Created host: " + host2.ip);

  const host3 = await prisma.hostResult.upsert({
    where: { id: "seed-host-3" },
    update: {},
    create: {
      id: "seed-host-3",
      scanRunId: run2.id,
      ip: "10.0.1.5",
      hostname: "db-staging-01",
      status: "up",
      osGuess: "Rocky Linux 9",
    },
  });
  console.log("Created host: " + host3.ip);

  await prisma.portResult.createMany({
    data: [
      { id: "seed-port-1", hostId: host1.id, port: 22, protocol: "tcp", state: "open", service: "SSH", version: "OpenSSH 8.9p1" },
      { id: "seed-port-2", hostId: host1.id, port: 80, protocol: "tcp", state: "open", service: "HTTP", version: "nginx 1.24" },
      { id: "seed-port-3", hostId: host1.id, port: 443, protocol: "tcp", state: "open", service: "HTTPS", version: "nginx 1.24" },
      { id: "seed-port-4", hostId: host2.id, port: 22, protocol: "tcp", state: "open", service: "SSH", version: "OpenSSH 9.2p1" },
      { id: "seed-port-5", hostId: host2.id, port: 3000, protocol: "tcp", state: "open", service: "Node.js", version: "20.11" },
      { id: "seed-port-6", hostId: host3.id, port: 22, protocol: "tcp", state: "open", service: "SSH", version: "OpenSSH 9.3p2" },
      { id: "seed-port-7", hostId: host3.id, port: 5432, protocol: "tcp", state: "open", service: "PostgreSQL", version: "15.4" },
    ],
    skipDuplicates: true,
  });
  console.log("Created port results");

  await prisma.finding.createMany({
    data: [
      {
        id: "seed-finding-1",
        scanRunId: run1.id,
        title: "SSH Weak Cipher Allowed",
        description: "The SSH server on port 22 allows weak ciphers that could be exploited by attackers.",
        severity: "MEDIUM",
        cvss: 5.3,
        status: "OPEN",
        pluginId: "SSH-001",
        pluginName: "SSH Hardening Check",
        remediation: "Disable weak ciphers in sshd_config and restart the SSH service.",
      },
      {
        id: "seed-finding-2",
        scanRunId: run1.id,
        title: "Missing HTTP Security Headers",
        description: "The web server is missing X-Content-Type-Options and X-Frame-Options headers.",
        severity: "LOW",
        cvss: 3.1,
        status: "OPEN",
        pluginId: "WEB-001",
        pluginName: "Web Security Header Check",
        remediation: "Add security headers to the nginx configuration.",
      },
      {
        id: "seed-finding-3",
        scanRunId: run2.id,
        title: "Open PostgreSQL Port Exposed",
        description: "PostgreSQL port 5432 is exposed to the network without IP restriction.",
        severity: "CRITICAL",
        cvss: 9.1,
        status: "OPEN",
        pluginId: "DB-003",
        pluginName: "Database Exposure Check",
        remediation: "Configure pg_hba.conf to restrict access to trusted IPs only.",
      },
      {
        id: "seed-finding-4",
        scanRunId: run2.id,
        title: "SSL/TLS Weak Protocol Supported",
        description: "The server supports TLS 1.0 which is deprecated and insecure.",
        severity: "HIGH",
        cvss: 7.4,
        status: "IN_PROGRESS",
        pluginId: "TLS-002",
        pluginName: "TLS Version Check",
        remediation: "Disable TLS 1.0 and 1.1, enable TLS 1.2 and 1.3.",
      },
      {
        id: "seed-finding-5",
        scanRunId: run1.id,
        title: "Default Credentials Detected",
        description: "The Node.js application on port 3000 is using default admin credentials.",
        severity: "CRITICAL",
        cvss: 10.0,
        status: "OPEN",
        pluginId: "AUTH-001",
        pluginName: "Default Credential Check",
        remediation: "Change default admin credentials immediately.",
      },
    ],
    skipDuplicates: true,
  });
  console.log("Created findings");

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
