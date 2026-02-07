# STATE OF TRUTH: LEARN-FIRST ENGINE SYSTEM AUDIT

## 1. Current Database Schema

### Core Collections

#### directus_users
- **id**: UUID (Primary Key, Auto-generated)
- **first_name**: string (Required)
- **last_name**: string (Required)
- **email**: string (Required, Unique)
- **role**: string
- **school_id**: UUID (Foreign Key to schools)
- **xp**: number (Current XP)
- **xp_total**: number (Total XP accumulated)
- **coins_balance**: number (Virtual currency balance)
- **level**: number (User level)

#### user_progress
- **id**: UUID (Primary Key, Auto-generated)
- **user_id**: UUID (Foreign Key to directus_users, Required)
- **quest_step_id**: UUID (Foreign Key to quest_steps, Required)
- **status**: 'completed' | 'failed' (Required)
- **date_created**: string (Timestamp)
- **token_fragment**: string (Optional, Token code fragment)

#### claimable_tokens
- **id**: UUID (Primary Key, Auto-generated)
- **token**: string (Required, Unique token code)
- **user_id**: UUID (Foreign Key to directus_users, Optional)
- **claimed**: boolean (Required, Default: false)
- **date_claimed**: string (Timestamp, Optional)
- **token_fragment**: string (Optional)
- **quest_id**: UUID (Foreign Key to quests, Required for validation)

### Supporting Collections

#### external_providers
- **id**: UUID (Primary Key)
- **name**: string (Required, e.g., "CodeCombat")
- **api_key**: string (Required, Encrypted)
- **webhook_secret**: string (Required, Encrypted)
- **base_url**: string (Required)
- **status**: 'active' | 'inactive' (Default: active)

#### external_progress
- **id**: UUID (Primary Key)
- **user_id**: UUID (Foreign Key to directus_users, Required)
- **provider_id**: UUID (Foreign Key to external_providers, Required)
- **external_user_id**: string (Required, User ID at provider)
- **external_level_id**: string (Required, Level ID at provider)
- **status**: 'completed' | 'failed' (Default: completed)
- **date_completed**: string (Timestamp)

#### quest_steps
- **id**: UUID (Primary Key)
- **quest_id**: UUID (Foreign Key to quests, Required)
- **title**: string (Required)
- **description**: string (Required)
- **content**: string (Optional)
- **order**: number (Required)
- **xp_reward**: number (Required)
- **external_id**: string (Optional, External level identifier)
- **provider_id**: UUID (Foreign Key to external_providers, Optional)
- **completion_token_secret**: string (Optional, Token generation secret)

### Database Constraints

#### Unique Constraints
- **directus_users.email**: Unique email addresses
- **claimable_tokens.token**: Unique token codes (prevents duplicate tokens)

#### Foreign Key Constraints
- **user_progress.user_id** → **directus_users.id** (ON DELETE: CASCADE)
- **user_progress.quest_step_id** → **quest_steps.id** (ON DELETE: CASCADE)
- **claimable_tokens.user_id** → **directus_users.id** (ON DELETE: SET NULL)
- **external_progress.user_id** → **directus_users.id** (ON DELETE: SET NULL)
- **external_progress.provider_id** → **external_providers.id** (ON DELETE: CASCADE)
- **quest_steps.provider_id** → **external_providers.id** (ON DELETE: SET NULL)

#### Required Fields
- All ID fields are required and auto-generated
- User-related fields require valid user references
- Token-related fields require valid token codes and quest references

## 2. Authentication Flow

### Frontend Authentication (Cookie-based)

#### Login Process (`frontend/src/app/actions.ts`)
1. **Credentials Submission**: User submits email/password via `loginAction`
2. **API Call**: POST request to `/auth/login` with credentials
3. **Token Storage**: 
   - `directus_access_token` stored in HttpOnly cookie (1 hour expiry)
   - `directus_refresh_token` stored in HttpOnly cookie (7 days expiry)
4. **Security Settings**:
   - `secure: true` in production
   - `sameSite: 'lax'`
   - `path: '/'`

#### Authentication Validation
- **`getAuthenticatedSdk()`**: Helper function that extracts token from cookies
- **Error Handling**: 401 errors trigger re-authentication requests
- **Token Refresh**: Uses refresh token for automatic renewal

#### Luanti Authentication
- **API Token System**: Uses `llu_api_token` from `minetest.conf`
- **Bearer Authentication**: All requests include `Authorization: Bearer <token>`
- **Security Check**: Mod fails to load if token is not configured
- **No User Auth**: Luanti does not implement user-level authentication, uses system-level API token

### Authentication Flow Summary
```
User Login → Frontend validates → Stores cookies → API requests with tokens → Backend processes → Luanti uses system token
```

## 3. Current XP Logic

### XP Calculation Architecture

#### Backend Hook (`backend/extensions/luanti-lms-xp-hook/src/index.ts`)
- **Trigger**: `user_progress.items.create` action
- **Condition**: Only processes when `status = 'completed'` and `user_id` exists
- **Difficulty Mapping**:
  - Easy: 10 XP + 1 coin
  - Medium: 30 XP + 3 coins  
  - Hard: 50 XP + 10 coins
- **Process Flow**:
  1. Resolve quest difficulty via `quest_step_id.quest_id.difficulty`
  2. Load user current XP/coins balance
  3. Update user totals with rewards
  4. Log transaction for audit trail

#### Frontend XP Display (`frontend/src/components/gamification/XpProgressBar.tsx`)
- **Real-time Updates**: Uses Directus SDK to fetch current user stats
- **Progress Visualization**: Shows XP progress toward next level
- **Coin Display**: Shows available coins balance

### Token Redemption System

#### Token Validation (`frontend/src/app/actions.ts`)
1. **Pre-validation Checks**:
   - Token exists in `claimable_tokens`
   - `is_claimed = false`
   - `quest_id` matches provided quest
2. **Token Locking**:
   - Sets `is_claimed = true`
   - Records `claimed_by` user ID
3. **Progress Creation**:
   - Creates `user_progress` record with `status = 'completed'`
   - Stores `token_fragment` for audit trail
4. **XP Trigger**: Backend hook automatically calculates and awards XP

#### Double-Spend Prevention
- **Database Constraint**: Unique `token` field prevents duplicate tokens
- **Status Check**: `is_claimed` flag ensures single-use
- **Atomic Operations**: Token validation and update happen in single transaction
- **Audit Trail**: All token redemptions logged with user and timestamp

### XP Logic Summary
```
Quest Completion → Token Generation → Token Redemption → Progress Creation → Backend XP Hook → User Update
```

## 4. Luanti-API-Interface

### learning_core Mod Endpoints

#### Token Upload Endpoint
- **URL**: `POST /items/claimable_tokens`
- **Method**: POST
- **Authentication**: Bearer token (`llu_api_token`)
- **Payload**:
  ```json
  {
    "token": "K9X2",
    "quest_id": "quest-uuid",
    "is_claimed": false
  }
  ```
- **Response**: Success (200/204) or error with status code
- **Features**:
  - Generates 6-character alphanumeric codes
  - Validates token uniqueness at database level
  - Provides user feedback via chat messages

#### Health Check Endpoint
- **URL**: `GET /server/ping`
- **Method**: GET
- **Purpose**: Backend connectivity verification on mod startup
- **Response**: Success or error logged to console

### API Configuration

#### Backend URL Settings
- **Default**: `http://directus:8055` (Docker internal)
- **Configurable**: Via `llu_backend_url` in `minetest.conf`
- **Smart Routing**: Server uses internal URL, browser uses public URL

#### Security Configuration
- **HTTP API Requirement**: Mod fails to load without HTTP API access
- **Token Validation**: Critical error if `llu_api_token` not configured
- **Request Timeout**: 5 seconds for all API calls

### Luanti Command Interface

#### `/finish` Command
- **Usage**: `/finish <quest_id>`
- **Function**: Simulates quest completion and generates token
- **Process**:
  1. Validates quest_id parameter
  2. Generates unique 6-character token
  3. Uploads token to backend via API
  4. Provides user feedback with generated code

### API Interface Summary
```
Luanti Game → /finish Command → Token Generation → POST /items/claimable_tokens → Backend Storage
```

## CRITICAL FINDINGS

### Security Considerations
1. **Token System**: Single-use tokens with database-level uniqueness
2. **Authentication**: Cookie-based with HttpOnly and secure flags
3. **API Security**: Bearer token authentication for Luanti backend calls
4. **Input Validation**: All user inputs validated before processing

### Performance Notes
1. **XP Calculation**: Asynchronous backend processing prevents UI blocking
2. **Token Validation**: Database-level constraints ensure data integrity
3. **Caching**: Disabled for all API requests to ensure real-time data

### Integration Points
1. **External Providers**: Webhook system for external learning platforms
2. **Multi-world Support**: Configurable Luanti server connections
3. **School Management**: Hierarchical user organization with world assignments

---

**Document Status**: COMPLETE  
**Analysis Date**: 2026-02-07  
**System Version**: Learn-First Engine v2 (Token System)