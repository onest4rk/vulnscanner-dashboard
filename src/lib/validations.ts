import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const createTargetSchema = z.object({
  name: z.string().min(1).max(200),
  target: z.string().min(1).max(500),
  environment: z.enum(["DEV", "STAGING", "PRODUCTION"]).default("DEV"),
  owner: z.string().max(200).default(""),
  tags: z.string().default(""),
  notes: z.string().default(""),
  scanFrequency: z.string().default(""),
  groupId: z.string().uuid().optional().nullable(),
});

export const updateTargetSchema = createTargetSchema.partial();

export const createScanJobSchema = z.object({
  targetId: z.string().uuid(),
  cronExpr: z.string().default(""),
  scheduled: z.boolean().default(false),
  priority: z.number().int().min(0).max(10).default(0),
  scannerId: z.string().uuid().optional().nullable(),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(200),
  role: z.enum(["ADMIN", "ANALYST", "VIEWER"]).default("VIEWER"),
});

export const updateFindingSchema = z.object({
  status: z.enum([
    "OPEN",
    "IN_PROGRESS",
    "REMEDIATED",
    "ACCEPTED_RISK",
    "FALSE_POSITIVE",
  ]),
  remediation: z.string().optional(),
});

export const allowedTargetRegex =
  /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/\d{1,2})?|[a-zA-Z0-9.-]+)$/;

export function isAllowedTarget(
  target: string,
  allowedRanges: string
): boolean {
  if (!target || !allowedRanges) return false;
  const ranges = allowedRanges.split(",").map((r) => r.trim());
  return ranges.some((range) => target.startsWith(range.replace("/0", "")));
}
