-- Schedule weekly digest email via pg_cron
-- Runs every Monday at 8:00 AM UTC
-- Requires pg_cron extension to be enabled in Supabase dashboard

-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the edge function invocation
SELECT cron.schedule(
  'weekly-email-digest',
  '0 8 * * 1',  -- Every Monday at 8:00 AM UTC
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-weekly-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
