# Milestones

## v1.0 Mobile UI + Supabase Migration (Shipped: 2026-02-23)

**Phases completed:** 3 phases, 8 plans, 0 tasks

**Key accomplishments:**
- SupabaseAuthProvider wired at app root — Login, Register, password reset, and Google OAuth all use Supabase auth
- Plaintext password cookie security bug eliminated; Facebook OAuth removed from Login and Register
- Profile, SavedEvents, Locations, SingleLocation pages migrated from Firestore to Supabase queries
- Legacy AuthContext.tsx and useAuth.ts replaced with Supabase re-export shims using CompatUser for backward compatibility
- Mobile UI primitives built: AppTextInput, AppButton (haptics + Reanimated 4 animations), custom BottomSheet
- Global keyboard handling configured via react-native-keyboard-controller at app root

---

