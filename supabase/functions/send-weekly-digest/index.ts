// Weekly Email Digest - Sends training summaries to opted-in users
// Triggered by pg_cron every Monday at 8:00 AM UTC

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface WeeklyStats {
  totalTrials: number;
  correctTrials: number;
  accuracy: number;
  activeDays: number;
  topActivity: string;
  streak: number;
}

interface UserDigest {
  email: string;
  displayName: string;
  stats: WeeklyStats;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Aggregate last 7 days of training data for a user
 */
async function getUserWeeklyStats(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<WeeklyStats> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const since = sevenDaysAgo.toISOString();

  const { data: rows, error } = await supabase
    .from('user_progress')
    .select('result, content_tags, created_at')
    .eq('user_id', userId)
    .gte('created_at', since);

  if (error || !rows || rows.length === 0) {
    return { totalTrials: 0, correctTrials: 0, accuracy: 0, activeDays: 0, topActivity: 'none', streak: 0 };
  }

  const correctTrials = rows.filter((r: { result: string }) => r.result === 'correct').length;
  const totalTrials = rows.length;
  const accuracy = totalTrials > 0 ? Math.round((correctTrials / totalTrials) * 100) : 0;

  // Count unique active days
  const activeDaySet = new Set<string>();
  const activityCounts = new Map<string, number>();

  for (const row of rows) {
    const date = new Date(row.created_at).toISOString().split('T')[0];
    activeDaySet.add(date);

    const activityType = row.content_tags?.activityType || 'unknown';
    activityCounts.set(activityType, (activityCounts.get(activityType) || 0) + 1);
  }

  // Find top activity
  let topActivity = 'training';
  let maxCount = 0;
  for (const [activity, count] of activityCounts) {
    if (count > maxCount) {
      maxCount = count;
      topActivity = activity;
    }
  }

  // Friendly activity names
  const activityNames: Record<string, string> = {
    category_practice: 'Word Pairs',
    phoneme_drill: 'Phoneme Drills',
    conversation: 'Conversations',
    environmental_sound: 'Sound Awareness',
    sentence_training: 'Sentences',
    story: 'Stories',
    scenario: 'Scenarios',
    detection: 'Sound Detection',
    gross_discrimination: 'Word Basics',
    rapid_fire: 'Rapid Fire',
  };
  topActivity = activityNames[topActivity] || topActivity;

  // Calculate streak (working backward from today)
  let streak = 0;
  const today = new Date();
  const checkDate = new Date(today);
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (activeDaySet.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    totalTrials,
    correctTrials,
    accuracy,
    activeDays: activeDaySet.size,
    topActivity,
    streak,
  };
}

/**
 * Generate HTML email content
 * Uses inline CSS for email client compatibility
 * Language follows regulatory guidelines (training, not medical)
 */
function generateEmailHtml(digest: UserDigest): string {
  const { stats, displayName } = digest;
  const firstName = displayName.split(' ')[0] || 'there';

  const motivational = stats.accuracy >= 80
    ? "You're making excellent progress! Keep up the great work."
    : stats.accuracy >= 60
    ? "Good effort this week! Consistency is key to improvement."
    : stats.activeDays > 0
    ? "Every practice session counts. You're building great habits!"
    : "We missed you this week! Even 5 minutes of practice can make a difference.";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#0f172a;font-size:24px;margin:0 0 8px 0;">SoundSteps</h1>
      <p style="color:#64748b;font-size:14px;margin:0;">Your Weekly Training Summary</p>
    </div>

    <!-- Greeting -->
    <div style="background-color:#ffffff;border-radius:16px;padding:24px;margin-bottom:16px;border:1px solid #e2e8f0;">
      <p style="color:#334155;font-size:16px;margin:0 0 8px 0;">Hi ${firstName},</p>
      <p style="color:#64748b;font-size:14px;margin:0;">${motivational}</p>
    </div>

    <!-- Stats Card -->
    <div style="background-color:#ffffff;border-radius:16px;padding:24px;margin-bottom:16px;border:1px solid #e2e8f0;">
      <h2 style="color:#0f172a;font-size:18px;margin:0 0 16px 0;">This Week's Highlights</h2>

      <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
        <div style="text-align:center;flex:1;">
          <p style="color:#0d9488;font-size:28px;font-weight:bold;margin:0;">${stats.totalTrials}</p>
          <p style="color:#94a3b8;font-size:12px;margin:4px 0 0 0;">Total Exercises</p>
        </div>
        <div style="text-align:center;flex:1;">
          <p style="color:#0d9488;font-size:28px;font-weight:bold;margin:0;">${stats.accuracy}%</p>
          <p style="color:#94a3b8;font-size:12px;margin:4px 0 0 0;">Accuracy</p>
        </div>
        <div style="text-align:center;flex:1;">
          <p style="color:#0d9488;font-size:28px;font-weight:bold;margin:0;">${stats.activeDays}</p>
          <p style="color:#94a3b8;font-size:12px;margin:4px 0 0 0;">Active Days</p>
        </div>
      </div>

      ${stats.streak > 0 ? `
      <div style="background-color:#f0fdfa;border-radius:8px;padding:12px;text-align:center;margin-top:12px;">
        <p style="color:#0d9488;font-size:14px;font-weight:bold;margin:0;">
          🔥 ${stats.streak}-day streak!
        </p>
      </div>` : ''}

      ${stats.topActivity !== 'none' ? `
      <p style="color:#64748b;font-size:13px;margin:12px 0 0 0;">
        Most practiced: <strong style="color:#334155;">${stats.topActivity}</strong>
      </p>` : ''}
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin:24px 0;">
      <a href="https://soundsteps.app/practice" style="display:inline-block;background-color:#0d9488;color:#ffffff;font-size:16px;font-weight:bold;padding:14px 32px;border-radius:12px;text-decoration:none;">
        Continue Training
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding-top:24px;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:11px;margin:0 0 8px 0;">
        SoundSteps is designed for hearing training and practice. It is not intended to diagnose, treat, cure, or prevent any medical condition.
      </p>
      <p style="color:#94a3b8;font-size:11px;margin:0;">
        <a href="https://soundsteps.app/settings" style="color:#64748b;">Unsubscribe</a> from weekly summaries
      </p>
    </div>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all users who opted in to weekly digest
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email_weekly_digest')
      .eq('email_weekly_digest', true);

    if (usersError) {
      throw new Error(`Failed to fetch opted-in users: ${usersError.message}`);
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users opted in for weekly digest', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        // Get user's auth record for email
        const { data: authData } = await supabase.auth.admin.getUserById(user.id);
        if (!authData?.user?.email) continue;

        const stats = await getUserWeeklyStats(supabase, user.id);

        // Skip users with zero activity (no point sending empty digest)
        if (stats.totalTrials === 0 && stats.activeDays === 0) continue;

        const digest: UserDigest = {
          email: authData.user.email,
          displayName: authData.user.user_metadata?.full_name || authData.user.email.split('@')[0],
          stats,
        };

        const html = generateEmailHtml(digest);

        // Send via Resend API
        if (resendApiKey) {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'SoundSteps <noreply@soundsteps.app>',
              to: [digest.email],
              subject: `Your SoundSteps Week: ${stats.accuracy}% accuracy, ${stats.activeDays} active days`,
              html,
            }),
          });

          if (emailResponse.ok) {
            sent++;
          } else {
            const errText = await emailResponse.text();
            failed++;
            errors.push(`${digest.email}: ${errText}`);
          }
        } else {
          // No Resend key — log only (development mode)
          console.log(`[DEV] Would send digest to ${digest.email}: ${stats.totalTrials} trials, ${stats.accuracy}% accuracy`);
          sent++;
        }
      } catch (e) {
        failed++;
        errors.push(`${user.id}: ${e.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Weekly digest complete`,
        sent,
        failed,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
