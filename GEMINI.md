# GEMINI.md

## Project Overview

This project is a TypeScript-based Azure Functions application responsible for handling insurance claims and cases. It exposes HTTP endpoints to insert new claims and cases into a Microsoft SQL Server database. The application also includes data validation logic to ensure the integrity of the data before it's inserted. It integrates with Microsoft Dynamics 365 for CRM operations. The web framework used is Hono.

## Building and Running

The project is managed with `npm`. The following commands are available in `package.json`:

*   **`npm run build`**: Compiles the TypeScript code and outputs it to the `dist` directory.
*   **`npm run watch`**: Compiles the TypeScript code in watch mode, automatically recompiling on file changes.
*   **`npm run clean`**: Removes the `dist` directory.
*   **`npm run prestart`**: A preparatory script that cleans and builds the project.
*   **`npm start`**: Starts the Azure Functions host for local development and testing.
*   **`npm test`**: This command is defined but currently does not run any tests.

### Local Development

1.  Install dependencies: `npm install`
2.  Create a `.env` file in the root of the project with the necessary environment variables for the database and Dynamics 365 connections.
3.  Start the application: `npm start`

## Development Conventions

*   **Language**: The project is written in TypeScript.
*   **Configuration**: Environment variables are managed using the `dotenv` package. A `.env` file is required for local development.
*   **Code Structure**:
    *   `src/app.ts`: The main application file, containing the Hono app and route definitions.
    *   `src/data.ts`: Contains all the database interaction logic, including functions for inserting and validating data.
    *   `src/functions/httpTrigger.ts`: The entry point for the Azure Function.
    *   `src/helpers/validateClaimData.ts`: Contains the logic for validating claim data.
    *   `src/shared/`: Contains the logic for interacting with Microsoft Dynamics 365.
        *   `src/shared/auth.ts`: Handles authentication with Dynamics 365.
        *   `src/shared/client.ts`: The Dynamics 365 API client.
        *   `src/shared/operations.ts`: Contains functions for performing operations in Dynamics 365.
*   **API**: The application uses Hono to create a RESTful API with endpoints for creating claims and cases.
*   **Database**: The application connects to a Microsoft SQL Server database and uses stored procedures for data manipulation.
