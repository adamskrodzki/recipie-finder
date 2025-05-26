# Supabase Integration Guidelines - AI-Assisted Recipe Finder (Automation-First)

## Table of Contents
1. [Introduction & Automation Philosophy](#introduction--automation-philosophy)
2. [Supabase Project Setup & CLI](#supabase-project-setup--cli)
    2.1. [Initial Project Creation (One-Time Manual Step)](#initial-project-creation-one-time-manual-step)
    2.2. [Supabase CLI Installation & Setup](#supabase-cli-installation--setup)
    2.3. [Environment Variables (Frontend)](#environment-variables-frontend)
    2.4. [Supabase Client Initialization](#supabase-client-initialization)
3. [Schema Management: Migrations First](#schema-management-migrations-first)
    3.1. [Local Development Workflow & Working Directly with Remote](#local-development-workflow--working-directly-with-remote)
    3.2. [Writing Migration Files](#writing-migration-files)
    3.3. [Deploying Migrations (CI/CD Focus)](#deploying-migrations-ci-cd-focus)
    3.3.1. [Alternatives for Applying Migrations (When CLI Commands Face Issues)](#alternatives-for-applying-migrations-when-cli-commands-face-issues)
    3.4. [Automated Migrations on App Start (Considerations & Risks)](#automated-migrations-on-app-start-considerations--risks)
4. [Authentication (Supabase Auth)](#authentication-supabase-auth)
    4.1. [Anonymous Users](#anonymous-users)
    4.2. [Opt-In Full Authentication](#opt-in-full-authentication)
    4.3. [Accessing User Information](#accessing-user-information)
    4.4. [Auth State Listener](#auth-state-listener)
5. [Data Access Patterns (Supabase Client)](#data-access-patterns-supabase-client)
    5.1. [Fetching Data (`select`)](#fetching-data-select)
    5.2. [Inserting Data (`insert`)](#inserting-data-insert)
    5.3. [Updating Data (`update`)](#updating-data-update)
    5.4. [Upserting Data (`upsert`)](#upserting-data-upsert)
    5.5. [Deleting Data (`delete`)](#deleting-data-delete)
    5.6. [Calling PostgreSQL Functions (`rpc`)](#calling-postgresql-functions-rpc)
6. [Row Level Security (RLS)](#row-level-security-rls)
    6.1. [General Policy Structure](#general-policy-structure)
    6.2. [Specific Table Policies](#specific-table-policies)
    6.3. [Testing RLS](#testing-rls)
7. [TypeScript with Supabase](#typescript-with-supabase)
    7.1. [Supabase Type Generation (Recommended)](#supabase-type-generation-recommended)
    7.2. [Using Generated Types](#using-generated-types)
8. [Service Layer Integration](#service-layer-integration)
    8.1. [Auth Service Example](#auth-service-example)
    8.2. [Data Service Example (Recipe Storage)](#data-service-example-recipe-storage)
9. [Custom Hooks with Supabase Data](#custom-hooks-with-supabase-data)
    9.1. [`useAuth` Hook Example](#useauth-hook-example)
    9.2. [`useRecipeStorage` Hook Example](#userecipestorage-hook-example)
10. [Error Handling for Supabase Operations](#error-handling-for-supabase-operations)
11. [Testing Supabase Interactions](#testing-supabase-interactions)
    11.1. [Mocking Supabase Client](#mocking-supabase-client)
    11.2. [Testing Migrations](#testing-migrations)
    11.3. [End-to-End Testing](#end-to-end-testing)
12. [Environment Management & Keys](#environment-management--keys)
13. [Supabase Best Practices Summary (Automation Focus)](#supabase-best-practices-summary-automation-focus)

## 1. Introduction & Automation Philosophy

These guidelines outline an **automation-first** approach to integrating and utilizing Supabase for the AI-Assisted Recipe Finder. The primary goal is to minimize manual intervention in the Supabase Studio UI for schema setup and evolution, relying instead on the Supabase CLI and version-controlled migration scripts.

**Core Supabase Services Used:**
- **PostgreSQL Database:** Schema managed via CLI and SQL migrations.
- **Supabase Auth:** For anonymous and registered users.
- **Auto-generated APIs:** Accessed via the Supabase JS client.

This document assumes familiarity with SQL. The focus is on leveraging Supabase tools for a repeatable and automated backend setup.

## 2. Supabase Project Setup & CLI

### 2.1. Initial Project Creation (One-Time Manual Step)
1. Go to [supabase.com](https://supabase.com) and create a new project. This is typically the only manual UI step required for project provisioning.
2. Securely store your database password.

### 2.2. Supabase CLI Installation & Setup
The Supabase CLI is central to our automated workflow.
1.  **Install CLI:** `npm install supabase --save-dev` (or globally).
2.  **Login:** `supabase login` (authenticates the CLI with your Supabase account).
3.  **Initialize Supabase in Project:** In your monorepo root or backend directory:
    ```bash
    supabase init
    ```
    This creates a `supabase` directory containing configuration and a place for migrations.
4.  **Link to Remote Project:**
    ```bash
    supabase link --project-ref <your-project-id>
    ```
    Replace `<your-project-id>` (from your project's dashboard URL). You'll be prompted for the database password. This step connects your local Supabase configuration to your hosted Supabase project.

### 2.3. Environment Variables (Frontend)
For the frontend application:
```env
# .env (for Vite frontend)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
The `ANON_KEY` is client-safe and relies on RLS.

### 2.4. Supabase Client Initialization
Create a dedicated file for the Supabase client instance. This aligns with our service-oriented architecture.
```typescript
// src/services/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase'; // Assuming types are generated here

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
      // Automatically refresh the session token
      autoRefreshToken: true,
      // Persist session to localStorage (handles anonymous user ID persistence)
      persistSession: true,
      // Detect session from URL hash (for OAuth, magic links if used later)
      detectSessionInUrl: true,
    },
    // Optional: Global fetch options or other configurations
    // global: {
    //   headers: { 'x-app-version': '1.0.0' },
    // },
  },
);
```
Ensure this client is initialized once and imported where needed (primarily in service files).

## 3. Schema Management: Migrations First

All database schema changes (tables, RLS policies, functions, types) **must** be managed via SQL migration files stored in `supabase/migrations/`. Avoid making schema changes directly in the Supabase Studio UI for any environment that needs to be reproducible.

### 3.1. Local Development Workflow & Working Directly with Remote

**Option A: Local Docker-Based Development (Ideal but can have issues)**
1.  **Start Local Supabase Stack:**
    ```bash
    supabase start
    ```
    This spins up a local, Docker-based Supabase instance. Changes made here are isolated. *If you encounter persistent Docker issues (e.g., container conflicts, network errors), consider Option B.*
2.  **Make Schema Changes (Locally):**
    *   Connect to your local Postgres instance (connection details provided by `supabase start`) using a SQL client.
    *   Apply SQL changes directly.
3.  **Generate Migration Files from Local Changes:**
    ```bash
    supabase db diff -f <migration_name>
    ```
    Example: `supabase db diff -f create_recipes_table`
    This compares your local DB schema with previous migrations and generates a new SQL file in `supabase/migrations/`. Review it carefully.
4.  **Reset Local Database (Optional Testing):**
    ```bash
    supabase db reset
    ```
    Drops and re-applies all migrations locally.
5.  **Apply New Migrations Locally:**
    ```bash
    supabase migration up
    ```

**Option B: Working Directly with Remote Supabase (When Local Docker is Problematic)**
This approach bypasses the local Supabase Docker stack for schema development and applies migrations directly to your linked remote Supabase project. This can be a practical workaround if `supabase start` causes persistent issues.

1.  **Ensure Project is Linked:**
    Make sure your local project is linked to your remote Supabase project:
    ```bash
    npx supabase link --project-ref <your-project-id>
    ```
    You will be prompted for your database password. If you need to switch projects or troubleshoot linking issues, you might use `npx supabase unlink` first.
2.  **Manually Create Migration SQL Files:**
    Instead of generating a diff from a local database, you'll write the SQL for your schema changes directly into a new file in the `supabase/migrations/` directory. Name it using the `YYYYMMDDHHMMSS_descriptive_name.sql` convention.
    Example: `supabase/migrations/20250527100000_create_pantry_table.sql`
    ```sql
    -- supabase/migrations/20250527100000_create_pantry_table.sql
    CREATE TABLE public.user_pantry_items (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        ingredient_name TEXT NOT NULL,
        added_at TIMESTAMPTZ DEFAULT now() NOT NULL,
        UNIQUE (user_id, ingredient_name)
    );
    -- ... include RLS policies etc. ...
    ```
3.  **Apply Migrations to Remote Database Directly:**
    Use the `db push` command. This command applies any new local migration files that haven't been applied to the linked remote database.
    ```bash
    npx supabase db push
    ```
    You will likely be prompted for your database password. This command effectively pushes your local schema changes (as defined in your migration files) to the remote database. This is particularly useful when `supabase migration up` fails due to issues connecting to a local database instance that isn't running or is misconfigured.

    *Verification:* After pushing, you can verify the migration in the Supabase Studio under Database > Migrations. The migration file name should appear in the list.

**Choosing Between Workflows:**
- **Option A (Local Docker)** is preferred for isolated development and thorough testing of migrations before they touch any remote environment. It allows for easy resets and diff generation.
- **Option B (Direct Remote)** is a viable alternative when local Docker presents persistent obstacles. It requires more care in manually writing migration files but allows you to continue development by interacting directly with your hosted Supabase instance.

Always commit your migration files to version control regardless of the workflow.

### 3.2. Writing Migration Files
Migration files are SQL scripts. The filename convention is `YYYYMMDDHHMMSS_descriptive_name.sql`.

**Example: `supabase/migrations/20250526180000_initial_schema.sql`**
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

-- RLS Policies (ensure these are idempotent or structured for re-application if needed)

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

COMMENT ON POLICY "Users can manage their own favorites" ON public.user_favorites IS 'Ensures users only interact with their own favorite entries.';
```
**Idempotency:** Write SQL scripts (especially for RLS, functions, views) to be idempotent (e.g., using `CREATE OR REPLACE`, `DROP IF EXISTS`) so they can be re-run without error if necessary, though the migration system tracks applied migrations.

### 3.3. Deploying Migrations (CI/CD Focus)
This is the recommended way to apply migrations to your hosted Supabase environments (staging, production) once they are developed and tested using either of the workflows in 3.1.

The `supabase migration up` command is typically used in CI/CD. It relies on the Supabase CLI being logged in and linked to the correct project, and it applies migrations sequentially based on the official Supabase migration history table.

1.  **Store Secrets in CI/CD:**
    *   `SUPABASE_ACCESS_TOKEN`: Generate this token.
    *   `SUPABASE_DB_PASSWORD`: The database password for the target environment.
2.  **CI/CD Pipeline Step (Using `migration up`):**
    ```yaml
    # Example GitHub Actions step
    - name: Deploy Supabase Migrations
      env:
        SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        SUPABASE_DB_PASSWORD: ${{ secrets.STAGING_SUPABASE_DB_PASSWORD }} # Or PROD_...
        PROJECT_ID: <your-project-id>
      run: |
        npm install supabase --global # Or use a pre-installed image / dev dependency
        # Linking ensures the CLI targets the correct remote project.
        # The --db-password might not be strictly needed if access token provides sufficient rights,
        # but often required for operations that directly touch the DB schema.
        supabase link --project-ref $PROJECT_ID --db-password $SUPABASE_DB_PASSWORD
        supabase migration up # Applies pending migrations to the remote DB
    ```
    **Note on `db push` vs `migration up` for deployments:**
    - `supabase migration up`: Applies migrations based on Supabase's internal migration tracking. This is generally safer for production environments as it respects the order and history of migrations.
    - `supabase db push`: Pushes the current *local* schema (as defined by *all* local migration files, effectively making the remote schema match the state defined by applying all migrations from an empty state). It's more direct and useful for initial setup or when local `supabase start` is bypassed, but for ongoing production deployments, `migration up` is typically preferred. However, if your CI/CD directly manages the application of new, specific migration files, `db push` can also be used, ensuring the remote schema reflects the latest set of committed migration files.

### 3.3.1. Alternatives for Applying Migrations (When CLI Commands Face Issues)

If CLI commands like `supabase migration up` or even `supabase db push` face persistent issues (e.g., complex networking, firewall restrictions, or intractable local Docker problems preventing even a direct push), consider these alternatives:

1.  **`supabase db push` (Primary CLI Fallback/Alternative):**
    As described in "Option B" of section 3.1, `npx supabase db push` is a powerful command. If `supabase start` isn't working, and you're managing migrations by writing SQL files manually, `db push` is the direct way to apply these to your linked remote database.
    *   **Use Case:** When the local development server (`supabase start`) is problematic, and you want to apply your manually crafted or `db diff`-generated migration files from your local `supabase/migrations` directory directly to the remote (linked) Supabase project.
    *   **Action:**
        ```bash
        # Ensure you are linked to the correct remote project
        # npx supabase link --project-ref YOUR_PROJECT_ID (enter DB password)
        npx supabase db push # (may prompt for DB password again)
        ```
    *   This command attempts to make the remote schema match the schema that would result from applying all your local migration files.

2.  **Manual Migration via Supabase Studio (Last Resort):**
    This is a true fallback if all CLI methods fail.
    *   **Obtain the SQL:** Get the SQL content of your new migration file (e.g., `supabase/migrations/your_migration_file.sql`).
    *   **Navigate to Supabase Studio:** Go to your project's dashboard on [supabase.com](https://supabase.com), then to the "SQL Editor".
    *   **Execute SQL:** Create a "New query", paste the SQL content, and click "RUN".
    *   **Verify & Track:** Check the "Database" -> "Migrations" section in the Studio. Supabase usually detects schema changes. If your manually applied migration doesn't appear as "applied" in the `supabase_migrations.schema_migrations` table, you might need to insert a record there manually to ensure the CLI's `migration up` command doesn't try to re-apply it later. This is risky and error-prone.

Using `supabase db push` is generally preferable to manual SQL execution in the Studio because `db push` still leverages your version-controlled migration files and the Supabase CLI's understanding of your project structure, even if it bypasses the local database server.

### 3.4. Automated Migrations on App Start (Considerations & Risks)
Directly running migrations from your application on startup using an admin key is **highly discouraged for most scenarios due to security risks, complexity in managing migration state, and potential for race conditions.** Stick to CI/CD or developer-run CLI commands for migrations. If this is ever considered, it must be for a highly controlled, non-production, internal tool with robust custom migration tracking, and the risks must be fully understood and accepted.

## 4. Authentication (Supabase Auth)

### 4.1. Anonymous Users
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

### 4.2. Opt-In Full Authentication
- **Purpose:** Allow users to convert their anonymous account to a full account (e.g., email/password, social login) to persist data across devices.
- **Implementation:**
  ```typescript
  // In an auth service
  import { supabase } from './supabaseClient';
  import { User, SignUpWithPasswordCredentials, SignInWithPasswordCredentials, Provider } from '@supabase/supabase-js';

  export async function signUpWithEmail(credentials: SignUpWithPasswordCredentials): Promise<{ user: User | null; error: Error | null }> {
    // Ensure an anonymous session exists if you want to link data
    // await ensureUserSession(); // Supabase handles linking if anonymous session is active
    const { data, error } = await supabase.auth.signUp(credentials);
    return { user: data.user, error };
  }

  export async function signInWithEmail(credentials: SignInWithPasswordCredentials): Promise<{ user: User | null; error: Error | null }> {
    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    return { user: data.user, error };
  }

  export async function signInWithOAuth(provider: Provider): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    return { error };
  }

  export async function signOut(): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  }
  ```
- **Linking Data:** If a user signs up or logs in while an anonymous session is active, Supabase Auth attempts to link the `auth.uid()` of the anonymous user to the new authenticated user.

### 4.3. Accessing User Information
```typescript
// Get current user (can be null)
const user = (await supabase.auth.getUser()).data.user;

// Get current session (can be null)
const session = (await supabase.auth.getSession()).data.session;

if (session) {
  const userId = session.user.id;
  const userEmail = session.user.email;
  const isAnonymous = session.user.is_anonymous;
  // Use this info for RLS-protected queries or UI display
}
```

### 4.4. Auth State Listener
To react to authentication changes globally (e.g., in a root component or layout):
```typescript
// Example in a React component or context
useEffect(() => {
  const { data: authListener } = supabase.auth.onAuthStateChange(
    (event, session) => {
      console.log('Auth event:', event, 'Session:', session);
      // Update application state based on session (e.g., setUser, clearUser)
      // event can be 'SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED', 'TOKEN_REFRESHED', 'PASSWORD_RECOVERY'
    }
  );

  return () => {
    // Cleanup listener on component unmount
    authListener.subscription.unsubscribe();
  };
}, []);
```

## 5. Data Access Patterns (Supabase Client)

Use the Supabase JS client for all database interactions, leveraging generated types.

### 5.1. Fetching Data (`select`)
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

### 5.2. Inserting Data (`insert`)
```typescript
type RecipeInsert = Tables<'recipes'>['Insert'];

export async function createNewRecipe(recipeData: RecipeInsert): Promise<RecipeRow | null> {
  const { data, error } = await supabase
    .from('recipes')
    .insert(recipeData)
    .select()
    .single(); // Expecting a single row back

  if (error) {
    console.error('Error creating recipe:', error);
    throw error;
  }
  return data;
}
```

### 5.3. Updating Data (`update`)
```typescript
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

### 5.4. Upserting Data (`upsert`)
Useful for creating or updating in one go, like for favorites.
```typescript
type UserFavoriteUpsert = Tables<'user_favorites'>['Insert']; // Upsert often uses Insert type

export async function setFavoriteAndRating(favoriteData: UserFavoriteUpsert): Promise<void> {
  const { error } = await supabase
    .from('user_favorites')
    .upsert(favoriteData, { onConflict: 'user_id, recipe_id' }); // Specify conflict target

  if (error) {
    console.error('Error upserting favorite/rating:', error);
    throw error;
  }
}
```

### 5.5. Deleting Data (`delete`)
```typescript
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
  RETURN (SELECT COUNT(*) FROM user_favorites WHERE user_id = p_user_id);
END;
$$;
```
```typescript
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

## 6. Row Level Security (RLS)

RLS is **mandatory**. All RLS policies should be defined in your SQL migration files.

### 6.1. General Policy Structure
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
WITH CHECK (auth.uid() = user_id_column AND (created_at > (now() - interval '1 day'))); -- Example additional check

-- Policy for DELETE (removing data)
DROP POLICY IF EXISTS "Policy Name Delete" ON public.table_name;
CREATE POLICY "Policy Name Delete"
ON public.table_name
FOR DELETE
USING (auth.uid() = user_id_column);
```

### 6.2. Specific Table Policies
- **`user_favorites` & `user_pantry_items`**: Users can CRUD their own entries. `user_id` column must match `auth.uid()`.
- **`recipes`**:
    - `SELECT`: Allow public read access (`USING (true)`).
    - `INSERT`: Allow any authenticated user (even anonymous) to insert (`WITH CHECK (auth.role() = 'authenticated')`).
    - `UPDATE`/`DELETE`: Generally, disallow direct updates/deletes by users to the global `recipes` table.

### 6.3. Testing RLS
- Use the Supabase Studio SQL Editor (connected to your local instance) to test policies by impersonating roles or specific users:
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

## 7. TypeScript with Supabase

### 7.1. Supabase Type Generation (Recommended)
Use the Supabase CLI to generate TypeScript types directly from your database schema.
1.  Ensure your local schema (after `supabase start` and applying changes) or remote schema (if linked) is up-to-date.
2.  Generate types:
    ```bash
    # For a linked remote project:
    supabase gen types typescript --project-id <your-project-id> --schema public > src/types/supabase.ts

    # For a local Supabase instance (after supabase start):
    supabase gen types typescript --local > src/types/supabase.ts
    ```
    Commit `src/types/supabase.ts` to your repository.

### 7.2. Using Generated Types
The generated `supabase.ts` file will typically export a `Database` interface and helper types like `Tables`, `Enums`, etc.
```typescript
// src/services/supabaseClient.ts
import { Database } from '../types/supabase'; // Path to your generated types
// ...
export const supabase: SupabaseClient<Database> = createClient<Database>(/* ... */);

// In a service file:
import { supabase } from './supabaseClient';
import { Tables, Enums } from '../types/supabase';

type RecipeRow = Tables<'recipes'>['Row'];
type RecipeInsert = Tables<'recipes'>['Insert'];
// type SomeEnumType = Enums<'your_enum_name'>; // If you have enums

async function getRecipeById(id: string): Promise<RecipeRow | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: 0 rows, not necessarily an error for .single()
    console.error('Error fetching recipe by ID:', error);
    throw error;
  }
  return data;
}
```

## 8. Service Layer Integration

Abstract Supabase interactions into dedicated service files.

### 8.1. Auth Service Example
```typescript
// src/services/authService.ts
import { supabase } from './supabaseClient';
import { Session, User, SignUpWithPasswordCredentials, SignInWithPasswordCredentials, Provider } from '@supabase/supabase-js';

export async function getCurrentSession(): Promise<Session | null> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) console.error('Error getting session:', error.message);
  return session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) console.error('Error getting user:', error.message);
  return user;
}

export async function ensureUserSession(): Promise<Session | null> {
    // ... (implementation from section 4.1)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error('Error getting session:', sessionError);
        return null;
    }
    if (session) return session;
    const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
    if (anonError) {
      console.error('Error signing in anonymously:', anonError);
      return null;
    }
    return anonData.session;
}

export async function appSignUp(credentials: SignUpWithPasswordCredentials): Promise<{ user: User | null; error: Error | null }> {
    // ... (implementation from section 4.2)
    const { data, error } = await supabase.auth.signUp(credentials);
    return { user: data.user, error };
}

export async function appSignIn(credentials: SignInWithPasswordCredentials): Promise<{ user: User | null; error: Error | null }> {
    // ... (implementation from section 4.2)
    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    return { user: data.user, error };
}

export async function appSignOut(): Promise<{ error: Error | null }> {
    // ... (implementation from section 4.2)
    const { error } = await supabase.auth.signOut();
    return { error };
}

export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  const { data: authListener } = supabase.auth.onAuthStateChange(callback);
  return authListener.subscription;
}
```

### 8.2. Data Service Example (Recipe Storage)
```typescript
// src/services/recipeStorageService.ts
import { supabase } from './supabaseClient';
import { Tables } from '../types/supabase';

type RecipeRow = Tables<'recipes'>['Row'];
type RecipeInsert = Tables<'recipes'>['Insert'];
type UserFavoriteRow = Tables<'user_favorites'>['Row'];
type UserFavoriteInsert = Tables<'user_favorites'>['Insert'];

export async function fetchRecipeById(recipeId: string): Promise<RecipeRow | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', recipeId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createRecipe(recipeData: RecipeInsert): Promise<RecipeRow | null> {
  const { data, error } = await supabase
    .from('recipes')
    .insert(recipeData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchUserFavorites(userId: string): Promise<Array<UserFavoriteRow & { recipes: RecipeRow | null }>> {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('*, recipes (*)')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

export async function upsertUserFavorite(favoriteData: UserFavoriteInsert): Promise<UserFavoriteRow | null> {
  const { data, error } = await supabase
    .from('user_favorites')
    .upsert(favoriteData, { onConflict: 'user_id, recipe_id' })
    .select('*, recipes (*)') // Optionally fetch related data after upsert
    .single();
  if (error) throw error;
  return data;
}

export async function removeUserFavorite(userId: string, recipeId: string): Promise<void> {
  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('recipe_id', recipeId);
  if (error) throw error;
}
```

## 9. Custom Hooks with Supabase Data

Custom hooks consume services to manage state related to Supabase data.

### 9.1. `useAuth` Hook Example
```typescript
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as authService from '../services/authService';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    authService.getCurrentSession().then(s => {
      setSession(s);
      setUser(s?.user ?? null);
      setIsLoading(false);
    });

    const subscription = authService.onAuthStateChange((_event, sessionState) => {
      setSession(sessionState);
      setUser(sessionState?.user ?? null);
      if (_event !== 'INITIAL_SESSION') setIsLoading(false); // Stop loading after initial check or first event
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user,
    isLoading,
    isAnonymous: user?.is_anonymous ?? (session ? true : false), // Best guess if user object is minimal
    signUp: authService.appSignUp,
    signIn: authService.appSignIn,
    signOut: authService.appSignOut,
    ensureSession: authService.ensureUserSession,
  };
}
```

### 9.2. `useRecipeStorage` Hook Example
```typescript
// src/hooks/useRecipeStorage.ts
import { useState, useEffect, useCallback } from 'react';
import * as recipeStorageService from '../services/recipeStorageService';
import { useAuth } from './useAuth'; // Assuming you have a useAuth hook
import { Tables } from '../types/supabase';

type RecipeRow = Tables<'recipes'>['Row'];
type UserFavoriteRow = Tables<'user_favorites'>['Row'];
type DisplayFavorite = UserFavoriteRow & { recipes: RecipeRow | null };

export function useRecipeStorage() {
  const { user, ensureSession } = useAuth();
  const [favorites, setFavorites] = useState<DisplayFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = useCallback(async (currentUserId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await recipeStorageService.fetchUserFavorites(currentUserId);
      setFavorites(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load favorites');
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadFavorites(user.id);
    } else {
      setFavorites([]); // Clear if no user
    }
  }, [user, loadFavorites]);

  const addOrUpdateFavorite = useCallback(async (recipeId: string, rating?: number) => {
    let currentSession = await ensureSession();
    if (!currentSession?.user.id) {
      setError("User session not found. Please try again.");
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
      // Optimistically update or refetch
      if (updatedFavorite) {
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
        await loadFavorites(userId); // Refetch if upsert didn't return expected data
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
    let currentSession = await ensureSession();
    if (!currentSession?.user.id) {
      setError("User session not found. Please try again.");
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


  return { favorites, isLoading, error, addOrUpdateFavorite, removeFavorite, refreshFavorites: () => user?.id && loadFavorites(user.id) };
}
```

## 10. Error Handling for Supabase Operations

Supabase client methods return an object `{ data, error }`. Always check and handle the `error` object.
```typescript
// In a service method
import { PostgrestError } from '@supabase/supabase-js';

async function fetchDataFromTable(tableName: string) {
  const { data, error } = await supabase.from(tableName).select('*');

  if (error) {
    console.error(`Supabase error fetching from ${tableName}:`, {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    // Example of mapping specific errors
    if (error.code === 'PGRST116') { // Not found for .single()
      // This might not be a "throwable" error depending on context
      console.warn(`No single row found for query on ${tableName}.`);
      return null; // Or an empty array, depending on expected return
    }
    // Throw a custom error or re-throw for higher-level handling
    // Consider creating custom error classes extending Error
    throw new Error(`Failed to fetch data from ${tableName}: ${error.message}`);
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

// Simplified mock structure
export const supabase = {
  auth: {
    getSession: jest.fn(),
    getUser: jest.fn(),
    signInAnonymously: jest.fn(),
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
  },
  from: jest.fn(() => ({ // Chainable methods
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
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(), // Methods that terminate the chain and return a promise
    maybeSingle: jest.fn(),
  })),
  rpc: jest.fn(),
};

// In your test file:
// jest.mock('../services/supabaseClient'); // Auto-mocks using __mocks__ or manual mock
// import { supabase as mockSupabaseClient } from '../services/supabaseClient';

// (mockSupabaseClient.from('tableName').select as jest.Mock).mockResolvedValue({ data: [], error: null });
```
Ensure your mocks cover the chained methods and the final promise resolution (`.single()`, `.select()` resolving directly, etc.).

### 11.2. Testing Migrations
- Use `supabase db reset` locally to ensure all migrations apply cleanly from scratch. This is the primary way to test migration integrity.
- Write tests that verify RLS policies by attempting actions as different users, checking if operations succeed or fail as expected based on policy definitions.

### 11.3. End-to-End Testing
- Run E2E tests (e.g., using Playwright or Cypress) against a dedicated Supabase staging project.
- This staging project's schema should be kept in sync with production via the same CI/CD migration deployment process.
- E2E tests can cover user flows that involve Supabase interactions, like signing up, saving a favorite, and viewing it.

## 12. Environment Management & Keys

- **Local Development:** Use `supabase start` for a fully local environment. The `ANON_KEY` and `URL` provided by `supabase status` are for this local instance.
- **Staging/Production (Cloud):**
    - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`: For frontend client. These are specific to each Supabase cloud project (dev, staging, prod).
    - `SUPABASE_ACCESS_TOKEN`: For CI/CD to authenticate the CLI. Stored as a CI/CD secret.
    - `SUPABASE_DB_PASSWORD`: For CI/CD to link the project and apply migrations. Stored as a CI/CD secret for each environment.
    - `SERVICE_ROLE_KEY`: **Use with extreme caution and only in secure backend environments if absolutely necessary.** Never commit it or expose it to the client. For most applications, direct use of the service role key in application code should be avoided; prefer database functions with defined security (`SECURITY DEFINER`) if elevated privileges are needed for specific operations callable by users.

## 13. Supabase Best Practices Summary (Automation Focus)

1.  **CLI is King for Schema:** All schema changes via version-controlled SQL migration files, managed by the Supabase CLI.
2.  **Automate Migrations via CI/CD:** This is the safest, most reliable way to deploy schema changes to cloud environments.
3.  **Local First Development:** Use `supabase start` and `supabase db diff` for a smooth local dev experience. Test migrations thoroughly locally with `supabase db reset`.
4.  **RLS in Migrations:** Define and test all RLS policies within your migration scripts. Make them idempotent.
5.  **Generated Types:** Keep your codebase type-safe with `supabase gen types typescript --local` or `--project-id`.
6.  **Secure Key Management:** Strictly control access to `SERVICE_ROLE_KEY` and `SUPABASE_ACCESS_TOKEN`. Use `ANON_KEY` for the client.
7.  **Idempotent Scripts:** Write migrations (especially for policies, functions, views) to be safely re-runnable if needed, though the CLI migration system tracks applied migrations.
8.  **Separate Concerns:** Keep application logic (services, hooks, components) separate from infrastructure tasks like schema migration (handled by CLI/CI-CD).
9.  **Abstract Data Logic:** Encapsulate all Supabase client calls within service files. Hooks and components should interact with these services, not directly with the Supabase client.
10. **Thorough Error Handling:** Check the `error` object from every Supabase call and handle it appropriately.

This automation-centric approach will lead to a more robust, maintainable, and scalable backend for your application.
