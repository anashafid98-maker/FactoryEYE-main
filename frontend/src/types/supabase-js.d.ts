// Minimal ambient declaration for @supabase/supabase-js
// Install the real package and types with:
//   npm install @supabase/supabase-js
//   npm install --save-dev @types/supabase__supabase-js

// This stub lets TypeScript compile until proper types are added.

declare module '@supabase/supabase-js' {
  export interface SupabaseClient {
    // add members as needed, e.g.:
    from: (table: string) => any;
    auth: any;
    storage: any;
    channel: (name: string) => any;
    removeChannel: (channel: any) => Promise<any>;
  }
  export function createClient(url: string, key: string): SupabaseClient;
}
