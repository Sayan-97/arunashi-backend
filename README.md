# 🌌 Arunashi Server

---

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js (version 20 or higher) and pnpm installed:
```bash
node -v  # >= 20.x
pnpm -v  # >= 11.x
```

### Installation

Clone the repository, navigate to the folder, and run:
```bash
pnpm install
```
*Note: This will install all dependencies and set up the Git hooks via Husky.*

### Available Scripts

During development, you will primarily use the following pnpm scripts:

| Command | Action | Description |
| :--- | :--- | :--- |
| `pnpm dev` | `tsx watch src/index.ts` | Runs the server locally with live reload/hot watch. |
| `pnpm build` | `tsup` | Builds the production ESM bundle into the `dist/` directory. |
| `pnpm start` | `node dist/index.js` | Runs the compiled production server. |
| `pnpm check-types` | `tsc --noEmit` | Runs type analysis across the codebase without compiling. |
| `pnpm biome:lint` | `biome lint --write` | Checks code against linting rules and auto-fixes issues. |
| `pnpm biome:format`| `biome format --write` | Auto-formats code according to style rules. |
| `pnpm biome:check` | `biome check --write` | Runs linting, formatting, and imports check simultaneously. |

---

## 🌐 Endpoints & Routes

All API responses use a standardized JSON format.

### 1. Server Health Check
- **Method**: `GET`
- **Paths**: `/` or `/health`
- **Description**: Verifies if the backend server is running and accessible.
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Server up and running!"
}
```

### 2. Wildcard Route (404 Fallback)
- **Method**: `ANY`
- **Path**: `/*` (Any undefined route)
- **Description**: Handles all unregistered route requests and returns a standard not-found response.
- **Response (404 Not Found)**:
```json
{
  "success": false,
  "message": "Route not found"
}
```
