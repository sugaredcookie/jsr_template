# Report Designer - Technical Documentation

**Version:** 1.0.0  
**Technology Stack:** React 18, Node.js 18+, Express 4, JSReport 4.13  
**Document Purpose:** Comprehensive technical documentation for developers, maintainers, and technical reviewers

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Project Objectives](#2-project-objectives)
3. [Feature Matrix](#3-feature-matrix)
4. [Technology Stack](#4-technology-stack)
5. [High-Level System Architecture](#5-high-level-system-architecture)
6. [Frontend-Backend Communication](#6-frontend-backend-communication)
7. [Complete Project Structure](#7-complete-project-structure)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Backend Architecture](#9-backend-architecture)
10. [API Reference](#10-api-reference)
11. [Datasource Architecture](#11-datasource-architecture)
12. [Template Lifecycle](#12-template-lifecycle)
13. [Report Generation Pipeline](#13-report-generation-pipeline)
14. [State Management](#14-state-management)
15. [Custom Hooks](#15-custom-hooks)
16. [Component System](#16-component-system)
17. [Application Usage Guide](#17-application-usage-guide)
18. [Local Development Setup](#18-local-development-setup)
19. [Environment Configuration](#19-environment-configuration)
20. [Troubleshooting](#20-troubleshooting)
21. [Current Limitations](#21-current-limitations)
22. [Known Technical Debt](#22-known-technical-debt)
23. [Future Improvements](#23-future-improvements)
24. [Glossary](#24-glossary)
25. [License](#25-license)

---

## 1. Introduction

### What is the Report Designer?

The Report Designer is a full-stack web application that enables users to create, design, and generate professional reports through a visual drag-and-drop interface. It provides a workspace where users can upload data, design templates, and export reports in multiple formats.

### The Problem It Solves

Traditional report generation often requires coding or complex desktop tools. This application democratizes report creation by providing:
- A visual designer for non-technical users
- Template reuse and management
- Multiple datasource support (CSV, SQLite - partial)
- Export to HTML and PDF formats
- Project-based organization

### Intended Users

- Business analysts
- Report developers
- Data analysts
- Operations teams
- Anyone who needs to create data-driven reports

### Primary Capabilities

- Project-based report organization
- CSV datasource support (fully implemented)
- SQLite database datasource support (partially implemented)
- Visual report template design
- Template persistence and reuse
- Report preview generation
- HTML export
- PDF export
- Theme-based styling

### Current Development Status

The application is in active development. Core features are implemented and working. Some features (AWS S3, REST API datasources, full database support) are placeholders for future implementation.

---

## 2. Project Objectives

### Main Engineering and Product Objectives

1. **Project-Based Organization**
   - Each report belongs to a project
   - Projects isolate datasources, templates, and reports

2. **Datasource Abstraction**
   - Multiple datasource types through a unified interface
   - CSV as primary datasource
   - SQLite as secondary datasource (partial)
   - Placeholder architecture for future datasource types

3. **Visual Report Template Design**
   - Drag-and-drop component system
   - Real-time preview
   - Theme-based styling
   - Component property editing

4. **Reusable Templates**
   - Save templates per project
   - Load and modify existing templates

5. **Multiple Export Formats**
   - HTML export
   - PDF export
   - XLSX export (partial)
   - DOCX export (partial)

6. **Separation of Concerns**
   - Frontend/Backend separation
   - Service layer for business logic
   - Controller layer for request handling
   - Storage abstraction

7. **Extensible Architecture**
   - Component registry for new components
   - Datasource service for new data sources
   - Renderer system for new output formats

---

## 3. Feature Matrix

### Implemented Features

| Feature | Status | Description |
|---------|--------|-------------|
| Project Creation | ✅ | Create projects with name and description |
| Project Listing | ✅ | View all available projects |
| Project Selection | ✅ | Select a project to open its workspace |
| Project Editing | ✅ | Update project name and description |
| Project Deletion | ✅ | Remove projects and associated data |
| CSV Upload | ✅ | Upload CSV files to a project |
| CSV Parsing | ✅ | Parse CSV with header detection |
| Data Preview | ✅ | View data before designing reports |
| Text Component | ✅ | Add and edit text with styling |
| Table Component | ✅ | Display tabular data with columns |
| Infographic Grid | ✅ | Display metrics with calculations |
| Analytics Chart | ✅ | Visualize data (bar charts) |
| Spacer Component | ✅ | Add vertical spacing |
| Page Break | ✅ | Add page break for PDF |
| Drag and Drop | ✅ | Reorder components |
| Component Selection | ✅ | Select and edit components |
| Properties Panel | ✅ | Edit component properties |
| Theme Selection | ✅ | Minimalist, Corporate, Editorial |
| Template Creation | ✅ | Save current design as template |
| Template Loading | ✅ | Load saved templates into designer |
| Template Updating | ✅ | Update existing templates |
| Template Deletion | ✅ | Remove unwanted templates |
| Report Preview | ✅ | Generate real-time preview |
| HTML Export | ✅ | Download HTML source |
| PDF Export | ✅ | Generate PDF using JSReport |
| Fullscreen Mode | ✅ | Immersive design experience |

### Partially Implemented Features

| Feature | Status | Description |
|---------|--------|-------------|
| SQLite Datasource | ⚠️ | Connection test, table listing, data loading works with validation |
| Local Device Datasource | ⚠️ | Configuration exists but limited testing |
| XLSX Export | ⚠️ | Dataset export as Excel |
| DOCX Export | ⚠️ | Captures from iframe, may have issues |

### Placeholder Features

| Feature | Status | Description |
|---------|--------|-------------|
| AWS S3 Datasource | 🚧 | `fetchFromS3()` throws "Not implemented" |
| REST API Datasource | 🚧 | `fetchFromAPI()` throws "Not implemented" |
| PostgreSQL Datasource | 🚧 | Code exists but not fully tested |
| MySQL Datasource | 🚧 | Code exists but not fully tested |
| SQL Server Datasource | 🚧 | Code exists but not fully tested |

---

## 4. Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework |
| React DOM | 18.2.0 | React DOM rendering |
| React Router DOM | 6.20.0 | Routing |
| Vite | 5.0.8 | Build tool |
| Tailwind CSS | 3.4.19 | Styling |
| PapaParse | 5.4.1 | CSV parsing |
| html2pdf.js | 0.14.0 | Client-side PDF generation |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 4.22.2 | Web framework |
| JSReport | 4.13.0 | Report generation |
| Multer | 1.4.5-lts.1 | File upload |
| MySQL2 | 3.22.6 | MySQL driver |
| pg | 8.22.0 | PostgreSQL driver |
| sqlite3 | 6.0.1 | SQLite driver |
| sqlite | 5.1.1 | SQLite wrapper |
| tedious | 20.0.0 | SQL Server driver |
| uuid | 9.0.1 | ID generation |
| dotenv | 17.4.2 | Environment variables |
| cors | 2.8.6 | CORS middleware |
| csv-parser | 3.0.0 | CSV parsing |

### Development Dependencies

| Technology | Version | Purpose |
|------------|---------|---------|
| Nodemon | 3.0.1 | Auto-restart on changes |
| ESLint | 8.55.0 | Code linting |
| Autoprefixer | 10.5.2 | CSS processing |
| PostCSS | 8.5.16 | CSS processing |

---

## 5. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                          USER                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     REACT FRONTEND                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               DesignerPage                          │   │
│  │  ┌────────────────────────────────────────────┐    │   │
│  │  │  Topbar  │  Canvas  │  PropertiesPanel    │    │   │
│  │  └────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            ProjectContext (State)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            API Service (apiService.js)              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP / REST
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     EXPRESS BACKEND                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Routes                             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐   │   │
│  │  │ projectRoutes│  │datasourceRtes│ │reportRtes│   │   │
│  │  └─────────────┘  └─────────────┘  └──────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Controllers                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐   │   │
│  │  │projectCtrl │  │datasourceCtrl│ │reportCtrl │   │   │
│  │  └─────────────┘  └─────────────┘  └──────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Services                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐   │   │
│  │  │csvService   │  │datasource   │  │jsreport  │   │   │
│  │  │             │  │Service      │  │Service   │   │   │
│  │  └─────────────┘  └─────────────┘  └──────────┘   │   │
│  │  ┌─────────────┐                                   │   │
│  │  │templateBlder│                                   │   │
│  │  └─────────────┘                                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
┌───────────────────┐ ┌─────────────┐ ┌───────────────────┐
│   Filesystem      │ │   JSReport  │ │   Database        │
│   Storage         │ │   Engine    │ │   (Partial)       │
└───────────────────┘ └─────────────┘ └───────────────────┘
```

---

## 6. Frontend-Backend Communication

### API Base URL

The frontend communicates with the backend via HTTP/REST API.

**Development Configuration:**
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- API Base: `/api` (proxied through Vite)

### Request Lifecycle Examples

#### Example 1: Creating a Project

```
User clicks "Create Project"
    ↓
ProjectDashboard.jsx - handleCreateProject()
    ↓
ProjectContext.jsx - createProject()
    ↓
apiService.js - createProject()
    ↓
POST /api/projects
    ↓
projectRoutes.js - router.post('/')
    ↓
projectController.js - createProject()
    ↓
Filesystem - Create project directory and files
    ↓
JSON Response
    ↓
ProjectContext - Update state
    ↓
ProjectDashboard - Refresh UI
```

#### Example 2: Uploading a CSV

```
User selects CSV file
    ↓
DesignerPage.jsx - handleFileUpload()
    ↓
ProjectContext.jsx - uploadCSV()
    ↓
apiService.js - uploadCSV()
    ↓
POST /api/:projectId/upload
    ↓
datasourceRoutes.js - router.post('/:projectId/upload')
    ↓
datasourceController.js - uploadCSV()
    ↓
datasourceService.js - uploadCSV()
    ↓
Filesystem - Save CSV file
    ↓
datasource.json - Update configuration
    ↓
JSON Response
    ↓
ProjectContext - Refresh data
    ↓
DesignerPage - Update UI
```

#### Example 3: Generating a Report Preview

```
User clicks "Generate Preview"
    ↓
DesignerPage.jsx - handleGeneratePreview()
    ↓
useReportGenerator.js - generatePreview()
    ↓
apiService.js - previewReport()
    ↓
POST /api/reports/preview
    ↓
reportRoutes.js - router.post('/preview')
    ↓
reportController.js - previewReport()
    ↓
datasourceService.js - getData()
    ↓
templateBuilder.js - buildTemplate()
    ↓
HTML Response
    ↓
useReportGenerator - setPreviewHtml()
    ↓
PreviewPanel - Display HTML
```

### CORS Configuration

The backend uses CORS to allow frontend requests:

```javascript
// server.js
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 7. Complete Project Structure

### Frontend Structure

```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env
├── .gitignore
├── public/
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── index.css
    ├── assets/
    ├── components/
    │   ├── datasource/
    │   │   ├── CSVUploader.jsx
    │   │   ├── DataPreview.jsx
    │   │   └── DatasourceSetup.jsx
    │   ├── projects/
    │   │   └── ProjectDashboard.jsx
    │   ├── PropertyControls/
    │   │   ├── GridControls.jsx
    │   │   ├── SpacerControls.jsx
    │   │   ├── TableControls.jsx
    │   │   └── TextControls.jsx
    │   ├── Canvas.jsx
    │   ├── PreviewPanel.jsx
    │   ├── PropertiesPanel.jsx
    │   ├── Sidebar.jsx
    │   ├── StatusBar.jsx
    │   └── Topbar.jsx
    ├── context/
    │   └── ProjectContext.jsx
    ├── hooks/
    │   ├── useComponentDrag.js
    │   └── useReportGenerator.js
    ├── pages/
    │   └── DesignerPage.jsx
    ├── registry/
    │   └── componentRegistry.js
    ├── renderers/
    │   ├── TableRenderer.jsx
    │   └── TextRenderer.jsx
    ├── services/
    │   └── apiService.js
    └── utils/
```

### Backend Structure

```
backend/
├── package.json
├── server.js
├── jsreport.config.json
├── .env
├── .gitignore
├── controllers/
│   ├── datasourceController.js
│   ├── projectController.js
│   └── reportController.js
├── routes/
│   ├── datasourceRoutes.js
│   ├── projectRoutes.js
│   └── reportRoutes.js
├── services/
│   ├── csvService.js
│   ├── datasourceService.js
│   ├── jsreportService.js
│   └── templateBuilder.js
├── storage/
│   └── projects/
│       └── [project-id]/
│           ├── project.json
│           ├── datasource.json
│           ├── [data-file]
│           ├── templates/
│           │   └── [template-id].json
│           └── reports/
│               ├── [report-id].html
│               └── [report-id].json
├── uploads/
├── reports/
├── logs/
└── data/
```

---

## 8. Frontend Architecture

### Application Entry Point

**File:** `src/main.jsx`

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### App Component

**File:** `src/App.jsx`

The App component serves as the main container that manages navigation between:
1. **ProjectDashboard** - Shows all projects
2. **DesignerPage** - The report design workspace

**State:**
- `showProjectSelector`: Boolean to toggle between dashboard and designer

**Key Functions:**
- `handleSelectProject()`: Navigate to designer with selected project
- `handleBackToProjects()`: Return to dashboard

### Navigation Flow

```
App.jsx
├── showProjectSelector === true
│   └── ProjectDashboard
│       └── onSelectProject → handleSelectProject()
└── showProjectSelector === false
    └── DesignerPage
        └── onBackToProjects → handleBackToProjects()
```

### Context Providers

**ProjectContext.jsx**
- Wraps the entire application
- Provides project data to all components
- Manages project selection, data loading, and state

---

## 9. Backend Architecture

### Server Initialization

**File:** `server.js`

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import routes
const reportRoutes = require('./routes/reportRoutes');
const projectRoutes = require('./routes/projectRoutes');
const datasourceRoutes = require('./routes/datasourceRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Middleware Setup
app.use(cors({...}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Static File Serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/storage', express.static(path.join(__dirname, 'storage')));

// 3. Directory Creation
createDirectories();

// 4. Route Registration (Order matters!)
app.use('/api/projects', projectRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', datasourceRoutes);

// 5. 404 Handler (Must be after all routes)
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// 6. Error Handler (Must be last)
app.use((err, req, res, next) => {
    res.status(500).json({ error: 'Internal Server Error' });
});

// 7. Server Start
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

### Controllers

#### projectController.js

**Purpose:** Project and template CRUD operations

**Methods:**
- `createProject()` - Create new project with directory structure
- `getAllProjects()` - List all projects
- `getProject()` - Get single project
- `updateProject()` - Update project details
- `deleteProject()` - Delete project and all data
- `getAllTemplates()` - List all templates for a project
- `createNewTemplate()` - Create new template
- `getTemplate()` - Get single template
- `updateTemplate()` - Update template
- `deleteTemplate()` - Delete template

#### datasourceController.js

**Purpose:** Datasource management

**Methods:**
- `getDatasourceConfig()` - Get datasource configuration
- `updateDatasourceConfig()` - Update datasource configuration
- `getDatasourceStatus()` - Check if datasource is configured
- `uploadCSV()` - Upload CSV file
- `getProjectData()` - Get project data
- `testDatabaseConnection()` - Test database connection
- `getDatabaseTables()` - Get tables from database
- `configureDatabase()` - Configure database datasource
- `configureLocal()` - Configure local datasource

#### reportController.js

**Purpose:** Report generation

**Methods:**
- `previewReport()` - Generate report preview
- `generateHTML()` - Generate HTML report
- `generatePDF()` - Generate PDF report
- `getReports()` - List all reports
- `getReport()` - Get single report
- `deleteReport()` - Delete report

### Services

#### csvService.js

**Purpose:** CSV parsing

**Methods:**
- `parseCSV(csvData)` - Parse CSV string to array of objects
- `parseCSVLine(line)` - Parse a single CSV line

#### datasourceService.js

**Purpose:** Datasource abstraction and data fetching

**Methods:**
- `getDatasourceConfig(projectId)` - Get datasource configuration
- `saveDatasourceConfig(projectId, config)` - Save datasource configuration
- `getData(projectId)` - Get data from configured datasource
- `fetchFromCSV(projectId, config)` - Fetch data from CSV
- `fetchFromDatabase(projectId, config)` - Fetch data from database
- `fetchFromLocal(projectId, config)` - Fetch data from local file
- `fetchFromS3(projectId, config)` - Fetch data from S3 (placeholder)
- `fetchFromAPI(projectId, config)` - Fetch data from API (placeholder)
- `uploadCSV(projectId, filename, buffer)` - Upload CSV
- `configureDatabase(projectId, config)` - Configure database
- `testDatabaseConnection(projectId, config)` - Test database connection
- `getDatabaseTables(projectId, config)` - Get database tables
- `getParsedData(projectId)` - Get cached parsed data
- `clearCache(projectId)` - Clear cache
- `hasDatasource(projectId)` - Check if datasource exists

#### jsreportService.js

**Purpose:** JSReport integration

**Methods:**
- `getJSReportInstance()` - Get or create JSReport instance
- `renderHTML(html)` - Render HTML template
- `generatePDF(html, options)` - Generate PDF from HTML

#### templateBuilder.js

**Purpose:** Template HTML generation

**Methods:**
- `buildTemplate(template, data)` - Build HTML from template and data
- `buildComponent(component)` - Build component HTML
- `wrapInHtmlDocument(content, theme)` - Wrap content in HTML document

---

## 10. API Reference

### Project APIs

#### GET /api/projects
Get all projects.

**Response:** Array of project objects

#### POST /api/projects
Create a new project.

**Request Body:**
```json
{
  "name": "My Project",
  "description": "Description"
}
```

**Response:** Created project object

#### GET /api/projects/:projectId
Get a specific project.

**Response:** Project object

#### PUT /api/projects/:projectId
Update a project.

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated Description"
}
```

**Response:** Updated project object

#### DELETE /api/projects/:projectId
Delete a project.

**Response:** Success message

### Template APIs

#### GET /api/projects/:projectId/templates
Get all templates for a project.

**Response:** Array of template objects

#### POST /api/projects/:projectId/templates
Create a new template.

**Request Body:**
```json
{
  "name": "Employee Report",
  "components": [],
  "theme": "silicon"
}
```

**Response:** Created template object

#### GET /api/projects/:projectId/templates/:templateId
Get a specific template.

**Response:** Template object

#### PUT /api/projects/:projectId/templates/:templateId
Update a template.

**Request Body:**
```json
{
  "name": "Updated Report",
  "components": [],
  "theme": "corporate"
}
```

**Response:** Updated template object

#### DELETE /api/projects/:projectId/templates/:templateId
Delete a template.

**Response:** Success message

### Datasource APIs

#### GET /api/:projectId/datasource/status
Get datasource configuration status.

**Response:**
```json
{
  "configured": true,
  "type": "csv",
  "status": "ready"
}
```

#### POST /api/:projectId/upload
Upload a CSV file.

**Request:** multipart/form-data with 'csv' field

**Response:** Success message with filename

#### GET /api/:projectId/data
Get project data.

**Response:**
```json
{
  "configured": true,
  "data": [...],
  "count": 10
}
```

### Report APIs

#### POST /api/reports/preview
Generate report preview.

**Request Body:**
```json
{
  "projectId": "my-project",
  "template": {
    "components": [],
    "theme": "silicon"
  }
}
```

**Response:**
```json
{
  "success": true,
  "html": "<!DOCTYPE html><html>...</html>",
  "hasData": true,
  "dataCount": 10
}
```

#### POST /api/reports/html
Generate HTML report.

**Request Body:** Same as preview

**Response:**
```json
{
  "success": true,
  "html": "...",
  "reportId": "uuid",
  "reportPath": "/storage/projects/.../report.html"
}
```

#### POST /api/reports/pdf
Generate PDF report.

**Request Body:** Same as preview

**Response:**
```json
{
  "success": true,
  "pdf": "base64-encoded-pdf",
  "reportId": "uuid",
  "reportPath": "/storage/projects/.../report.pdf"
}
```

#### GET /api/reports/:projectId/reports
Get all reports for a project.

**Response:** Array of report metadata objects

#### GET /api/reports/:projectId/reports/:reportId
Get a specific report.

**Response:** Report metadata and content

#### DELETE /api/reports/:projectId/reports/:reportId
Delete a report.

**Response:** Success message

---

## 11. Datasource Architecture

### Datasource Abstraction

The datasource architecture uses a unified interface for different data sources:

```
Project
    ↓
Datasource Configuration (datasource.json)
    ↓
DatasourceService
    ↓
┌─────────────────────────────────────────────────┐
│  switch(config.type)                            │
│  ├── 'csv'      → fetchFromCSV()   ✅          │
│  ├── 'local'    → fetchFromLocal() ⚠️          │
│  ├── 'database' → fetchFromDatabase() ⚠️       │
│  ├── 'aws-s3'   → fetchFromS3()    🚧          │
│  └── 'api'      → fetchFromAPI()   🚧          │
└─────────────────────────────────────────────────┘
```

### CSV Datasource Flow

```
CSV File Upload
    ↓
datasourceService.uploadCSV()
    ↓
Save file to project directory
    ↓
Update datasource.json
    ↓
datasourceService.getData()
    ↓
csvService.parseCSV()
    ↓
Return array of objects
```

### SQLite Datasource Flow

```
Database Configuration
    ↓
datasourceService.configureDatabase()
    ↓
Test Connection
    ↓
Get Tables
    ↓
Update datasource.json
    ↓
datasourceService.getData()
    ↓
validate table exists
    ↓
SELECT * FROM table LIMIT 10000
    ↓
Return array of objects
```

### Datasource Configuration (datasource.json)

**CSV Example:**
```json
{
  "configured": true,
  "type": "csv",
  "config": {
    "path": "employees.csv"
  }
}
```

**Database Example:**
```json
{
  "configured": true,
  "type": "database",
  "config": {
    "type": "sqlite",
    "filePath": "C:/path/to/database.db",
    "table": "employees"
  }
}
```

---

## 12. Template Lifecycle

### Template JSON Structure

```json
{
  "id": "uuid",
  "projectId": "my-project",
  "name": "Employee Report",
  "components": [
    {
      "id": 1,
      "type": "text",
      "props": {
        "value": "Employee Report",
        "fontSize": 24,
        "bold": true
      }
    },
    {
      "id": 2,
      "type": "table",
      "props": {
        "columns": ["id", "name", "email"]
      }
    }
  ],
  "theme": "silicon",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Template Operations

#### Create
```
Designer Components
    ↓
POST /api/projects/:id/templates
    ↓
projectController.createNewTemplate()
    ↓
Generate UUID
    ↓
Save to storage/projects/:id/templates/:uuid.json
    ↓
Return template object
```

#### Read
```
GET /api/projects/:id/templates
    ↓
projectController.getAllTemplates()
    ↓
Read all JSON files from templates directory
    ↓
Return array of templates
```

#### Update
```
Modified Components
    ↓
PUT /api/projects/:id/templates/:tid
    ↓
projectController.updateTemplate()
    ↓
Read existing template
    ↓
Update fields
    ↓
Save back to file
    ↓
Return updated template
```

#### Delete
```
DELETE /api/projects/:id/templates/:tid
    ↓
projectController.deleteTemplate()
    ↓
Remove JSON file
    ↓
Return success
```

---

## 13. Report Generation Pipeline

### Complete Pipeline

```
Designer Components
    ↓
Template JSON
    ↓
Frontend Request (POST /api/reports/[html|pdf|preview])
    ↓
reportController
    ↓
datasourceService.getData(projectId)
    ↓
Template Data (rows)
    ↓
templateBuilder.buildTemplate(template, data)
    ↓
Complete HTML Document
    ↓
┌─────────────────────────────────────────────────┐
│  Format:                                       │
│  ├── Preview → Return HTML directly            │
│  ├── HTML    → Save HTML file + Return HTML    │
│  └── PDF     → JSReport render + Save PDF      │
└─────────────────────────────────────────────────┘
    ↓
Response to Frontend
    ↓
Display / Download
```

### HTML Generation

```javascript
// templateBuilder.js - buildTemplate()
const html = buildTemplate(template, data);
// Returns complete HTML document with:
// - Theme CSS
// - Component HTML
// - Data rendered
```

### PDF Generation

```javascript
// jsreportService.js - generatePDF()
const pdfBuffer = await jsreportService.generatePDF(html, options);
// Uses JSReport with:
// - Handlebars templating
// - Chrome PDF generation
// - Custom options (margin, format, etc.)
```

---

## 14. State Management

### ProjectContext

**File:** `src/context/ProjectContext.jsx`

**State Variables:**

| Variable | Type | Description |
|----------|------|-------------|
| `projects` | Array | List of all projects |
| `currentProject` | Object | Currently selected project |
| `currentData` | Array | Current project's data |
| `currentHeaders` | Array | Column headers from data |
| `templates` | Array | Project templates |
| `loading` | Boolean | Loading state |
| `error` | String | Error message |
| `hasDatasource` | Boolean | Whether datasource is configured |
| `csvFileName` | String | Uploaded CSV filename |

**Key Functions:**

| Function | Description |
|----------|-------------|
| `loadProjects()` | Fetch all projects |
| `selectProject(id)` | Select and load a project |
| `createProject(data)` | Create a new project |
| `deleteProject(id)` | Delete a project |
| `uploadCSV(file)` | Upload CSV to current project |
| `refreshData()` | Refresh project data |
| `loadTemplates(id)` | Load project templates |

**Usage Example:**
```javascript
import { useProject } from '../context/ProjectContext';

const MyComponent = () => {
  const { currentProject, currentData, uploadCSV } = useProject();
  // Use state and functions
};
```

---

## 15. Custom Hooks

### useReportGenerator

**File:** `src/hooks/useReportGenerator.js`

**Purpose:** Report generation logic and state management

**Inputs:**
- `csvData`: Array of data rows
- `components`: Array of designer components
- `currentTheme`: Current theme name

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `isGenerating` | Boolean | Generation in progress |
| `previewHtml` | String | Generated HTML preview |
| `isPreviewMode` | Boolean | Preview mode active |
| `generatePreview()` | Function | Generate preview |
| `exitPreview()` | Function | Close preview |
| `downloadHtml()` | Function | Download HTML |
| `downloadPdf()` | Function | Download PDF |
| `downloadXlsx()` | Function | Download Excel (partial) |
| `downloadDocx()` | Function | Download Word (partial) |
| `saveTemplate()` | Function | Save template |

### useComponentDrag

**File:** `src/hooks/useComponentDrag.js`

**Purpose:** Drag and drop functionality for components

**Inputs:**
- `components`: Array of components
- `setComponents`: State setter function

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `draggedIdx` | Number | Currently dragged index |
| `handleDragStart()` | Function | Start drag |
| `handleDragOver()` | Function | Handle drag over |
| `handleDragEnd()` | Function | End drag |

---

## 16. Component System

### Supported Components

#### Text Component
- **Type:** `text`
- **Props:** `value`, `fontSize`, `bold`, `align`, `color`, `fontFamily`

#### Table Component
- **Type:** `table`
- **Props:** `columns`, `columnMetadata`, `highlightRule`, `repeatHeaderOnPageBreak`

#### Grid Row Component
- **Type:** `grid-row`
- **Props:** `columnsCount`, `gridItems` (array of metric items)

#### Chart Component
- **Type:** `chart`
- **Props:** `title`, `chartType`, `xAxisColumn`, `yAxisColumn`, `operation`

#### Spacer Component
- **Type:** `spacer`
- **Props:** `height`, `variant` ('line' or 'none')

#### Page Break Component
- **Type:** `page-break`
- **Props:** `none`

### Component Registry

**File:** `src/registry/componentRegistry.js`

```javascript
export const componentRegistry = {
  text: { component: TextRenderer, label: 'Text' },
  table: { component: TableRenderer, label: 'Table' },
  // ... other components
};
```

### Adding a New Component

1. Create renderer in `src/renderers/`
2. Add to `componentRegistry.js`
3. Add to component buttons in `Topbar.jsx`
4. Add properties to `PropertiesPanel.jsx`

---

## 17. Application Usage Guide

### Step 1: Start the Application

1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Open `http://localhost:5173`

### Step 2: Create a Project

1. Click "New Project"
2. Enter a project name
3. (Optional) Enter a description
4. Click "Create Project"

### Step 3: Open the Project Workspace

1. Click on the project card
2. The workspace will open with the datasource setup screen

### Step 4: Configure a Datasource

1. Select a datasource type:
   - **Upload CSV**: Upload a CSV file from your computer
   - **Local Device**: Connect to a local CSV file
   - **Database**: Connect to a database (SQLite supported)

2. For CSV Upload:
   - Click "Upload CSV"
   - Select a CSV file
   - Wait for upload to complete

3. For Database:
   - Select database type (SQLite, MySQL, PostgreSQL, SQL Server)
   - Enter connection details
   - Click "Test Connection"
   - Select a table
   - Click "Configure Database"

### Step 5: Add Report Components

1. Click component buttons in the topbar:
   - **Text**: Add text with styling
   - **Table**: Add data table
   - **Infographic Grid**: Add metrics with calculations
   - **Analytics Chart**: Add chart visualization
   - **Spacer**: Add vertical spacing
   - **Page Break**: Add page break for PDF

### Step 6: Configure Components

1. Click on a component in the canvas to select it
2. Properties panel will show available settings
3. Modify properties as needed

### Step 7: Select a Theme

1. Click a theme button in the topbar:
   - **Minimalist**: Clean, modern design
   - **Corporate**: Professional, structured
   - **Editorial**: Magazine-style

### Step 8: Preview the Report

1. Click "Generate Preview"
2. Preview panel will appear with rendered report
3. Close preview to continue editing

### Step 9: Save the Template

1. Enter a template name in the topbar
2. Click "Save Template"
3. Template will be saved to the project

### Step 10: Load an Existing Template

1. Click "Templates" dropdown in the topbar
2. Select a template from the list
3. Components will load into the canvas

### Step 11: Export the Report

1. Generate preview
2. Click the export dropdown in the topbar
3. Select format:
   - **PDF**: Download as PDF
   - **Word**: Download as DOCX
   - **Excel**: Download dataset as XLSX
   - **HTML**: Download source HTML

---

## 18. Local Development Setup

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the backend server
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the frontend development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### Verify Installation

1. Backend: Visit `http://localhost:5000` - should show API info
2. Frontend: Visit `http://localhost:5173` - should show project dashboard

### Default Ports

| Service | Port |
|---------|------|
| Frontend | 5173 |
| Backend | 5000 |
| JSReport | 5488 |

---

## 19. Environment Configuration

### Backend .env

```
PORT=5000
NODE_ENV=development
```

### Frontend .env

```
VITE_API_URL=/api
```

### Example Backend .env

```
PORT=5000
NODE_ENV=development
```

### Example Frontend .env

```
VITE_API_URL=/api
# Or for direct backend connection:
# VITE_API_URL=http://localhost:5000/api
```

---

## 20. Troubleshooting

### Frontend Cannot Connect to Backend

**Symptom:** Network errors, API calls failing

**Solutions:**
1. Ensure backend is running: `cd backend && npm run dev`
2. Check backend logs for errors
3. Verify CORS configuration in server.js
4. Check frontend .env VITE_API_URL

### 404 Route Not Found

**Symptom:** API calls return 404

**Solutions:**
1. Check the exact API endpoint in apiService.js
2. Verify the route exists in backend routes
3. Check route order in server.js
4. Check for typos in URL paths

### 500 Internal Server Error

**Symptom:** API calls return 500

**Solutions:**
1. Check backend console for error stack trace
2. Verify storage directories exist
3. Check file permissions
4. Verify required npm packages are installed

### CSV Upload Fails

**Symptom:** CSV upload error

**Solutions:**
1. Check file is valid CSV
2. Check file size (max 10MB)
3. Check storage directory permissions
4. Check multer configuration

### Preview Shows Raw Handlebars

**Symptom:** Preview shows `{{#each data}}` instead of rendered data

**Solutions:**
1. Ensure data is loaded in the designer
2. Check templateBuilder.js is receiving data
3. Verify Handlebars expressions are correct

### JSReport Fails to Initialize

**Symptom:** PDF generation fails

**Solutions:**
1. Check jsreport.config.json
2. Verify JSReport dependencies are installed
3. Check port 5488 is available

---

## 21. Current Limitations

### Filesystem Persistence

- **Issue:** All data stored in filesystem
- **Impact:** No concurrent write support, limited scaling
- **Status:** Current implementation

### No Authentication

- **Issue:** No user authentication or authorization
- **Impact:** Anyone can access the application
- **Status:** Not implemented

### Limited Datasource Implementations

- **Issue:** Only CSV is fully implemented
- **Impact:** Other datasources are placeholders
- **Status:** Partial implementation

### Simplified Caching

- **Issue:** In-memory cache only
- **Impact:** Cache resets on server restart
- **Status:** Current implementation

### Missing Validation

- **Issue:** Limited input validation
- **Impact:** Potential for invalid data
- **Status:** Current implementation

### No Automated Tests

- **Issue:** No test suite
- **Impact:** Regression risk
- **Status:** Not implemented

### Preview/Report Inconsistencies

- **Issue:** Preview may not match final report
- **Impact:** User confusion
- **Status:** Known issue

---

## 22. Known Technical Debt

### Legacy Code

- `templateBuilder.js` uses regex-based fallback rendering
- Should be replaced with proper Handlebars processing

### Duplicate Logic

- Report generation and preview share code
- Could be refactored for DRY

### Placeholder Methods

- `fetchFromS3()`, `fetchFromDatabase()`, `fetchFromAPI()` are placeholders
- Should be implemented or removed

### Route Inconsistencies

- Some routes use `/api/`, others use `/api/projects/`
- Standardize route structure

### Large Components

- `DesignerPage.jsx` is large (500+ lines)
- Should be split into smaller components

### Missing Schemas

- No validation schemas for request/response
- Implement Joi or similar validation

### DOCX Export Issues

- Attempts to capture from iframe
- May have reliability issues

---

## 23. Future Improvements

### Short Term

1. **Automated Tests**
   - Unit tests for services
   - API integration tests
   - React component tests

2. **Better Validation**
   - Input validation schemas
   - File upload validation
   - Template validation

3. **Error Handling**
   - Better error messages
   - Structured error logging
   - Error recovery

4. **DOCX Export Fix**
   - Fix iframe capture issues
   - Use proper Word generation

### Medium Term

1. **Database Persistence**
   - Project metadata
   - Template storage
   - Report metadata

2. **AWS S3 Integration**
   - Data source
   - Report storage
   - Template storage

3. **REST API Datasource**
   - Connect to REST APIs
   - Data transformation

4. **Full Database Support**
   - MySQL, PostgreSQL, SQL Server
   - Query builder
   - Table browser

5. **Authentication**
   - User accounts
   - Login/register
   - JWT tokens

### Long Term

1. **Collaborative Editing**
   - Real-time collaboration
   - Version history

2. **Cloud Deployment**
   - AWS deployment
   - Docker containers
   - CI/CD pipeline

3. **Distributed Storage**
   - Object storage (S3)
   - Distributed cache

4. **Job Queues**
   - Asynchronous report generation
   - Scheduled reports

---

## 24. Glossary

| Term | Definition |
|------|------------|
| **Project** | A container for datasources, templates, and reports |
| **Datasource** | A data source (CSV, Database, API, etc.) |
| **Template** | A saved report design |
| **Component** | A visual element in the designer (Text, Table, Chart) |
| **Renderer** | A component that displays a component in the designer |
| **Report** | A generated output from a template |
| **Preview** | A real-time preview of the current design |
| **JSReport** | A JavaScript reporting engine |
| **Controller** | A backend layer that handles requests |
| **Service** | A backend layer that contains business logic |
| **Route** | An API endpoint definition |
| **Context** | A React state management system |
| **Hook** | A React function that provides state and logic |
| **Theme** | A visual style preset for reports |
| **Handlebars** | A templating language for HTML generation |

---

## 25. License

This project is licensed under the MIT License - see the LICENSE file for details.

---

*Documentation generated for Report Designer Application v1.0.0*
```

---

# README.md

```markdown
# Report Designer

A full-stack visual report designer application with project-based organization, CSV datasource support, and multiple export formats.

## Features

- **Project Management**: Create, list, select, edit, and delete projects
- **Datasource Support**: Upload CSV files, SQLite database (partial)
- **Visual Designer**: Drag-and-drop component system with real-time preview
- **Components**: Text, Table, Infographic Grid, Analytics Chart, Spacer, Page Break
- **Themes**: Minimalist, Corporate, Editorial
- **Template Management**: Save, load, update, and delete report templates
- **Export Formats**: HTML, PDF (XLSX, DOCX partial)
- **Report Preview**: Real-time preview of the current design

## Technology Stack

### Frontend
- React 18
- Vite 5
- Tailwind CSS 3
- React Context API
- PapaParse 5
- html2pdf.js 0.14

### Backend
- Node.js 18+
- Express 4
- JSReport 4.13
- Multer 1.4
- MySQL2, pg, sqlite3, tedious

### Storage
- Filesystem-based persistence
- Project-based storage structure

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher

## Installation

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

## Project Structure

```
backend/
├── controllers/
├── routes/
├── services/
├── storage/
│   └── projects/
└── server.js

frontend/
├── src/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── pages/
│   └── services/
└── package.json
```

## API Endpoints

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create a project
- `GET /api/projects/:id` - Get a project
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project

### Templates
- `GET /api/projects/:id/templates` - Get all templates
- `POST /api/projects/:id/templates` - Create a template
- `GET /api/projects/:id/templates/:tid` - Get a template
- `PUT /api/projects/:id/templates/:tid` - Update a template
- `DELETE /api/projects/:id/templates/:tid` - Delete a template

### Datasources
- `POST /api/:id/upload` - Upload CSV
- `GET /api/:id/data` - Get project data
- `GET /api/:id/datasource/status` - Check datasource status

### Reports
- `POST /api/reports/preview` - Generate preview
- `POST /api/reports/html` - Generate HTML
- `POST /api/reports/pdf` - Generate PDF

## Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_URL=/api
```

## Usage Flow

1. **Create a Project**: Use the dashboard to create a new project
2. **Configure Datasource**: Upload a CSV or configure a datasource
3. **Design Report**: Add components, configure properties, select themes
4. **Preview Report**: Generate a real-time preview
5. **Save Template**: Save your design as a template
6. **Export Report**: Download as HTML, PDF, XLSX, or DOCX

## Current Limitations

- Filesystem-based persistence (no database)
- No user authentication
- Limited datasource implementations (CSV is fully implemented, others are partial)
- No automated tests
- Limited validation
- DOCX export is partial

## Future Roadmap

### Short Term
- Automated tests
- Better validation
- Improved error handling

### Medium Term
- Database persistence
- AWS S3 integration
- REST API datasource
- Full database support

### Long Term
- Collaborative editing
- Cloud deployment
- Distributed storage

## License

MIT License - see LICENSE file for details