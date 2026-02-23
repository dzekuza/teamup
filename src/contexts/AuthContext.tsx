// Legacy AuthContext — re-exports from SupabaseAuthContext for backward compatibility.
// All Firebase auth code has been removed. Components importing from this path
// now transparently use Supabase auth.
// TODO: Update remaining importers to use SupabaseAuthContext directly, then delete this file.
export { SupabaseAuthProvider as AuthProvider, useAuth } from './SupabaseAuthContext';
