#!/usr/bin/env node

/**
 * Script to update the API URL in service-worker.js
 * This allows the Chrome extension to point to the correct Vercel deployment URL
 * 
 * Usage:
 *   node scripts/update-service-worker-url.js <API_URL>
 * 
 * Example:
 *   node scripts/update-service-worker-url.js https://your-project.vercel.app
 */

const fs = require('fs');
const path = require('path');

const API_URL = process.argv[2];

if (!API_URL) {
  console.error('Error: API URL is required');
  console.log('Usage: node scripts/update-service-worker-url.js <API_URL>');
  console.log('Example: node scripts/update-service-worker-url.js https://your-project.vercel.app');
  process.exit(1);
}

// Ensure URL doesn't end with a slash
const cleanApiUrl = API_URL.replace(/\/$/, '');
const serviceWorkerPath = path.join(__dirname, '..', 'public', 'service-worker.js');

if (!fs.existsSync(serviceWorkerPath)) {
  console.error(`Error: service-worker.js not found at ${serviceWorkerPath}`);
  process.exit(1);
}

let content = fs.readFileSync(serviceWorkerPath, 'utf8');

// Replace the TASK_API_BASE constant
// Match the pattern: const TASK_API_BASE = "..." or const TASK_API_BASE = ...;
const pattern = /const\s+TASK_API_BASE\s*=\s*["'].*?["'](?:\s*\.replace\([^)]+\))?\s*;/;
const replacement = `const TASK_API_BASE = "${cleanApiUrl}/api/tasks";`;

if (pattern.test(content)) {
  content = content.replace(pattern, replacement);
  fs.writeFileSync(serviceWorkerPath, content, 'utf8');
  console.log(`✓ Updated service-worker.js with API URL: ${cleanApiUrl}/api/tasks`);
} else {
  console.error('Error: Could not find TASK_API_BASE constant in service-worker.js');
  console.log('Please update manually or check the file structure.');
  process.exit(1);
}
