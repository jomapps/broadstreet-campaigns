# Broadstreet Campaigns Documentation

**Version**: 1.0  
**Framework**: Next.js 15.5.2  
**Database**: MongoDB  
**External API**: Broadstreet API v1  

## 📚 Documentation Overview

This documentation system provides comprehensive guidance for the Broadstreet Campaigns application - a modern Next.js dashboard for managing advertising campaigns with local entity creation and API synchronization.

## 🚀 Quick Start

**New to the project?** Start here:
1. [Environment Setup](./setup/environment.md) - Configure your development environment
2. [Application Overview](./guides/application-overview.md) - Understand the system architecture
3. [User Guide](./guides/user-guide.md) - Learn how to use the application
4. [Best Practices](./guides/best-practices.md) - Follow established patterns

**For AI Assistants:** All documentation follows AI-friendly patterns with clear implementation instructions and code examples.

## 📁 Documentation Structure

### 🔧 Setup & Configuration
- **[Environment Setup](./setup/environment.md)** - Environment variables and configuration
- **[Development Setup](./setup/development.md)** - Local development environment

### 📖 User Guides
- **[Application Overview](./guides/application-overview.md)** - High-level system overview
- **[User Guide](./guides/user-guide.md)** - Complete user manual
- **[Best Practices](./guides/best-practices.md)** - Application-specific best practices
- **[Troubleshooting](./guides/troubleshooting.md)** - Common issues and solutions

### 🏗️ Technical Documentation
- **[Architecture](./technical/architecture.md)** - System architecture and design patterns
- **[API Reference](./technical/api-reference.md)** - Internal API endpoints and usage
- **[Database Schema](./technical/database.md)** - MongoDB models and relationships
- **[Components](./technical/components.md)** - UI component documentation
- **[Utilities](./technical/utilities.md)** - Helper functions and utilities

### 🔄 Core Features
- **[Entity Management](./features/entity-management.md)** - Creating and managing entities
- **[Sync System](./features/sync-system.md)** - Data synchronization with Broadstreet API
- **[Filter System](./features/filter-system.md)** - Hierarchical filtering system
- **[Placement Creation](./features/placement-creation.md)** - Fallback ad utility

### 🧪 Testing & Automation
- **[Testing Guide](./testing/testing-guide.md)** - Playwright testing setup and patterns
- **[Test Scripts](./testing/test-scripts.md)** - Available test scripts and utilities

### 🌐 External Systems
- **[Broadstreet API](./external/broadstreet-api.md)** - External API documentation
- **[Broadstreet Structure](./external/broadstreet-structure.md)** - External system architecture

## 🎯 Key Features

### ✅ **Local Entity Management**
- Create entities locally before syncing to Broadstreet API
- Visual distinction between local and synced entities
- Centralized management via Local Only dashboard

### ✅ **Intelligent Sync System**
- Hierarchical dependency resolution
- Automatic name conflict resolution
- Clean API payload construction
- Real-time sync status tracking

### ✅ **Advanced Filtering**
- Persistent filter state across pages
- Hierarchical filtering (Network → Advertiser → Campaign)
- Smart filter combinations

### ✅ **Modern UI/UX**
- Responsive design with Tailwind CSS 4
- Server-side components with selective client components
- Collapsible forms with minimal required fields
- Real-time validation and error handling

## 🛠️ Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Frontend** | Next.js with App Router | 15.5.2 |
| **UI Framework** | React | 19.1.0 |
| **Styling** | Tailwind CSS | 4.x |
| **Database** | MongoDB with Mongoose | 8.x |
| **API Client** | Axios | 1.6.x |
| **Testing** | Playwright | 1.40.x |
| **Language** | TypeScript | 5.x |

## 📋 Application Entities

### Core Entities
- **Networks** - Website properties (Schwulissimo.de, TravelM.de)
- **Zones** - Ad placement locations on websites
- **Advertisers** - Companies running campaigns
- **Advertisements** - Creative content for campaigns
- **Campaigns** - Time-bound advertising campaigns
- **Placements** - Connections between ads, zones, and campaigns

### Entity Relationships
```
Networks (1) ──→ (many) Zones
Networks (1) ──→ (many) Advertisers  
Advertisers (1) ──→ (many) Campaigns
Campaigns (1) ──→ (many) Placements [embedded]
Advertisements (1) ──→ (many) Placements [referenced]
Zones (1) ──→ (many) Placements [referenced]
```

## 🔄 Workflow Overview

### 1. **Entity Creation**
Create entities locally with minimal required fields and optional collapsible sections.

### 2. **Local Management**
Manage local entities via the Local Only dashboard with visual distinctions and batch operations.

### 3. **Synchronization**
Sync local entities to Broadstreet API with automatic conflict resolution and dependency handling.

### 4. **Campaign Management**
Create and manage campaigns with embedded placements for comprehensive advertising management.

## 🚨 Important Notes

### **Broadstreet API Requirements**
- All operations require valid Broadstreet API credentials
- No mock or fallback data - real API integration only
- Environment variables must be properly configured

### **Data Architecture**
- Local entities stored in separate collections (`local_*`)
- Sync operations preserve local entities until API confirmation
- Clean payload construction prevents API rejection

### **UI Patterns**
- Minimal required fields with collapsible optional sections
- Real-time validation with user-friendly error messages
- Visual distinction between local and synced entities
- Auto-refresh after successful operations

## 📝 Contributing

When making changes to the application:

1. **Update Documentation** - Modify relevant documentation files
2. **Follow Patterns** - Use established UI and API patterns
3. **Test Thoroughly** - Use Playwright tests for validation
4. **Sync Considerations** - Ensure changes work with sync system

## 🆘 Getting Help

- **User Issues**: Check [User Guide](./guides/user-guide.md) and [Troubleshooting](./guides/troubleshooting.md)
- **Technical Issues**: Review [Technical Documentation](./technical/)
- **API Issues**: Consult [API Reference](./technical/api-reference.md) and [Broadstreet API](./external/broadstreet-api.md)

## 📊 Documentation Status

- **Coverage**: 100% - All features documented
- **Accuracy**: Current as of version 1.0
- **AI-Friendly**: Optimized for AI assistant guidance
- **Maintenance**: Updated with each feature addition

---

*For AI Assistants: This documentation system is designed to provide comprehensive context for code generation, debugging, and feature implementation. Each section contains specific implementation details and code examples.*
