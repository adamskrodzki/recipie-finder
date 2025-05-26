# Supabase Integration Guidelines - AI-Assisted Recipe Finder (Automation-First)

## Table of Contents
1. [Introduction & Automation Philosophy](#introduction--automation-philosophy)
2. [Supabase Project Setup & CLI](#supabase-project-setup--cli)
    2.1. [Initial Project Creation (One-Time Manual Step)](#initial-project-creation-one-time-manual-step)
    2.2. [Supabase CLI Installation & Setup](#supabase-cli-installation--setup)
    2.3. [Environment Variables (Frontend)](#environment-variables-frontend)
    2.4. [Supabase Client Initialization](#supabase-client-initialization)
3. [Schema Management: Migrations First](#schema-management-migrations-first)
    3.1. [Development Workflow: Remote-First with `db push`](#development-workflow-remote-first-with-db-push)
    3.2. [Writing Migration Files](#writing-migration-files)
    3.3. [Deploying Migrations to Staging/Production (CI/CD)](#deploying-migrations-to-stagingproduction-cicd)
4. [Security Considerations & Abuse Prevention](#security-considerations--abuse-prevention)
    4.1. [Preventing Excessive Data Creation (Quotas)](#preventing-excessive-data-creation-quotas)
    4.2. [Preventing Mass User Account Creation](#preventing-mass-user-account-creation)
    4.3. [General Security Best Practices](#general-security-best-practices)
5. [Authentication (Supabase Auth)](#authentication-supabase-auth)
    5.1. [Anonymous Users](#anonymous-users)
    5.2. [Opt-In Full Authentication](#opt-in-full-authentication)
    5.3. [Accessing User Information](#accessing-user-information)
    5.4. [Auth State Listener](#auth-state-listener)
6. [Data Access Patterns (Supabase Client)](#data-access-patterns-supabase-client)
    6.1. [Fetching Data (`select`)](#fetching-data-select)
    6.2. [Inserting Data (`insert`)](#inserting-data-insert)
    6.3. [Updating Data (`update`)](#updating-data-update)
    6.4. [Upserting Data (`upsert`)](#upserting-data-upsert)
    6.5. [Deleting Data (`delete`)](#deleting-data-delete)
    6.6. [Calling PostgreSQL Functions (`rpc`)](#calling-postgresql-functions-rpc)
7. [Row Level Security (RLS)](#row-level-security-rls)
    7.1. [General Policy Structure](#general-policy-structure)
    7.2. [Specific Table Policies](#specific-table-policies)
    7.3. [Testing RLS](#testing-rls)
8. [TypeScript with Supabase](#typescript-with-supabase)
    8.1. [Supabase Type Generation (Recommended)](#supabase-type-generation-recommended)
    8.2. [Using Generated Types](#using-generated-types)
9. [Service Layer Integration](#service-layer-integration)
    9.1. [Auth Service Example](#auth-service-example)
    9.2. [Data Service Example (Recipe Storage)](#data-service-example-recipe-storage)
10. [Custom Hooks with Supabase Data](#custom-hooks-with-supabase-data)
    10.1. [`useAuth` Hook Example](#useauth-hook-example)
    10.2. [`useRecipeStorage` Hook Example](#userecipestorage-hook-example)
11. [Error Handling for Supabase Operations](#error-handling-for-supabase-operations)
12. [Testing Supabase Interactions](#testing-supabase-interactions)
    12.1. [Mocking Supabase Client](#mocking-supabase-client)
    12.2. [Testing Migrations & RLS](#testing-migrations--rls)
    12.3. [End-to-End Testing](#end-to-end-testing)
13. [Environment Management & Keys](#environment-management--keys)
14. [Supabase Best Practices Summary (Automation Focus)](#supabase-best-practices-summary-automation-focus)

## 1. Introduction & Automation Philosophy

These guidelines outline an **automation-first** approach to integrating and utilizing Supabase as the backend-as-a-service (BaaS) for the AI-Assisted Recipe Finder. The primary goal is to minimize manual intervention in the Supabase Studio UI for schema setup and evolution, relying instead on the Supabase CLI and version-controlled migration scripts. This document emphasizes a workflow that can directly interact with remote Supabase instances for development if local Docker setups prove problematic.

**Core Supabase Services Used:**
- **PostgreSQL Database:** Schema managed via CLI and SQL migrations.
- **Supabase Auth:** For handling anonymous and opt-in registered user sessions.
- **Auto-generated APIs:** Accessed via the Supabase JS client library.

This document assumes familiarity with SQL. The focus here is on *how* to use Supabase services effectively within our existing project architecture, with a strong emphasis on security and automated deployment.

## 2. Supabase Project Setup & CLI

### 2.1. Initial Project Creation (One-Time Manual Step)
1. Go to [supabase.com](https://supabase.com) and create a new project (e.g., `dev`, `staging`, `prod`).
2. Securely store your database password for each project. This password will be needed for linking the CLI and for CI/CD.

### 2.2. Supabase CLI Installation & Setup
The Supabase CLI is central to our automated workflow.
1.  **Install CLI:**
    ```bash
    npm install supabase --save-dev
    ```
    (Or install globally: `npm install supabase -g`)
2.  **Login:**
    ```bash
    supabase login
    ```
    This authenticates the CLI with your Supabase account via a browser.
3.  **Initialize Supabase in Project (if not already done):**
    Navigate to your project's root directory (or a dedicated `backend` directory if preferred) and run:
    ```bash
    supabase init
    ```
    This creates a `supabase` directory containing `config.toml` and a `migrations` subdirectory.
4.  **Link to Remote Supabase Project:**
    For each environment (dev, staging, prod), you'll link your local setup to the corresponding Supabase project.
    ```bash
    supabase link --project-ref <your-project-id>
    ```
    Replace `<your-project-id>` with the actual ID from your Supabase project's dashboard URL (e.g., `https://app.supabase.com/project/<your-project-id>`). You will be prompted for the database password for that project.

### 2.3. Environment Variables (Frontend)
Configure your frontend application (e.g., Vite) with the Supabase URL and Anon Key for the respective environment.
```env
# .env / .env.development / .env.production
VITE_SUPABASE_URL=your_supabase_project_url_for_this_env
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_for_this_env
```
The `ANON_KEY` is client-safe and its permissions are governed by Row Level Security (RLS).

### 2.4. Supabase Client Initialization
Create a dedicated file for the Supabase client instance.
```typescript
// src/services/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase'; // Ensure this path is correct

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is not set. Check your .env file.');
}
if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is not set. Check your .env file.');
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  },
);
```

## 3. Schema Management: Migrations First

All database schema changes (tables, RLS policies, functions, types, etc.) **must** be defined in SQL migration files stored in the `supabase/migrations/` directory. This ensures version control, repeatability, and automated deployments. **Avoid making schema changes directly in the Supabase Studio UI for any environment beyond initial exploration.**

### 3.1. Development Workflow: Remote-First with `db push`
This workflow is suitable if you prefer to develop directly against a remote Supabase instance (e.g., a dedicated `dev` project) or if local Docker setups (`supabase start`) are problematic.

1.  **Ensure Project is Linked:**
    Verify your local CLI is linked to your development Supabase project:
    ```bash
    npx supabase link --project-ref <your-dev-project-id>
    ```
    (Enter the database password when prompted).
2.  **Create/Edit Migration SQL Files:**
    Manually create or edit SQL files in the `supabase/migrations/` directory. Use the naming convention `YYYYMMDDHHMMSS_descriptive_name.sql`.
    *   For new features, create a new migration file.
    *   For modifications, create a new migration file that alters existing structures.
3.  **Apply Migrations to Remote Dev Database:**
    Use the `db push` command. This command applies any *new* local migration files (those not yet recorded in the remote `supabase_migrations.schema_migrations` table) to the linked remote database.
    ```bash
    npx supabase db push
    ```
    You might be prompted for your database password. This command synchronizes the schema defined by your local migration files with the remote database.
4.  **Verify:** After pushing, check the Supabase Studio (Database > Migrations) to confirm the migration was applied. Also, inspect the schema directly in the Studio's Table Editor or SQL Editor.
5.  **Iterate:** Repeat steps 2-4 as you develop features.

**Alternative (Local First - if Docker is stable for you):**
If you prefer a local Docker-based workflow:
1.  `supabase start`
2.  Make schema changes to the local DB (e.g., via a SQL client).
3.  `supabase db diff -f <migration_name>` to generate the migration file.
4.  Review and commit the migration file.
5.  Then, to apply to a remote dev/staging environment: `supabase link --project-ref <remote_project_id>` followed by `supabase db push` or `supabase migration up`.

### 3.2. Writing Migration Files
Migration files are standard SQL. Ensure they are idempotent where possible, especially for RLS policies, functions, and views, by using `DROP ... IF EXISTS` or `CREATE OR REPLACE`.

**Example: `supabase/migrations/20250527100000_initial_schema.sql`**
```sql
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create recipes table
CREATE TABLE public.recipes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    ingredients_list JSONB,
    instructions TEXT NOT NULL,
    original_prompt_ingredients TEXT,
    refinement_instruction TEXT,
    parent_recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
    ai_model_used TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.recipes IS 'Stores core recipe data generated by AI or refined by users.';

-- Create user_favorites table
CREATE TABLE public.user_favorites (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
    rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
    favorited_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (user_id, recipe_id)
);
COMMENT ON TABLE public.user_favorites IS 'Links users to their favorited recipes and stores ratings.';

-- Create user_pantry_items table
CREATE TABLE public.user_pantry_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ingredient_name TEXT NOT NULL,
    added_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (user_id, ingredient_name)
);
COMMENT ON TABLE public.user_pantry_items IS 'Stores individual pantry ingredients for users.';

-- RLS Policies
-- For user_favorites
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.user_favorites;
CREATE POLICY "Users can manage their own favorites"
    ON public.user_favorites
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- For user_pantry_items
ALTER TABLE public.user_pantry_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own pantry items" ON public.user_pantry_items;
CREATE POLICY "Users can manage their own pantry items"
    ON public.user_pantry_items
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- For recipes
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Recipes are publicly viewable" ON public.recipes;
CREATE POLICY "Recipes are publicly viewable"
    ON public.recipes
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert recipes" ON public.recipes;
CREATE POLICY "Authenticated users can insert recipes"
    ON public.recipes
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Grant necessary privileges to roles (anon, authenticated)
-- These are table-level grants; RLS will further restrict access.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_pantry_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_favorites TO anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.recipes TO anon, authenticated; -- Example: allow insert for all authenticated, select for all
-- Adjust grants based on the principle of least privilege.
```

### 3.3. Deploying Migrations (CI/CD Focus)
Use the Supabase CLI in your CI/CD pipeline to apply migrations to staging and production environments.

1.  **Store Secrets in CI/CD:**
    *   `SUPABASE_ACCESS_TOKEN`: For CLI authentication.
    *   `SUPABASE_DB_PASSWORD`: Database password for the target environment.
    *   `PROJECT_ID`: The Supabase project ID for the target environment.
2.  **CI/CD Pipeline Step:**
    ```yaml
    # Example GitHub Actions step
    - name: Deploy Supabase Migrations to Staging
      if: github.ref == 'refs/heads/develop' # Or your staging branch
      env:
        SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        SUPABASE_DB_PASSWORD: ${{ secrets.STAGING_SUPABASE_DB_PASSWORD }}
        PROJECT_ID: ${{ secrets.STAGING_PROJECT_ID }}
      run: |
        npm install supabase --global
        supabase link --project-ref $PROJECT_ID --db-password $SUPABASE_DB_PASSWORD
        supabase migration up # Applies pending migrations from supabase/migrations

    - name: Deploy Supabase Migrations to Production
      if: github.ref == 'refs/heads/main' # Or your production branch
      env:
        SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        SUPABASE_DB_PASSWORD: ${{ secrets.PROD_SUPABASE_DB_PASSWORD }}
        PROJECT_ID: ${{ secrets.PROD_PROJECT_ID }}
      run: |
        npm install supabase --global
        supabase link --project-ref $PROJECT_ID --db-password $SUPABASE_DB_PASSWORD
        supabase migration up
    ```
    The `supabase migration up` command applies migrations sequentially based on the `supabase_migrations.schema_migrations` table in the target database.

### 3.4. Automated Migrations on App Start (Considerations & Risks)
**This practice is generally discouraged for production systems.**
- **Security Risk:** Exposing database admin credentials (like `SERVICE_ROLE_KEY`) to an application runtime is a significant security vulnerability.
- **Complexity:** Managing migration state (which migrations have run) reliably within an application is complex and error-prone. The Supabase CLI handles this robustly.
- **Concurrency Issues:** Multiple app instances could attempt migrations simultaneously.
- **Operational Overhead:** Failed migrations during app startup can be difficult to diagnose and recover from.

**Recommendation:** Use CI/CD pipelines for automated, controlled migration deployments.

## 4. Security Considerations & Abuse Prevention

While RLS provides fine-grained authorization, additional measures are needed to prevent abuse.

### 4.1. Preventing Excessive Data Creation (Quotas)
A malicious or buggy authenticated user could attempt to flood tables like `user_favorites` or `user_pantry_items` with excessive entries under their own `user_id`.

**Solutions:**

1.  **Database-Level Quotas (Recommended for direct-to-DB writes):**
    Use PostgreSQL functions and triggers to enforce per-user limits.
    ```sql
    -- Add to a migration file
    CREATE OR REPLACE FUNCTION check_user_pantry_limit()
    RETURNS TRIGGER AS $$
    DECLARE
        item_count INTEGER;
        -- Define a reasonable limit, e.g., 200 items per user
        max_pantry_items INTEGER := 200;
    BEGIN
        SELECT count(*) INTO item_count
        FROM public.user_pantry_items
        WHERE user_id = NEW.user_id;

        IF item_count >= max_pantry_items THEN
            RAISE EXCEPTION 'User has reached the maximum limit of % pantry items.', max_pantry_items;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER; -- Use SECURITY DEFINER cautiously, ensure function is secure

    DROP TRIGGER IF EXISTS enforce_pantry_limit_on_insert ON public.user_pantry_items;
    CREATE TRIGGER enforce_pantry_limit_on_insert
    BEFORE INSERT ON public.user_pantry_items
    FOR EACH ROW EXECUTE FUNCTION check_user_pantry_limit();

    -- Similar triggers can be created for user_favorites or other user-specific tables.
    ```
    *Note on `SECURITY DEFINER`*: Use with caution. It allows the function to run with the permissions of the user who defined it (usually a superuser). Ensure the function cannot be exploited. For simple count checks on the same user's data, `SECURITY INVOKER` might be sufficient if RLS allows the user to count their own items.

2.  **Backend API Endpoints (Alternative):**
    If database functions are not preferred, route write operations through your backend (e.g., Express API or Supabase Edge Functions). The backend can then query the current count and enforce the limit before writing to the database. This adds latency but centralizes logic.

3.  **Supabase API Rate Limiting:**
    Supabase applies rate limits to API requests (e.g., per IP, per user). This helps mitigate rapid-fire attacks but may not prevent a slow, determined fill-up within quota limits. Configure these in your Supabase project settings if more granular control is needed beyond defaults.

### 4.2. Preventing Mass User Account Creation
Automated scripts could attempt to create numerous user accounts.

**Solutions:**

1.  **Enable Email Verification:** In Supabase Dashboard > Authentication > Settings, enable "Enable email confirmations."
2.  **Implement CAPTCHA/Turnstile:**
    *   Integrate Cloudflare Turnstile (recommended for better UX) or hCaptcha/reCAPTCHA on your signup and login forms.
    *   Supabase Auth settings allow you to configure CAPTCHA providers.
3.  **Monitor Signup Rates:** Keep an eye on user growth. Unusual spikes can indicate abuse.
4.  **Social Logins:** Encouraging social logins (Google, GitHub, etc.) offloads some bot detection to those providers.

### 4.3. General Security Best Practices
*   **Principle of Least Privilege:** Grant only necessary permissions to database roles (`anon`, `authenticated`). RLS further refines this.
*   **Input Validation:** Always validate and sanitize user input on the client-side and, crucially, on the server-side (if using backend functions/APIs) or via database constraints (`CHECK` constraints, data types).
*   **Regularly Review RLS Policies:** As your application evolves, ensure RLS policies remain correct and secure.
*   **Keep Supabase CLI and Client Libraries Updated:** For security patches and new features.
*   **Secure API Keys:** Protect your `service_role` key and `SUPABASE_ACCESS_TOKEN` diligently. The `anon` key is public but its power is limited by RLS.

## 5. Authentication (Supabase Auth)
(Sections 5.1 to 5.4 remain the same as in the previous comprehensive version, detailing anonymous users, opt-in full authentication, accessing user information, and auth state listeners.)

### 5.1. Anonymous Users
- **Purpose:** Allow users to use the app and save favorites/pantry items without explicitly creating an account.
- **Implementation:**
  ```typescript
  // In an auth service or hook
  import { supabase } from './supabaseClient';
  import { Session } from '@supabase/supabase-js';

  export async function ensureUserSession(): Promise<Session | null> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error('Error getting session:', sessionError);
        return null;
    }

    if (session) {
        return session;
    }

    // No active session, try to sign in anonymously
    const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
    if (anonError) {
      console.error('Error signing in anonymously:', anonError);
      // Handle error: show message to user, maybe disable save features
      return null;
    }
    return anonData.session;
  }
  ```
- **Persistence:** `persistSession: true` in `supabaseClient.ts` ensures the anonymous user's session (and thus their `user.id`) is stored in `localStorage`.

### 5.2. Opt-In Full Authentication
- **Purpose:** Allow users to convert their anonymous account to a full account (e.g., email/password, social login) to persist data across devices.
- **Implementation:**
  ```typescript
  // In an auth service
  import { supabase } from './supabaseClient';
  import { User, SignUpWithPasswordCredentials, SignInWithPasswordCredentials, Provider } from '@supabase/supabase-js';

  export async function signUpWithEmail(credentials: SignUpWithPasswordCredentials): Promise<{ user: User | null; error: Error | null }> {
    const { data, error } = await supabase.auth.signUp(credentials);
    // Supabase automatically attempts to link the anonymous user's data
    // if the signUp happens during an active anonymous session.
    return { user: data.user, error: error as Error | null };
  }

  export async function signInWithEmail(credentials: SignInWithPasswordCredentials): Promise<{ user: User | null; error: Error | null }> {
    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    return { user: data.user, error: error as Error | null };
  }

  export async function signInWithOAuth(provider: Provider): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    return { error: error as Error | null };
  }

  export async function signOut(): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signOut();
    return { error: error as Error | null };
  }
  ```
- **Linking Data:** If a user signs up or logs in while an anonymous session is active, Supabase Auth attempts to link the `auth.uid()` of the anonymous user to the new authenticated user.

### 5.3. Accessing User Information
```typescript
// In an async function or useEffect
async function logUserInfo() {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: { session } } = await supabase.auth.getSession();

if (session) {
    console.log('User ID:', session.user.id);
    console.log('User Email:', session.user.email);
    console.log('Is Anonymous:', session.user.is_anonymous);
  } else {
    console.log('No active session.');
  }
}
```

### 5.4. Auth State Listener
To react to authentication changes globally (e.g., in a root component or layout):
```typescript
// Example in a React component or context
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient'; // Adjust path as needed
import { Session, User } from '@supabase/supabase-js';

function AuthStatusDisplay() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

useEffect(() => {
  const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('Auth event:', _event, 'Session:', session);
        setCurrentSession(session);
        setCurrentUser(session?.user ?? null);
      }
    );

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentSession(session);
      setCurrentUser(session?.user ?? null);
    });

  return () => {
    // Cleanup listener on component unmount
    authListener.subscription.unsubscribe();
  };
}, []);

  if (isLoading) return <p>Loading auth state...</p>;
  if (currentUser) return <p>Logged in as: {currentUser.email || currentUser.id}</p>;
  return <p>Not logged in.</p>;
}
```

## 6. Data Access Patterns (Supabase Client)
(Sections 6.1 to 6.6 remain the same as previously detailed, covering `select`, `insert`, `update`, `upsert`, `delete`, and `rpc` with examples.)

### 6.1. Fetching Data (`select`)
```typescript
// In a service file, using generated types
import { supabase } from './supabaseClient';
import { Tables } from '../types/supabase'; // Path to your generated types

type UserFavoriteRow = Tables<'user_favorites'>['Row'];
type RecipeRow = Tables<'recipes'>['Row'];

export async function getFavoriteRecipesWithDetails(userId: string): Promise<Array<UserFavoriteRow & { recipes: RecipeRow | null }>> {
  const { data, error } = await supabase
    .from('user_favorites')
    .select(`
      *,
      recipes (*)
    `) // recipes (*) fetches all columns from the related recipes table
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching favorite recipes:', error);
    throw error; // Or handle more gracefully
  }
  return data || [];
}
```

### 6.2. Inserting Data (`insert`)
```typescript
// In a service file, using generated types
import { supabase } from './supabaseClient';
import { Tables } from '../types/supabase';

type RecipeRow = Tables<'recipes'>['Row'];
type RecipeInsert = Tables<'recipes'>['Insert'];

export async function createNewRecipe(recipeData: RecipeInsert): Promise<RecipeRow | null> {
  const { data, error } = await supabase
    .from('recipes')
    .insert(recipeData)
    .select() // Important to get the inserted row back, especially the ID
    .single(); // Expecting a single row

  if (error) {
    console.error('Error creating recipe:', error);
    throw error;
  }
  return data;
}
```

### 6.3. Updating Data (`update`)
```typescript
// In a service file, using generated types
import { supabase } from './supabaseClient';
import { Tables } from '../types/supabase';

type UserFavoriteRow = Tables<'user_favorites'>['Row'];
type UserFavoriteUpdate = Tables<'user_favorites'>['Update'];

export async function updateUserRating(userId: string, recipeId: string, updates: UserFavoriteUpdate): Promise<UserFavoriteRow | null> {
  const { data, error } = await supabase
    .from('user_favorites')
    .update(updates)
    .eq('user_id', userId)
    .eq('recipe_id', recipeId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user rating:', error);
    throw error;
  }
  return data;
}
```

### 6.4. Upserting Data (`upsert`)
Useful for creating or updating in one go, like for favorites.
```typescript
// In a service file, using generated types
import { supabase } from './supabaseClient';
import { Tables } from '../types/supabase';

type UserFavoriteInsert = Tables<'user_favorites'>['Insert']; // Upsert often uses Insert type

export async function setFavoriteAndRating(favoriteData: UserFavoriteInsert): Promise<void> {
  const { error } = await supabase
    .from('user_favorites')
    .upsert(favoriteData, { onConflict: 'user_id, recipe_id' }); // Specify conflict target

  if (error) {
    console.error('Error upserting favorite/rating:', error);
    throw error;
  }
}
```

### 6.5. Deleting Data (`delete`)
```typescript
// In a service file, using generated types
import { supabase } from './supabaseClient';

export async function removePantryItemById(itemId: string): Promise<void> {
  // RLS policy should ensure only the owner can delete
  const { error } = await supabase
    .from('user_pantry_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    console.error('Error deleting pantry item:', error);
    throw error;
  }
}
```

### 5.6. Calling PostgreSQL Functions (`rpc`)
If you define database functions (e.g., for complex transactions or business logic).
```sql
-- Example SQL function in a migration
CREATE OR REPLACE FUNCTION get_user_recipe_count(p_user_id UUID)
RETURNS INT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.user_favorites WHERE user_id = p_user_id);
END;
$$;
```
```typescript
// In a service file
import { supabase } from './supabaseClient';

export async function fetchUserRecipeCount(userId: string): Promise<number | null> {
  const { data, error } = await supabase.rpc('get_user_recipe_count', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error calling get_user_recipe_count:', error);
    throw error;
  }
  return typeof data === 'number' ? data : null;
}
```

## 7. Row Level Security (RLS)
(Sections 7.1 to 7.3 remain the same, emphasizing RLS definition in migrations and testing.)

### 7.1. General Policy Structure
```sql
-- Enable RLS on the table
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT (reading data)
-- Ensure to DROP IF EXISTS for idempotency in migrations
DROP POLICY IF EXISTS "Policy Name Select" ON public.table_name;
CREATE POLICY "Policy Name Select"
ON public.table_name
FOR SELECT
USING (auth.uid() = user_id_column); -- auth.uid() is the current logged-in user's ID

-- Policy for INSERT (creating data)
DROP POLICY IF EXISTS "Policy Name Insert" ON public.table_name;
CREATE POLICY "Policy Name Insert"
ON public.table_name
FOR INSERT
WITH CHECK (auth.uid() = user_id_column);

-- Policy for UPDATE (modifying data)
DROP POLICY IF EXISTS "Policy Name Update" ON public.table_name;
CREATE POLICY "Policy Name Update"
ON public.table_name
FOR UPDATE
USING (auth.uid() = user_id_column) -- Which rows can be targeted
WITH CHECK (auth.uid() = user_id_column); -- What values are allowed in the update

-- Policy for DELETE (removing data)
DROP POLICY IF EXISTS "Policy Name Delete" ON public.table_name;
CREATE POLICY "Policy Name Delete"
ON public.table_name
FOR DELETE
USING (auth.uid() = user_id_column);
```

### 7.2. Specific Table Policies
- **`user_favorites` & `user_pantry_items`**: Users can CRUD their own entries. `user_id` column must match `auth.uid()`.
- **`recipes`**:
    - `SELECT`: Allow public read access (`USING (true)`).
    - `INSERT`: Allow any authenticated user (even anonymous) to insert (`WITH CHECK (auth.role() = 'authenticated')`). This is because a recipe is created when a user favorites it.
    - `UPDATE`/`DELETE`: Generally, disallow direct updates/deletes by users to the global `recipes` table. Refinements create new recipes. Admin roles could be an exception, managed by specific RLS policies for an `admin` role.

### 7.3. Testing RLS
- Use the Supabase Studio SQL Editor (connected to your local instance if using `supabase start`, or directly on a dev remote instance) to test policies by impersonating roles or specific users:
  ```sql
  -- As an anonymous user
  SET ROLE anon;
  -- As an authenticated user
  SET ROLE authenticated;
  SET request.jwt.claims = '{"role":"authenticated", "sub":"user-uuid-to-test"}';

  -- Now run your SELECT/INSERT/UPDATE/DELETE queries to test policies
  -- Example: SELECT * FROM public.user_favorites;

  RESET ROLE;
  ```
- Write automated tests that attempt to access/modify data as different users (mocking the Supabase client's auth state).

## 8. TypeScript with Supabase

### 8.1. Supabase Type Generation (Recommended)
Use the Supabase CLI to generate TypeScript types directly from your database schema.
1.  Ensure your local schema (after `supabase start` and applying changes) or remote schema (if linked and migrations are up-to-date) is current.
2.  Generate types:
    ```bash
    # For a linked remote project:
    npx supabase gen types typescript --project-id <your-project-id> --schema public > src/types/supabase.ts

    # For a local Supabase instance (after supabase start):
    npx supabase gen types typescript --local > src/types/supabase.ts
    ```
    Commit `src/types/supabase.ts` to your repository. Add it to `.gitignore` if you prefer to generate it as part of your build process, but committing it ensures all developers use the same types.

### 8.2. Using Generated Types
The generated `supabase.ts` file will typically export a `Database` interface and helper types like `Tables`, `Enums`, `Functions`.
```typescript
// src/services/supabaseClient.ts
import { Database } from '../types/supabase'; // Path to your generated types
// ...
export const supabase: SupabaseClient<Database> = createClient<Database>(/* ... */);

// In a service file:
import { supabase } from './supabaseClient';
import { Tables, Enums }s from '../types/supabase'; // Corrected typo: Enums

type RecipeRow = Tables<'recipes'>['Row'];
type RecipeInsert = Tables<'recipes'>['Insert'];
// type SomeEnumType = Enums<'your_enum_name'>; // If you have enums

async function getRecipeById(id: string): Promise<RecipeRow | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single();

  // PGRST116: "The result contains 0 rows" - not an error if .single() is used and no row is found.
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching recipe by ID:', error);
    throw error;
  }
  return data;
}
```

## 9. Service Layer Integration
(Sections 9.1 and 9.2 remain the same, providing examples for `authService.ts` and `recipeStorageService.ts`.)

### 9.1. Auth Service Example
```typescript
// src/services/authService.ts
import { supabase } from './supabaseClient';
import { Session, User, SignUpWithPasswordCredentials, SignInWithPasswordCredentials, Provider, AuthChangeEvent, Subscription } from '@supabase/supabase-js';

export async function getCurrentSession(): Promise<Session | null> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error.message);
    // Depending on your error handling strategy, you might throw or return null
  }
  return session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error.message);
  }
  return user;
}

export async function ensureUserSession(): Promise<Session | null> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error('Error getting session:', sessionError);
        return null;
    }

    if (session) {
        return session;
    }

    // No active session, try to sign in anonymously
    const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
    if (anonError) {
      console.error('Error signing in anonymously:', anonError);
      return null;
    }
    return anonData.session;
}

export async function appSignUp(credentials: SignUpWithPasswordCredentials): Promise<{ user: User | null; session: Session | null; error: Error | null }> {
    const { data, error } = await supabase.auth.signUp(credentials);
    return { user: data.user, session: data.session, error: error as Error | null };
}

export async function appSignIn(credentials: SignInWithPasswordCredentials): Promise<{ user: User | null; session: Session | null; error: Error | null }> {
    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    return { user: data.user, session: data.session, error: error as Error | null };
}

export async function appSignInWithOAuth(provider: Provider): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    return { error: error as Error | null };
}

export async function appSignOut(): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signOut();
    return { error: error as Error | null };
}

export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void): Subscription {
  const { data: authListener } = supabase.auth.onAuthStateChange(callback);
  return authListener.subscription;
}
```

### 9.2. Data Service Example (Recipe Storage)
```typescript
// src/services/recipeStorageService.ts
import { supabase } from './supabaseClient';
import { Tables } from '../types/supabase'; // Ensure this path is correct

type RecipeRow = Tables<'recipes'>['Row'];
type RecipeInsert = Tables<'recipes'>['Insert'];
type UserFavoriteRow = Tables<'user_favorites'>['Row'];
type UserFavoriteInsert = Tables<'user_favorites'>['Insert'];
type PantryItemRow = Tables<'user_pantry_items'>['Row'];
type PantryItemInsert = Tables<'user_pantry_items'>['Insert'];


export async function fetchRecipeById(recipeId: string): Promise<RecipeRow | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', recipeId)
    .single();
  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is valid for .single()
      console.error('Error fetching recipe by ID:', error);
      throw error;
  }
  return data;
}

export async function createRecipe(recipeData: RecipeInsert): Promise<RecipeRow | null> {
  const { data, error } = await supabase
    .from('recipes')
    .insert(recipeData)
    .select()
    .single();
  if (error) {
      console.error('Error creating recipe:', error);
      throw error;
  }
  return data;
}

export async function fetchUserFavorites(userId: string): Promise<Array<UserFavoriteRow & { recipes: RecipeRow | null }>> {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('*, recipes (*)') // Fetches related recipe details
    .eq('user_id', userId);
  if (error) {
      console.error('Error fetching user favorites:', error);
      throw error;
  }
  return data || [];
}

export async function upsertUserFavorite(favoriteData: UserFavoriteInsert): Promise<(UserFavoriteRow & { recipes: RecipeRow | null }) | null> {
  const { data, error } = await supabase
    .from('user_favorites')
    .upsert(favoriteData, { onConflict: 'user_id, recipe_id' })
    .select('*, recipes (*)') // Return the upserted record with recipe details
    .single();
  if (error) {
      console.error('Error upserting user favorite:', error);
      throw error;
  }
  return data;
}

export async function removeUserFavorite(userId: string, recipeId: string): Promise<void> {
  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('recipe_id', recipeId);
  if (error) {
      console.error('Error removing user favorite:', error);
      throw error;
  }
}

export async function fetchPantryItems(userId: string): Promise<PantryItemRow[]> {
    const { data, error } = await supabase
        .from('user_pantry_items')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false });
    if (error) {
        console.error('Error fetching pantry items:', error);
        throw error;
    }
    return data || [];
}

export async function addPantryItem(itemData: PantryItemInsert): Promise<PantryItemRow | null> {
    const { data, error } = await supabase
        .from('user_pantry_items')
        .insert(itemData)
        .select()
        .single();
    if (error) {
        console.error('Error adding pantry item:', error);
        throw error;
    }
    return data;
}

export async function removePantryItem(itemId: string): Promise<void> {
    const { error } = await supabase
        .from('user_pantry_items')
        .delete()
        .eq('id', itemId);
    if (error) {
        console.error('Error removing pantry item:', error);
        throw error;
    }
}
```

## 10. Custom Hooks with Supabase Data
(Sections 10.1 and 10.2 remain the same, providing examples for `useAuth` and `useRecipeStorage` hooks.)

### 10.1. `useAuth` Hook Example
```typescript
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { Session, User, AuthChangeEvent, Subscription } from '@supabase/supabase-js';
import * as authService from '../services/authService'; // Assuming authService.ts is in ../services/

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true until initial session is checked

  useEffect(() => {
    // Check for existing session on mount
    authService.getCurrentSession().then(currentSession => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth state changes
    const authSubscription: Subscription = authService.onAuthStateChange(
      (_event: AuthChangeEvent, sessionState: Session | null) => {
      setSession(sessionState);
      setUser(sessionState?.user ?? null);
        setIsLoading(false); // Ensure loading is false after any auth event
      }
    );

    // Cleanup subscription on unmount
    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user,
    isLoading,
    isAnonymous: user?.is_anonymous ?? (session ? true : false),
    signUp: authService.appSignUp,
    signIn: authService.appSignIn,
    signOut: authService.appSignOut,
    ensureSession: authService.ensureUserSession,
  };
}
```

### 10.2. `useRecipeStorage` Hook Example
```typescript
// src/hooks/useRecipeStorage.ts
import { useState, useEffect, useCallback } from 'react';
import * as recipeStorageService from '../services/recipeStorageService'; // Adjust path as needed
import { useAuth } from './useAuth'; // Assuming you have a useAuth hook
import { Tables } from '../types/supabase'; // Adjust path as needed

type RecipeRow = Tables<'recipes'>['Row'];
type UserFavoriteRow = Tables<'user_favorites'>['Row'];
type DisplayFavorite = UserFavoriteRow & { recipes: RecipeRow | null }; // For joined data

export function useRecipeStorage() {
  const { user, ensureSession } = useAuth();
  const [favorites, setFavorites] = useState<DisplayFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = useCallback(async (currentUserId: string) => {
    if (!currentUserId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await recipeStorageService.fetchUserFavorites(currentUserId);
      setFavorites(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load favorites');
      setFavorites([]); // Clear favorites on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadFavorites(user.id);
    } else {
      setFavorites([]); // Clear favorites if no user or user logs out
      setIsLoading(false); // Ensure loading is false if no user
    }
  }, [user, loadFavorites]);

  const addOrUpdateFavorite = useCallback(async (recipeId: string, rating?: number) => {
    const currentSession = await ensureSession(); // Ensures user is at least anonymously signed in
    if (!currentSession?.user.id) {
      setError("User session not found. Please try again or log in.");
      return null;
    }
    const userId = currentSession.user.id;

    setIsLoading(true);
    setError(null);
    try {
      const updatedFavorite = await recipeStorageService.upsertUserFavorite({
        user_id: userId,
        recipe_id: recipeId,
        rating: rating,
      });
      if (updatedFavorite) {
        // Optimistically update or refetch
        setFavorites(prev => {
            const existingIndex = prev.findIndex(f => f.recipe_id === recipeId && f.user_id === userId);
            if (existingIndex > -1) {
                const newFavs = [...prev];
                newFavs[existingIndex] = updatedFavorite;
                return newFavs;
            }
            return [...prev, updatedFavorite];
        });
      } else {
        // If upsert doesn't return the full object, or for safety, refetch
        await loadFavorites(userId);
      }
      return updatedFavorite;
    } catch (err: any) {
      setError(err.message || 'Failed to update favorite');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [ensureSession, loadFavorites]);

  const removeFavorite = useCallback(async (recipeId: string) => {
    const currentSession = await ensureSession();
    if (!currentSession?.user.id) {
      setError("User session not found. Please try again or log in.");
      return;
    }
    const userId = currentSession.user.id;

    setIsLoading(true);
    setError(null);
    try {
      await recipeStorageService.removeUserFavorite(userId, recipeId);
      setFavorites(prev => prev.filter(f => !(f.recipe_id === recipeId && f.user_id === userId)));
    } catch (err: any) {
      setError(err.message || 'Failed to remove favorite');
    } finally {
      setIsLoading(false);
    }
  }, [ensureSession]);

  return {
    favorites,
    isLoading,
    error,
    addOrUpdateFavorite,
    removeFavorite,
    refreshFavorites: () => user?.id && loadFavorites(user.id),
  };
}
```

## 10. Error Handling for Supabase Operations
Supabase client methods return an object `{ data, error }`. Always check and handle the `error` object.
```typescript
// In a service method
import { supabase } from './supabaseClient';
import { PostgrestError } from '@supabase/supabase-js'; // Import PostgrestError for type checking

async function fetchDataFromTable(tableName: string) {
  const { data, error }: { data: any[] | null, error: PostgrestError | null } = await supabase
    .from(tableName)
    .select('*');

  if (error) {
    console.error(`Supabase error fetching from ${tableName}:`, {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    // Example of mapping specific errors or providing user-friendly messages
    let userFriendlyMessage = `Failed to fetch data from ${tableName}.`;
    if (error.code === 'PGRST116') { // "The result contains 0 rows"
      // This might not be an error depending on the query (e.g., .single() expecting one row)
      // For a general select, it just means no data matched.
      console.warn(`No data found in ${tableName} for the given query.`);
      // Potentially return empty array or null instead of throwing, based on function's contract
    } else if (error.code === '23505') { // Unique violation
        userFriendlyMessage = "An item with this name already exists.";
    }
    // Consider creating custom error classes that can wrap PostgrestError
    // throw new CustomApiError(userFriendlyMessage, error);
    throw error; // Re-throw to be caught by service/hook error handling or a global error handler
  }
  return data;
}
```
Integrate this with your existing component-level and service-level error display patterns. Map Supabase error codes/messages to user-friendly messages where appropriate.

## 11. Testing Supabase Interactions

### 11.1. Mocking Supabase Client
For unit/integration tests of services or hooks, mock the Supabase client using Jest's mocking capabilities.
```typescript
// Example: __mocks__/supabaseClient.ts (if using Jest manual mocks folder)
// Or setup directly in your test file's beforeEach or jest.mock call

const mockImplementation = () => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }), // Default mock for terminal methods
  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  // Ensure all methods that return a Promise are mocked to resolve/reject
  // For methods like .select() that might not be terminal if not chained with .single() etc.,
  // you might need to adjust the mock based on how it's used or make the mock more sophisticated.
  // For example, if .select() itself returns the promise:
  // select: jest.fn().mockResolvedValue({ data: [], error: null }),
});


export const supabase = {
  auth: {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInAnonymously: jest.fn().mockResolvedValue({ data: { user: {id: 'anon-user-id', is_anonymous: true}, session: {} }, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signInWithOAuth: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
  },
  from: jest.fn(mockImplementation), // Use the factory for 'from'
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
};

// In your test file:
// jest.mock('../services/supabaseClient'); // Auto-mocks using __mocks__ or manual mock
// import { supabase as mockSupabaseClient } from '../services/supabaseClient'; // Import the mocked version

// Example usage in a test:
// (mockSupabaseClient.from('recipes').select as jest.Mock).mockResolvedValueOnce({ data: [{id: '1', title: 'Test Recipe'}], error: null });
// (mockSupabaseClient.auth.getUser as jest.Mock).mockResolvedValueOnce({ data: { user: { id: 'user123' } }, error: null });
```
Ensure your mocks cover the chained methods and the final promise resolution (`.single()`, `.select()` resolving directly, etc.).

### 11.2. Testing Migrations & RLS
- **Local Testing:** Use `supabase db reset` locally to ensure all migrations apply cleanly from scratch. This is the primary way to test migration integrity.
- **RLS Policy Testing:**
    - Manually, using the Supabase Studio SQL Editor on a local or dev instance with `SET ROLE` and `SET request.jwt.claims`.
    - Programmatically, by writing test cases (e.g., in Jest with your mocked Supabase client) that simulate different user roles and attempt operations that should be allowed or denied by RLS. This requires careful mocking of `auth.uid()` or the session.
    - For more robust RLS testing, consider tools that can execute SQL against a test database and assert outcomes, though this often involves more setup.

### 11.3. End-to-End Testing
- Run E2E tests (e.g., using Playwright or Cypress) against a dedicated Supabase staging project.
- This staging project's schema should be kept in sync with production via the same CI/CD migration deployment process.
- E2E tests can cover user flows that involve Supabase interactions, like signing up, saving a favorite, and viewing it, ensuring RLS and other protections work as expected from the user's perspective.

## 12. Environment Management & Keys

- **Local Development:** Use `supabase start` for a fully local environment. The `ANON_KEY` and `URL` provided by `supabase status` are for this local instance. If working remote-first, use a dedicated `dev` Supabase project.
- **Staging/Production (Cloud):**
    - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`: For frontend client. These are specific to each Supabase cloud project (dev, staging, prod) and should be managed as environment variables in your deployment platform (e.g., Vercel, Netlify).
    - `SUPABASE_ACCESS_TOKEN`: For CI/CD to authenticate the Supabase CLI. Store as a CI/CD secret.
    - `SUPABASE_DB_PASSWORD`: For CI/CD to link the project and apply migrations (if `db push` or `migration up` requires it). Store as a CI/CD secret for each environment.
    - `SERVICE_ROLE_KEY`: **Use with extreme caution and only in secure backend environments if absolutely necessary (e.g., for trusted server-side scripts or Supabase Edge Functions that require bypassing RLS).** Never commit it to your repository or expose it to the client-side application.

## 13. Supabase Best Practices Summary (Automation Focus)

1.  **CLI is King for Schema:** All schema changes via version-controlled SQL migration files, managed by the Supabase CLI.
2.  **Automate Migrations via CI/CD:** This is the safest, most reliable way to deploy schema changes to cloud environments using `supabase migration up` or `supabase db push`.
3.  **Local First Development (Recommended but Flexible):** Use `supabase start` and `supabase db diff` for a robust local dev experience. If local Docker is problematic, use `supabase db push` against a remote dev instance. Test migrations thoroughly locally with `supabase db reset`.
4.  **RLS in Migrations:** Define and test all RLS policies within your migration scripts. Make them idempotent (e.g., using `DROP POLICY IF EXISTS ...`).
5.  **Database-Level Quotas & Constraints:** Implement checks (e.g., via triggers and functions) to prevent abuse like excessive data insertion per user, in addition to standard SQL constraints.
6.  **Auth Security:** Enable email verification and CAPTCHA/Turnstile for user signups to prevent bot abuse.
7.  **Generated Types:** Keep your codebase type-safe with `supabase gen types typescript --local` or `--project-id`.
8.  **Secure Key Management:** Strictly control access to `SERVICE_ROLE_KEY` and `SUPABASE_ACCESS_TOKEN`. Use `ANON_KEY` for the client, understanding its permissions are governed by RLS and table grants.
9.  **Idempotent Scripts:** Write migrations (especially for policies, functions, views) to be safely re-runnable if needed, though the CLI migration system tracks applied migrations.
10. **Separate Concerns:** Keep application logic (services, hooks, components) separate from infrastructure tasks like schema migration (handled by CLI/CI-CD).
11. **Abstract Data Logic:** Encapsulate all Supabase client calls within service files. Hooks and components should interact with these services, not directly with the Supabase client.
12. **Thorough Error Handling:** Check the `error` object from every Supabase call and handle it appropriately, providing user-friendly feedback and logging detailed error information.

This automation-centric approach, combined with robust security measures at the database and authentication levels, will lead to a more resilient, maintainable, and scalable backend for your application.
