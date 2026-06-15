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

### Environment Variables
Create a `.env` file in the root directory and configure the following variables:
```env
PORT=8000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/db_name
JWT_SECRET=your_jwt_secret_key
```

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

## 🔒 Authentication Architecture

The server implements a production-grade **HttpOnly Cookie Authentication** architecture with **Refresh Token Rotation (RTR)**.

- **Access Token**: Valid for 15 minutes. Stored in an HttpOnly cookie named `accessToken`.
- **Refresh Token**: Valid for 7 days. Stored in an HttpOnly cookie named `refreshToken`.
- **Token Rotation**: Each time the tokens are refreshed:
  1. The old refresh token is verified and deleted from the database.
  2. A new access token and refresh token are generated.
  3. The new refresh token is saved to the database.
  4. Both new cookies are sent to the client.
- **Security**: Raw tokens are never returned in JSON responses or stored in `localStorage`/`sessionStorage` to mitigate XSS attacks.

---

## 🌐 Endpoints & Routes

All API responses use a standardized JSON format.

### 1. General & Health
- **GET `/` / `/health`**: Check server health status.

### 2. Registration Request Flow
- **POST `/api/registration/register`**: Submit a new registration request.
  - **Body**: `{ name, email, company, phone, address, pressTitle }`
- **POST `/api/admin/registrations/:id/approve`**: Approve a registration request (creates activation token).

### 3. Authentication & Account
- **POST `/api/auth/activate`**: Activate an approved registration request by creating a password.
  - **Body**: `{ token, password }`
- **POST `/api/auth/login`**: Authenticate using credentials.
  - **Body**: `{ email, password }`
  - **Cookies Set**: `accessToken`, `refreshToken`
- **POST `/api/auth/refresh`**: Refresh and rotate session tokens using the `refreshToken` cookie.
- **POST `/api/auth/logout`**: Terminate the session (deletes refresh token from database, clears cookies).
- **GET `/api/auth/profile`**: Retrieve the profile of the currently logged-in user. (Requires auth cookie).

### 4. User Profile
- **POST `/api/user/profile`**: Alternative route to retrieve current user profile. (Requires auth cookie).

### 5. Wildcard Route (404 Fallback)
- **ANY `/*`**: Handles all unregistered route requests.

