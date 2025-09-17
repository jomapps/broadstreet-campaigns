# Database ID Consistency Audit & Implementation Plan

## Overview

This document outlines a comprehensive audit and remediation plan to ensure **100% consistency** between database field names and their usage across the entire codebase. The goal is to eliminate all variable name inconsistencies, fallback patterns, and guesswork in field naming.

## Reference Standards

All field names must strictly follow the patterns defined in:
- **Primary Reference**: `docs/entity-reference/ids.md` - Single source of truth for ID naming
- **Database Schema**: `docs/entity-reference/database-models.md` - Authoritative field definitions
- **Utility Functions**: `src/lib/utils/entity-helpers.ts` - Standardized ID operations

## Critical Issues Identified

### 1. **ID Field Inconsistencies**
- ❌ Legacy `id` fields in API responses and some components
- ❌ Mixed usage of `broadstreet_id` vs `broadstreet_*_id` patterns
- ❌ Inconsistent `mongo_id` vs `local_*_id` usage
- ❌ Generic field references instead of explicit naming

### 2. **Field Name Variations**
- ❌ `advertiser_id` used inconsistently (sometimes number, sometimes string)
- ❌ `campaign_id` vs `campaign_mongo_id` XOR violations
- ❌ `zone_id` vs `zone_mongo_id` XOR violations
- ❌ Mixed field naming in API routes vs database models

### 3. **Database Schema Mismatches**
- ❌ Frontend components using different field names than database
- ❌ API responses not matching database field structure
- ❌ TypeScript interfaces inconsistent with actual schemas

## Audit Phases

## Phase 1: Database Schema Validation
**Duration**: 2-3 days
**Priority**: Critical

### Tasks:
1. **Model Schema Audit**
   - Verify all Mongoose schemas match `database-models.md`
   - Ensure consistent field naming across all models
   - Validate virtual field implementations
   - Check index definitions match documentation

2. **Interface Consistency Check**
   - Compare TypeScript interfaces with actual schemas
   - Verify `src/lib/types/broadstreet.ts` matches models
   - Validate `src/lib/types/lean-entities.ts` accuracy
   - Check all `IEntity` interfaces in model files

3. **Field Name Standardization**
   - Audit all `*_id` field usage in schemas
   - Verify XOR constraints in placement model
   - Check virtual field naming consistency
   - Validate sync tracking field names

### Deliverables:
- Schema consistency report
- List of field name violations
- Updated model files (if needed)
- Corrected TypeScript interfaces

## Phase 2: API Layer Consistency
**Duration**: 3-4 days  
**Priority**: Critical

### Tasks:
1. **API Route Field Audit**
   - Check all `/api/*` routes for field name consistency
   - Verify request/response field naming
   - Audit query parameter naming
   - Check API response shaping logic

2. **Broadstreet API Integration**
   - Verify `mapApiIds` utility usage
   - Check API response field mapping
   - Audit `src/lib/broadstreet-api.ts` field handling
   - Validate API type definitions

3. **Database Query Consistency**
   - Audit all MongoDB queries for correct field names
   - Check aggregation pipeline field references
   - Verify lean query field usage
   - Validate population field names

### Deliverables:
- API field consistency report
- Corrected API routes
- Updated API integration code
- Standardized query patterns

## Phase 3: Frontend Component Audit
**Duration**: 4-5 days
**Priority**: High

### Tasks:
1. **Component Props Audit**
   - Check all React component prop interfaces
   - Verify field name usage in components
   - Audit state management field names
   - Check form field naming

2. **Entity Display Consistency**
   - Verify `EntityIdBadge` component usage
   - Check entity card field references
   - Audit list/table column field names
   - Validate filter component field usage

3. **Hook and Context Consistency**
   - Check `useFilters` context field names
   - Audit `use-selected-entities.ts` field usage
   - Verify custom hook field handling
   - Check context provider field names

### Deliverables:
- Component field usage report
- Updated component interfaces
- Corrected prop passing patterns
- Standardized display components

## Phase 4: Utility Function Validation
**Duration**: 2-3 days
**Priority**: High

### Tasks:
1. **Entity Helper Functions**
   - Verify `getEntityId()` implementation
   - Check `isEntitySynced()` field usage
   - Audit `resolveSidebarFilterId()` logic
   - Validate all utility function field references

2. **Sync Service Consistency**
   - Check `src/lib/sync-service.ts` field usage
   - Verify sync operation field handling
   - Audit error message field references
   - Check dependency resolution field names

3. **Helper Function Standardization**
   - Audit all helper functions for field consistency
   - Check validation function field usage
   - Verify transformation function field names
   - Validate utility function return types

### Deliverables:
- Utility function audit report
- Corrected helper functions
- Updated validation logic
- Standardized transformation functions

## Phase 5: Test & Documentation Consistency
**Duration**: 2-3 days
**Priority**: Medium

### Tasks:
1. **Test Field Validation**
   - Check test file field name usage
   - Verify mock data field consistency
   - Audit test assertion field names
   - Check integration test field usage

2. **Documentation Updates**
   - Update all documentation with correct field names
   - Verify example code field usage
   - Check API documentation field names
   - Update troubleshooting guides

3. **Migration Scripts**
   - Create database migration scripts if needed
   - Verify backup/restore script field names
   - Check seed data field consistency
   - Update development scripts

### Deliverables:
- Test consistency report
- Updated documentation
- Migration scripts (if needed)
- Corrected example code

## Implementation Strategy

### 1. **No Fallback Patterns**
- Remove all fallback logic like `entity.id || entity.broadstreet_id`
- Eliminate guesswork in field resolution
- Use explicit field names only
- Fail fast on missing required fields

### 2. **Single Source of Truth**
- All field names must match database schema exactly
- Use utility functions for consistent field access
- Centralize field validation logic
- Maintain authoritative documentation

### 3. **Strict Validation**
- Implement runtime field validation
- Add TypeScript strict checks
- Use schema validation in API routes
- Validate field names in tests

### 4. **Progressive Implementation**
- Start with database layer (Phase 1)
- Move up through API layer (Phase 2)
- Fix frontend components (Phase 3)
- Validate utilities (Phase 4)
- Complete with tests/docs (Phase 5)

## Success Criteria

### ✅ **Database Consistency**
- All model schemas match documentation exactly
- No field name variations in database operations
- Consistent virtual field implementations
- Proper index definitions

### ✅ **API Consistency**  
- All API routes use correct field names
- Request/response fields match database schema
- No legacy field name usage
- Consistent query parameter naming

### ✅ **Frontend Consistency**
- All components use correct field names
- Props match database field structure
- No fallback field resolution
- Consistent display patterns

### ✅ **Code Quality**
- No `any` types for entity fields
- Strict TypeScript field validation
- Comprehensive test coverage
- Clear error messages for field issues

## Risk Mitigation

### **Breaking Changes**
- Create comprehensive test suite before changes
- Use feature flags for gradual rollout
- Maintain backward compatibility where possible
- Document all breaking changes

### **Data Integrity**
- Backup database before schema changes
- Validate data migration scripts
- Test field name changes thoroughly
- Monitor for data consistency issues

### **Development Workflow**
- Use linting rules to enforce field naming
- Add pre-commit hooks for field validation
- Create field name validation utilities
- Update development documentation

## Next Steps

1. **Immediate**: Begin Phase 1 database schema audit
2. **Week 1**: Complete database and API layer consistency
3. **Week 2**: Fix frontend component field usage
4. **Week 3**: Validate utilities and complete testing
5. **Week 4**: Final validation and documentation updates

## Audit Tools & Scripts

### Field Name Audit Script
Create `scripts/audit-field-names.js` to automatically scan for inconsistencies:

```javascript
// Field name audit script - identifies all field usage patterns
const fs = require('fs');
const path = require('path');

const FIELD_PATTERNS = {
  // ID fields that should follow strict naming
  ids: [
    /\b(id|ID)\b(?!Badge|Entity)/g,  // Generic 'id' usage (forbidden)
    /\b(broadstreet_id|mongo_id|_id)\b/g,  // Standard ID fields
    /\b(advertiser_id|campaign_id|zone_id|advertisement_id|network_id)\b/g,  // Entity IDs
    /\b(mongodb_id|mongoId|objectId)\b/g,  // Forbidden variations
  ],
  // Field names that should match database schema exactly
  fields: [
    /\b(created_locally|synced_with_api|created_at|synced_at)\b/g,
    /\b(web_home_url|valet_active|self_serve|active_placement)\b/g,
    /\b(max_impression_count|display_type|pacing_type)\b/g,
  ]
};

function auditDirectory(dirPath, results = {}) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      auditDirectory(filePath, results);
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      auditFile(filePath, results);
    }
  });

  return results;
}

function auditFile(filePath, results) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);

  // Check for field pattern violations
  Object.entries(FIELD_PATTERNS).forEach(([category, patterns]) => {
    patterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        if (!results[category]) results[category] = {};
        if (!results[category][relativePath]) results[category][relativePath] = [];
        results[category][relativePath].push({
          pattern: pattern.toString(),
          matches: [...new Set(matches)],
          count: matches.length
        });
      }
    });
  });
}

// Run audit
console.log('🔍 Starting field name audit...\n');
const results = auditDirectory('./src');

// Generate report
console.log('📊 FIELD NAME AUDIT REPORT');
console.log('=' .repeat(50));

Object.entries(results).forEach(([category, files]) => {
  console.log(`\n${category.toUpperCase()} VIOLATIONS:`);
  Object.entries(files).forEach(([file, violations]) => {
    console.log(`\n  📁 ${file}:`);
    violations.forEach(v => {
      console.log(`    ❌ ${v.matches.join(', ')} (${v.count} occurrences)`);
    });
  });
});
```

### Database Schema Validator
Create `scripts/validate-schemas.js` to check model consistency:

```javascript
// Validates that all models match database-models.md documentation
const mongoose = require('mongoose');
const fs = require('fs');

async function validateSchemas() {
  // Load all models
  const modelFiles = fs.readdirSync('./src/lib/models');
  const issues = [];

  for (const file of modelFiles) {
    if (file.endsWith('.ts')) {
      const modelPath = `./src/lib/models/${file}`;
      const content = fs.readFileSync(modelPath, 'utf8');

      // Extract schema field definitions
      const schemaMatch = content.match(/const \w+Schema = new Schema<\w+>\(\{([\s\S]*?)\}/);
      if (schemaMatch) {
        const schemaContent = schemaMatch[1];

        // Check for forbidden field patterns
        if (schemaContent.includes('id:') && !schemaContent.includes('id: false')) {
          issues.push(`${file}: Contains forbidden 'id' field`);
        }

        // Check for required standard fields
        const requiredFields = ['broadstreet_id', 'created_locally', 'synced_with_api'];
        requiredFields.forEach(field => {
          if (!schemaContent.includes(`${field}:`)) {
            issues.push(`${file}: Missing required field '${field}'`);
          }
        });
      }
    }
  }

  return issues;
}

validateSchemas().then(issues => {
  console.log('📋 SCHEMA VALIDATION REPORT');
  console.log('=' .repeat(40));

  if (issues.length === 0) {
    console.log('✅ All schemas are valid!');
  } else {
    issues.forEach(issue => console.log(`❌ ${issue}`));
  }
});
```

---

**This comprehensive audit will establish a rock-solid foundation for consistent field naming across the entire application, eliminating the current chaos of variable names and ensuring maintainable, predictable code.**
