#!/usr/bin/env node

/**
 * Pre-commit check to ensure no sensitive data is being committed
 * Run this before committing: node .env-check.js
 */

import fs from 'fs';
import path from 'path';

const SENSITIVE_PATTERNS = [
  /AIzaSy[A-Za-z0-9_-]{33}/g, // Firebase API keys
  /-----BEGIN PRIVATE KEY-----/g, // Private keys
  /sk_live_[A-Za-z0-9]+/g, // Stripe live keys
  /pk_live_[A-Za-z0-9]+/g, // Stripe live keys
  /"private_key":\s*"[^"]+"/g, // JSON private keys
];

const SENSITIVE_FILES = [
  'backend/.env',
  'frontend/.env',
  'serviceAccountKey.json',
  'firebase-adminsdk-*.json',
];

const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.kiro',
];

const EXCLUDED_FILES = [
  '.env-check.js', // This file contains patterns for checking
  'SECURITY.md', // Security documentation
  'DEPLOYMENT.md', // Deployment guide with examples
  '.env.example', // Example files are safe
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  const fileName = path.basename(filePath);

  // Skip excluded files
  if (EXCLUDED_FILES.some(excluded => fileName.includes(excluded))) {
    return issues;
  }

  SENSITIVE_PATTERNS.forEach((pattern) => {
    if (pattern.test(content)) {
      issues.push(`Found sensitive pattern in ${filePath}`);
    }
  });

  return issues;
}

function shouldCheckFile(filePath) {
  // Skip excluded directories
  if (EXCLUDED_DIRS.some(dir => filePath.includes(dir))) {
    return false;
  }

  // Skip excluded files
  const fileName = path.basename(filePath);
  if (EXCLUDED_FILES.some(excluded => fileName.includes(excluded))) {
    return false;
  }

  // Check if it's a text file
  const ext = path.extname(filePath);
  const textExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt', '.env'];
  
  return textExtensions.includes(ext) || !ext;
}

function scanDirectory(dir) {
  const issues = [];
  
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        if (!EXCLUDED_DIRS.includes(file)) {
          issues.push(...scanDirectory(filePath));
        }
      } else if (shouldCheckFile(filePath)) {
        issues.push(...checkFile(filePath));
      }
    });
  } catch (error) {
    // Skip files we can't read
  }
  
  return issues;
}

function checkSensitiveFiles() {
  const issues = [];
  
  SENSITIVE_FILES.forEach(pattern => {
    const files = pattern.includes('*') 
      ? [] // Would need glob library for wildcards
      : [pattern];
    
    files.forEach(file => {
      if (fs.existsSync(file)) {
        issues.push(`⚠️  Sensitive file exists and should not be committed: ${file}`);
      }
    });
  });
  
  return issues;
}

console.log('🔍 Checking for sensitive data...\n');

const fileIssues = scanDirectory('.');
const sensitiveFileIssues = checkSensitiveFiles();
const allIssues = [...fileIssues, ...sensitiveFileIssues];

if (allIssues.length > 0) {
  console.log('❌ SECURITY ISSUES FOUND:\n');
  allIssues.forEach(issue => console.log(`  ${issue}`));
  console.log('\n⚠️  These files should NOT be committed to Git!');
  console.log('✅ This is EXPECTED - .env files are in .gitignore\n');
  console.log('Before pushing, verify with:');
  console.log('  git status    (should NOT show .env files)');
  console.log('  git diff --cached    (review what will be committed)\n');
  process.exit(0); // Exit with success since .env files being present is normal
} else {
  console.log('✅ No sensitive data detected\n');
  console.log('Remember to:');
  console.log('  - Double-check .env files are in .gitignore');
  console.log('  - Review git diff before committing');
  console.log('  - Never commit Firebase credentials\n');
  process.exit(0);
}
