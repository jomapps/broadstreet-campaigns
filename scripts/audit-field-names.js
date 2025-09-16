#!/usr/bin/env node

/**
 * Database Field Name Audit Script
 * 
 * Scans the entire codebase for field name inconsistencies and violations
 * of the standardized naming conventions defined in docs/entity-reference/ids.md
 */

const fs = require('fs');
const path = require('path');

// Field patterns to audit - based on docs/entity-reference/ids.md
const FIELD_PATTERNS = {
  // Forbidden ID patterns
  forbidden_ids: [
    /\b(?:^|[^a-zA-Z_])id(?:[^a-zA-Z_]|$)/g,  // Generic 'id' usage (forbidden)
    /\bmongodb_id\b/g,                         // Wrong spelling
    /\bmongoId\b/g,                           // Wrong case
    /\bobjectId\b/g,                          // Wrong concept
    /\bbroadstreet_advertiser_id\b/g,         // Redundant when context clear
    /\blocal_advertiser_id\b/g,               // Use mongo_id instead
  ],
  
  // Required standard ID patterns
  standard_ids: [
    /\bbroadstreet_id\b/g,                    // Standard Broadstreet ID
    /\bmongo_id\b/g,                          // Standard MongoDB ID string
    /\b_id\b/g,                               // MongoDB native ObjectId
  ],
  
  // Entity-specific ID patterns (acceptable in placement relationships)
  entity_ids: [
    /\badvertiser_id\b/g,
    /\bcampaign_id\b/g,
    /\bzone_id\b/g,
    /\badvertisement_id\b/g,
    /\bnetwork_id\b/g,
    /\bcampaign_mongo_id\b/g,
    /\bzone_mongo_id\b/g,
  ],
  
  // Database field patterns that should match schema exactly
  schema_fields: [
    /\bcreated_locally\b/g,
    /\bsynced_with_api\b/g,
    /\bcreated_at\b/g,
    /\bsynced_at\b/g,
    /\bweb_home_url\b/g,
    /\bvalet_active\b/g,
    /\bself_serve\b/g,
    /\bactive_placement\b/g,
    /\bmax_impression_count\b/g,
    /\bdisplay_type\b/g,
    /\bpacing_type\b/g,
    /\bimpression_max_type\b/g,
    /\boriginal_broadstreet_id\b/g,
    /\bsync_errors\b/g,
  ],
  
  // Potential field name variations that might be incorrect
  suspicious_patterns: [
    /\b\w*[Ii]d\b/g,                          // Any field ending in 'id' or 'Id'
    /\b\w*_id\b/g,                            // Any field ending in '_id'
    /\bmongo\w*\b/g,                          // Any mongo-related field
    /\bbroadstreet\w*\b/g,                    // Any broadstreet-related field
  ]
};

// File extensions to audit
const AUDIT_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Directories to skip
const SKIP_DIRS = ['.git', 'node_modules', '.next', 'dist', 'build'];

function auditDirectory(dirPath, results = {}) {
  try {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !SKIP_DIRS.includes(file) && !file.startsWith('.')) {
          auditDirectory(filePath, results);
        } else if (AUDIT_EXTENSIONS.some(ext => file.endsWith(ext))) {
          auditFile(filePath, results);
        }
      } catch (err) {
        console.warn(`⚠️  Could not process ${filePath}: ${err.message}`);
      }
    });
  } catch (err) {
    console.warn(`⚠️  Could not read directory ${dirPath}: ${err.message}`);
  }
  
  return results;
}

function auditFile(filePath, results) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Skip if file is too large (likely generated)
    if (content.length > 100000) {
      return;
    }
    
    // Check for field pattern violations
    Object.entries(FIELD_PATTERNS).forEach(([category, patterns]) => {
      patterns.forEach((pattern, index) => {
        const matches = [...content.matchAll(pattern)];
        if (matches.length > 0) {
          if (!results[category]) results[category] = {};
          if (!results[category][relativePath]) results[category][relativePath] = [];
          
          const uniqueMatches = [...new Set(matches.map(m => m[0]))];
          results[category][relativePath].push({
            pattern: pattern.toString(),
            matches: uniqueMatches,
            count: matches.length,
            lines: getLineNumbers(content, matches)
          });
        }
      });
    });
  } catch (err) {
    console.warn(`⚠️  Could not read file ${filePath}: ${err.message}`);
  }
}

function getLineNumbers(content, matches) {
  const lines = content.split('\n');
  const lineNumbers = [];
  
  matches.forEach(match => {
    const beforeMatch = content.substring(0, match.index);
    const lineNumber = beforeMatch.split('\n').length;
    lineNumbers.push(lineNumber);
  });
  
  return [...new Set(lineNumbers)].sort((a, b) => a - b);
}

function generateReport(results) {
  console.log('🔍 DATABASE FIELD NAME AUDIT REPORT');
  console.log('=' .repeat(60));
  console.log(`Generated: ${new Date().toISOString()}`);
  console.log('');
  
  let totalIssues = 0;
  let criticalIssues = 0;
  
  // Report forbidden patterns first (critical)
  if (results.forbidden_ids) {
    console.log('🚨 CRITICAL: FORBIDDEN ID PATTERNS');
    console.log('-' .repeat(40));
    Object.entries(results.forbidden_ids).forEach(([file, violations]) => {
      console.log(`\n  📁 ${file}:`);
      violations.forEach(v => {
        console.log(`    ❌ ${v.matches.join(', ')} (${v.count} occurrences)`);
        console.log(`       Lines: ${v.lines.join(', ')}`);
        criticalIssues += v.count;
      });
    });
    totalIssues += criticalIssues;
  }
  
  // Report other categories
  Object.entries(results).forEach(([category, files]) => {
    if (category === 'forbidden_ids') return; // Already reported
    
    console.log(`\n📊 ${category.toUpperCase().replace(/_/g, ' ')}:`);
    console.log('-' .repeat(40));
    
    let categoryCount = 0;
    Object.entries(files).forEach(([file, violations]) => {
      console.log(`\n  📁 ${file}:`);
      violations.forEach(v => {
        console.log(`    • ${v.matches.join(', ')} (${v.count} occurrences)`);
        if (v.lines.length <= 5) {
          console.log(`      Lines: ${v.lines.join(', ')}`);
        } else {
          console.log(`      Lines: ${v.lines.slice(0, 5).join(', ')}... (+${v.lines.length - 5} more)`);
        }
        categoryCount += v.count;
      });
    });
    
    totalIssues += categoryCount;
    console.log(`\n  Total ${category}: ${categoryCount} occurrences`);
  });
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📈 SUMMARY:');
  console.log(`   🚨 Critical Issues: ${criticalIssues}`);
  console.log(`   📊 Total Patterns Found: ${totalIssues}`);
  console.log(`   📁 Files Scanned: ${Object.values(results).reduce((acc, cat) => acc + Object.keys(cat).length, 0)}`);
  
  if (criticalIssues > 0) {
    console.log('\n⚠️  CRITICAL ISSUES FOUND! These must be fixed immediately:');
    console.log('   - Generic "id" fields violate naming standards');
    console.log('   - Use broadstreet_id, mongo_id, or _id instead');
    console.log('   - See docs/entity-reference/ids.md for standards');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('   1. Fix all critical forbidden ID patterns');
  console.log('   2. Review suspicious patterns for consistency');
  console.log('   3. Ensure all schema fields match database-models.md');
  console.log('   4. Run validation tests after fixes');
}

// Main execution
if (require.main === module) {
  console.log('🔍 Starting database field name audit...\n');
  
  const startTime = Date.now();
  const results = auditDirectory('./src');
  const endTime = Date.now();
  
  console.log(`⏱️  Scan completed in ${endTime - startTime}ms\n`);
  
  generateReport(results);
  
  // Exit with error code if critical issues found
  const criticalCount = results.forbidden_ids ? 
    Object.values(results.forbidden_ids).reduce((acc, violations) => 
      acc + violations.reduce((sum, v) => sum + v.count, 0), 0) : 0;
  
  process.exit(criticalCount > 0 ? 1 : 0);
}

module.exports = { auditDirectory, auditFile, generateReport };
