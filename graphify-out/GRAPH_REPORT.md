# Graph Report - .  (2026-08-14)

## Corpus Check
- 457 files · ~310,344 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 263 nodes · 197 edges · 134 communities (11 shown, 123 thin omitted)
- Extraction: 74% EXTRACTED · 26% INFERRED · 1% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Backend API Controllers
- FinGuard ML Platform
- KYC OCR Processing
- Coding Conventions
- Microservices Architecture
- Frontend Structure
- KYC Data Pipeline
- Frontend State & Routing
- Testing & Contribution
- CI & Service Setup
- Brand Assets
- UI Icons & Imagery
- App Entry Pages
- App Logos
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133

## God Nodes (most connected - your core abstractions)
1. `FinGuard Architectural Contract` - 12 edges
2. `KYC Document OCR & Face Verification System Context` - 9 edges
3. `Copilot Instructions Router` - 8 edges
4. `FinGuard Complete Reference (Shredded Context)` - 8 edges
5. `Backend API Inventory` - 7 edges
6. `Backend Node Instructions` - 6 edges
7. `backend-fastapi (Python ML Service)` - 6 edges
8. `FinGuard Authentication System` - 6 edges
9. `KYC Module (FinGuard)` - 6 edges
10. `Frontend Instructions` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Copilot Instructions (docs/AGENT.md)` --semantically_similar_to--> `GitHub Copilot Instructions (AGENT.md)`  [INFERRED] [semantically similar]
  docs/AGENT.md → AGENT.md
- `Frontend Tech Stack (React, Redux, TanStack, Tailwind, Zod)` --semantically_similar_to--> `Redux + React Query State Management`  [INFERRED] [semantically similar]
  frontend/README.md → docs/frontend/initials/folder_structure.md
- `Frontend Playwright E2E Tests` --semantically_similar_to--> `Playwright E2E Test Suite`  [INFERRED] [semantically similar]
  tests/README.md → docs/frontend/setups/CONTRIBUTING.md
- `Database Conventions` --references--> `Backend Setup README`  [INFERRED]
  .github/instructions/database.md → backend-node/README.md
- `Fix UI Errors Plan` --references--> `Frontend Instructions`  [INFERRED]
  .opencode/plans/fix-ui-errors.md → .github/instructions/frontend.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Three-Service Monorepo Stack** — agents_finguard_full, agents_shredded_finguard, three_service_architecture, fastapi_node_boundary [EXTRACTED 0.85]
- **Home Credit Risk Scoring Pipeline** — home_credit_alignment_ml_ready, home_credit_feature_mapping, risk_scoring_rule_based, ml_xgboost_catboost, agents_finguard_full [EXTRACTED 0.85]
- **Backend Layering Pattern Convention** — controller_service_db_pattern, api_response_envelope, parameterized_sql_rule, backend_patterns, agent [EXTRACTED 0.85]
- **Multi-Service KYC Verification Flow** — docs_backend_fastapi_architecture_frontend, docs_backend_fastapi_architecture_backend_node, docs_backend_fastapi_architecture_backend_fastapi, docs_backend_node_kyc_docs_kyc_ocr_service, docs_backend_node_kyc_docs_kyc_identity_service [INFERRED 0.85]
- **Authenticate → Authorize → Validate → Handler Pipeline** — docs_backend_node_middleware_middleware_validation_guide_authenticate, docs_backend_node_middleware_middleware_validation_guide_authorize, docs_backend_node_middleware_middleware_validation_guide_validate, docs_backend_node_middleware_middleware_validation_guide_error_handler, docs_backend_node_route_inventory_middleware_stack [EXTRACTED 1.00]
- **Audit-Logged State-Changing Operations** — docs_backend_node_audit_audit_service_complete_audit_service, docs_backend_node_api_inventory_auth_controller, docs_backend_node_api_inventory_kyc_controller, docs_backend_node_api_inventory_document_controller, docs_backend_node_api_inventory_user_controller [EXTRACTED 1.00]
- **KYC OCR + Face Verification Pipeline** — kycocr_react_kyc_wizard, kycocr_ocr_service, kycocr_face_verification, kycocr_background_processing, kycocr_kyc_verification_report [EXTRACTED 1.00]
- **Frontend Architecture Layers** — frontend_index_html, docs_frontend_initials_folder_structure_frontend_architecture, docs_frontend_initials_frontend_cleanup_feature_modules, docs_frontend_initials_frontend_cleanup_reusable_components, docs_frontend_initials_folder_structure_state_management [INFERRED 0.75]

## Communities (134 total, 123 thin omitted)

### Community 0 - "Backend API Controllers"
Cohesion: 0.12
Nodes (25): adminController (6 handlers), Admin Dashboard Integration, adminRoutes, Admin Dashboard & Statistics API, adminController, Backend API Inventory, authController, documentController (+17 more)

### Community 1 - "FinGuard ML Platform"
Cohesion: 0.20
Nodes (17): FinGuard Architectural Contract, FinGuard Complete Reference (Shredded Context), Credit Default Jupyter Requirements, FastAPI/Node Service Boundary, Frontend Feature-Folder Pattern, FinGuard Platform, Frontend Instructions, Frontend State Ownership (Redux/Query/useState) (+9 more)

### Community 2 - "KYC OCR Processing"
Cohesion: 0.21
Nodes (15): Backend/Config/Dependency Change Ledger, Declare browser globals to ESLint, Centralized Nodemailer Mail Service, Prisma ORM Setup (schema, migration, config), Type-Safe Request Validation Payloads, Derive __dirname from import.meta.url in ESM config, KYC Document OCR & Face Verification System Context, Fire-and-forget Background OCR/Face Processing (setImmediate) (+7 more)

### Community 3 - "Coding Conventions"
Cohesion: 0.23
Nodes (14): GitHub Copilot Instructions (AGENT.md), API Response Envelope Pattern, Backend Patterns (Node/Express/Prisma), Controller-Service-DB Layering Pattern, Copilot Instructions (docs/AGENT.md), Copilot Instructions Router, Auth Contract & Patterns, Auth Token & JWT/RBAC Contract (+6 more)

### Community 4 - "Microservices Architecture"
Cohesion: 0.19
Nodes (14): backend-fastapi (Python ML Service), backend-node (Express API Gateway), frontend (React UI), KYC Document Upload Request Flow, postgres (PostgreSQL Database), Separated Services Architecture, Token Refresh & Rotation, DATABASE_URL (+6 more)

### Community 5 - "Frontend Structure"
Cohesion: 0.15
Nodes (14): Complete Project Structure Documentation, Backend Layered Architecture (Middleware-Controller-Service-DB), Feature-Based Organization Pattern, Frontend Provider-Pages-Features-Components Flow, Redux + React Query State Management, Frontend Cleanup Summary, Feature-First Module Organization, Removal of Legacy Code and Empty Folders (+6 more)

### Community 6 - "KYC Data Pipeline"
Cohesion: 0.29
Nodes (11): KYC Module Changelog v1.0.0, FaceVerification (SQLAlchemy model), KycApplication (SQLAlchemy model), KYC Database Schema, OCRResult (SQLAlchemy model), Identity Verification Service (DeepFace), KYC Module (FinGuard), Mixed-Script Support (Devanagari + English) (+3 more)

### Community 7 - "Frontend State & Routing"
Cohesion: 0.24
Nodes (10): userController, User Avatar Lifecycle Management, avatarUpload Middleware, Frontend Redux State Model, Router as Source of Truth, Centralized Theme System, Frontend Feature Map, KYC Feature (frontend) (+2 more)

### Community 8 - "Testing & Contribution"
Cohesion: 0.25
Nodes (8): Contributing to ProjectIII, Docker Toolbox Compatibility Scripts, Branch from develop / PR / Squash Merge Workflow, PERN + TypeScript Monorepo (npm workspaces), Playwright E2E Test Suite, Testing Setup, Backend Jest + Supertest Tests, Frontend Playwright E2E Tests

### Community 9 - "CI & Service Setup"
Cohesion: 0.47
Nodes (6): FastAPI Backend Requirements, Backend Setup README, Docker Toolbox Compose, Backend FastAPI Instructions, CI Workflow, PERN + TypeScript Baseline README

### Community 10 - "Brand Assets"
Cohesion: 0.67
Nodes (3): HM Image (jpeg), HM Logo, HM Logo Variant 1

## Ambiguous Edges - Review These
- `Check Circle Icon (SVG)` → `Client Image`  [AMBIGUOUS]
  frontend/public/icons/check-circle.svg · relation: conceptually_related_to

## Knowledge Gaps
- **141 isolated node(s):** `processOcrJob`, `queueOcrJob`, `AuditLogInput`, `RegisterInput`, `LoginInput` (+136 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **123 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Check Circle Icon (SVG)` and `Client Image`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `KYC Feature (frontend)` connect `Frontend State & Routing` to `Backend API Controllers`, `Microservices Architecture`, `KYC Data Pipeline`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `kycController` connect `Backend API Controllers` to `Frontend State & Routing`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `backend-fastapi (Python ML Service)` connect `Microservices Architecture` to `KYC Data Pipeline`, `Frontend State & Routing`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `FinGuard Architectural Contract` (e.g. with `FastAPI Backend Requirements` and `FinGuard Complete Reference (Shredded Context)`) actually correct?**
  _`FinGuard Architectural Contract` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `FinGuard Complete Reference (Shredded Context)` (e.g. with `FinGuard Architectural Contract` and `Fix UI Errors Plan`) actually correct?**
  _`FinGuard Complete Reference (Shredded Context)` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `processOcrJob`, `queueOcrJob`, `AuditLogInput` to the rest of the system?**
  _141 weakly-connected nodes found - possible documentation gaps or missing edges._