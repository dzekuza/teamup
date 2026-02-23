// Legacy useAuth hook — re-exports from SupabaseAuthContext for backward compatibility.
// All Firebase auth code has been removed.
// TODO: Update remaining importers to use SupabaseAuthContext directly, then delete this file.
export { useAuth } from '../contexts/SupabaseAuthContext';
