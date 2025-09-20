#!/usr/bin/env node

/**
 * Database Schema Validation Script
 * 
 * Validates that all Mongoose schemas match the authoritative documentation
 * in docs/entity-reference/database-models.md and follow naming standards
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Expected schema patterns based on database-models.md
const SCHEMA_REQUIREMENTS = {
  // Fields that should be present in all synced entity models
  synced_entities: {
    required_fields: [
      'broadstreet_id',
      'name',
      'created_locally',
      'synced_with_api',
      'created_at',
      'synced_at'
    ],
    field_types: {
      'broadstreet_id': 'Number',
      'name': 'String',
      'created_locally': 'Boolean',
      'synced_with_api': 'Boolean',
      'created_at': 'Date',
      'synced_at': 'Date'
    },
    constraints: {
      'broadstreet_id': ['required: true', 'unique: true'],
      'name': ['required: true'],
      'created_locally': ['default: false'],
      'synced_with_api': ['default: true']
    }
  },
  
  // Fields that should be present in all local entity models
  local_entities: {
    required_fields: [
      'name',
      'network_id',
      'created_locally',
      'synced_with_api',
      'created_at',
      'synced_at',
      'original_broadstreet_id',
      'sync_errors'
    ],
    field_types: {
      'name': 'String',
      'network_id': 'Number',
      'created_locally': 'Boolean',
      'synced_with_api': 'Boolean',
      'created_at': 'Date',
      'synced_at': 'Date',
      'original_broadstreet_id': 'Number',
      'sync_errors': '[String]'
    },
    constraints: {
      'name': ['required: true'],
      'network_id': ['required: true'],
      'created_locally': ['default: true'],
      'synced_with_api': ['default: false'],
      'sync_errors': ['default: []']
    }
  },
  
  // Common schema options that should be present
  schema_options: [
    'timestamps: true',
    'toJSON: { virtuals: true }',
    'toObject: { virtuals: true }',
    'id: false'
  ],
  
  // Virtual fields that should be present
  required_virtuals: [
    'mongo_id'
  ],
  
  // Forbidden patterns
  forbidden_patterns: [
    /\bid:\s*{/g,                    // Generic 'id' field definition
    /\bmongodb_id\b/g,               // Wrong spelling
    /\bmongoId\b/g,                  // Wrong case
    /\bobjectId\b/g,                 // Wrong concept
  ]
};

function validateSchemas() {
  console.log('\ud83d\udd0d Starting database schema validation...\n');
  
  const modelsDir = './src/lib/models';
  const issues = [];
  const warnings = [];
  
  try {
    const modelFiles = fs.readdirSync(modelsDir);
    
    modelFiles.forEach(file => {
      if (file.endsWith('.ts')) {
        const results = validateModelFile(path.join(modelsDir, file));
        issues.push(...results.issues);
        warnings.push(...results.warnings);
      }
    });
    
    return { issues, warnings };
  } catch (err) {
    issues.push(`Failed to read models directory: ${err.message}`);
    return { issues, warnings };
  }
}

function validateModelFile(filePath) {
  const issues = [];
  const warnings = [];
  const fileName = path.basename(filePath);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Determine entity type
    const isLocalEntity = fileName.startsWith('local-');
    const isSyncedEntity = !isLocalEntity && !['placement.ts', 'theme.ts', 'sync-log.ts'].includes(fileName);
    
    // Check for forbidden patterns
    SCHEMA_REQUIREMENTS.forbidden_patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        issues.push(`${fileName}: Contains forbidden pattern: ${matches.join(', ')}`);
      }
    });
    
    // Extract schema definition
    const schemaMatch = content.match(/const \w+Schema = new Schema<\w+>\(\{([\s\S]*?)\},\s*\{([\s\S]*?)\}/);
    if (!schemaMatch) {
      issues.push(`${fileName}: Could not find schema definition`);
      return { issues, warnings };
    }
    
    const [, schemaFields, schemaOptions] = schemaMatch;
    
    // Validate schema options
    SCHEMA_REQUIREMENTS.schema_options.forEach(option => {
      // More flexible matching for schema options
      const optionKey = option.split(':')[0].trim();
      if (!schemaOptions.includes(optionKey) && !schemaOptions.includes(option)) {
        issues.push(`${fileName}: Missing schema option: ${option}`);
      }
    });
    
    // Validate required fields based on entity type
    let requirements;
    if (isLocalEntity) {
      requirements = SCHEMA_REQUIREMENTS.local_entities;
    } else if (isSyncedEntity) {
      requirements = SCHEMA_REQUIREMENTS.synced_entities;
    } else {
      // Skip validation for special entities (placement, theme, sync-log)
      return { issues, warnings };
    }
    
    // Check required fields
    requirements.required_fields.forEach(field => {
      if (!schemaFields.includes(`${field}:`)) {
        issues.push(`${fileName}: Missing required field: ${field}`);
      }
    });
    
    // Check field types
    Object.entries(requirements.field_types).forEach(([field, expectedType]) => {
      const fieldMatch = schemaFields.match(new RegExp(`${field}:\\s*\\{[^}]*type:\\s*(\\w+(?:\\[\\w+\\])?)`));
      if (fieldMatch) {
        const actualType = fieldMatch[1];
        if (actualType !== expectedType) {
          warnings.push(`${fileName}: Field '${field}' type is '${actualType}', expected '${expectedType}'`);
        }
      }
    });
    
    // Check constraints
    Object.entries(requirements.constraints).forEach(([field, expectedConstraints]) => {
      expectedConstraints.forEach(constraint => {
        const fieldSection = extractFieldSection(schemaFields, field);
        if (fieldSection && !fieldSection.includes(constraint)) {
          warnings.push(`${fileName}: Field '${field}' missing constraint: ${constraint}`);
        }
      });
    });
    
    // Check for virtual fields
    SCHEMA_REQUIREMENTS.required_virtuals.forEach(virtual => {
      if (!content.includes(`virtual('${virtual}')`)) {
        issues.push(`${fileName}: Missing required virtual field: ${virtual}`);
      }
    });
    
    // Check for lean virtuals plugin
    if (!content.includes('leanVirtuals')) {
      warnings.push(`${fileName}: Missing mongoose-lean-virtuals plugin`);
    }
    
    // Check for proper model export
    if (!content.includes('mongoose.models.') || !content.includes('mongoose.model<')) {
      warnings.push(`${fileName}: Non-standard model export pattern`);
    }
    
  } catch (err) {
    issues.push(`${fileName}: Failed to read file: ${err.message}`);
  }
  
  return { issues, warnings };
}

function extractFieldSection(schemaContent, fieldName) {
  const fieldRegex = new RegExp(`${fieldName}:\\s*\\{([^}]*)\\}`, 's');
  const match = schemaContent.match(fieldRegex);
  return match ? match[1] : null;
}

function generateReport(results) {
  console.log('\ud83d\udccb DATABASE SCHEMA VALIDATION REPORT');
  console.log('='.repeat(50));
  console.log(`Generated: ${new Date().toISOString()}`);
  console.log('');
  
  const { issues, warnings } = results;
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log('\u2705 All schemas are valid and consistent!');
    console.log('   • All required fields present');
    console.log('   • No forbidden patterns found');
    console.log('   • Schema options correctly configured');
    console.log('   • Virtual fields properly implemented');
    return;
  }
  
  if (issues.length > 0) {
    console.log('\ud83d\udea8 CRITICAL ISSUES (Must Fix):');
    console.log('-'.repeat(30));
    issues.forEach(issue => {
      console.log(`   \u274c ${issue}`);
    });
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('\u26a0\ufe0f  WARNINGS (Should Review):');
    console.log('-'.repeat(30));
    warnings.forEach(warning => {
      console.log(`   \u26a0\ufe0f  ${warning}`);
    });
    console.log('');
  }
  
  console.log('\ud83d\udcca SUMMARY:');
  console.log(`   \ud83d\udea8 Critical Issues: ${issues.length}`);
  console.log(`   \u26a0\ufe0f  Warnings: ${warnings.length}`);
  console.log(`   \ud83d\udcc1 Models Validated: ${fs.readdirSync('./src/lib/models').filter(f => f.endsWith('.ts')).length}`);
  
  if (issues.length > 0) {
    console.log('\n\ud83d\udd27 RECOMMENDED ACTIONS:');
    console.log('   1. Fix all critical issues immediately');
    console.log('   2. Review warnings for consistency');
    console.log('   3. Ensure all schemas match database-models.md');
    console.log('   4. Run tests after making changes');
    console.log('   5. Update documentation if needed');
  }
  
  console.log('\n\ud83d\udcd6 REFERENCE:');
  console.log('   • Database Models: docs/entity-reference/database-models.md');
  console.log('   • ID Standards: docs/entity-reference/ids.md');
  console.log('   • Field Naming: docs/database-id-consistency.md');
}

// Main execution
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const startTime = Date.now();
  const results = validateSchemas();
  const endTime = Date.now();
  
  console.log(`\u23f1\ufe0f  Validation completed in ${endTime - startTime}ms\n`);
  
  generateReport(results);
  
  // Exit with error code if critical issues found
  process.exit(results.issues.length > 0 ? 1 : 0);
}

export { validateSchemas, validateModelFile, generateReport };

