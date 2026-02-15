#!/usr/bin/env node
/**
 * Workaround for Vercel path bug: deployment looks for
 * /vercel/path0/vercel/path0/.next/routes-manifest.json
 * Create that path so the deployment step finds the file.
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const dup = "vercel/path0/.next";
const target = join(process.cwd(), dup);
const source = join(process.cwd(), ".next");

if (!existsSync(source)) {
  console.error("No .next folder found. Run next build first.");
  process.exit(1);
}

mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
console.log("Vercel path workaround: copied .next to", dup);
