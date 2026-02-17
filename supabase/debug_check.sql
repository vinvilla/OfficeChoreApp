-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if trigger exists
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public' OR event_object_schema = 'auth';

-- Check if function exists
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'handle_new_user';
