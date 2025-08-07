# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Available Scripts

- `npm run build` - Compiles TypeScript to JavaScript in the `dist` directory
- `npm run watch` - Runs TypeScript compiler in watch mode for development
- `npm run clean` - Removes the `dist` directory
- `npm run start` - Builds the project and starts Azure Functions locally
- `npm run test` - No tests are currently configured

## Project Architecture

This is an Azure Functions application built with TypeScript that provides a REST API for insurance claims and case management. The application integrates with Microsoft Dynamics 365 and SQL Server.

### Core Components

**Main Application (`src/app.ts`)**
- Hono-based web framework handling HTTP requests
- Three main endpoints: `/claims`, `/cases`, and `/test-db-connection`
- Claims endpoint includes comprehensive validation before insertion
- Error handling with detailed responses including validation results

**Data Layer (`src/data.ts`)**
- Database operations using `mssql` package
- Stored procedure execution for claims and cases
- Four validation functions: `validatePolicy`, `validatePlan`, `validateInsured`, `validateCoveragesGroup`
- Custom table-valued parameter handling for claims insertion

**Azure Functions Integration (`src/functions/httpTrigger.ts`)**
- Uses `@marplex/hono-azurefunc-adapter` to integrate Hono with Azure Functions
- Configured for anonymous authentication with catch-all routing

**Validation System (`src/helpers/validateClaimData.ts`)**
- Comprehensive claim data validation using multiple stored procedures
- Returns detailed validation results for policy, plan, insured, and coverage
- Structured error responses with specific validation failure details

**Dynamics 365 Integration (`src/shared/`)**
- `auth.ts`: MSAL-based authentication for Dynamics 365
- `client.ts`: DynamicsWebApi client configuration
- `operations.ts`: CRUD operations and record retrieval utilities

### Environment Configuration

The application requires these environment variables:
- Database: `DB_USER`, `DB_PASSWORD`, `DB_SERVER`, `DB_NAME`, `DB_PORT`
- Dynamics 365: `DYNAMICS_CLIENT_ID`, `DYNAMICS_AUTHORITY`, `DYNAMICS_CLIENT_SECRET`, `DYNAMICS_API_URL`

### Database Operations

**Claims Processing:**
- Uses stored procedure `SMI.USP_InsertClaims` with table-valued parameters
- Supports complex claim structure with policy, coverage, and transaction details
- Returns generated claim numbers

**Cases Processing:**
- Uses stored procedure `SMI.USP_InsertCase` with individual parameters
- Handles case creation with branch, company, and office details
- Returns generated case numbers

**Validation Stored Procedures:**
- `SMI.USP_SMI_ValidationsPolicy` - Policy validation
- `SMI.USP_SMI_ValidationsPlan` - Plan validation  
- `SMI.USP_SMI_ValidationsInsured` - Insured person validation
- `SMI.USP_SMI_ValidationsCoveragesGroup` - Coverage group validation

### Development Notes

- TypeScript configuration uses NodeNext module resolution
- No linting or testing infrastructure currently configured
- Uses both npm and yarn lock files (prefer npm based on package.json scripts)
- Database connections are opened/closed per operation (no connection pooling)
- Error handling includes stack traces in development responses