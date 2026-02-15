// Smart Coach: Adaptive Difficulty Algorithm
// Staircase method for SNR adjustment based on user performance

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface EvaluateSessionRequest {
  current_snr: number;
  results: boolean[]; // Last N trials (true = correct, false = incorrect)
}

interface EvaluateSessionResponse {
  next_snr: number;
  action: "increase" | "decrease" | "maintain";
  accuracy: number;
  recommendation: string;
}

/**
 * Smart Coach Staircase Algorithm
 *
 * Clinical Rationale:
 * - 80%+ accuracy: User is ready for harder challenge (decrease SNR by 5dB)
 * - 50% or less: Too difficult, make easier (increase SNR by 5dB)
 * - 51-79%: Keep practicing at current level
 *
 * SNR Bounds:
 * - Minimum: -10 dB (very hard - noise 10dB louder than speech)
 * - Maximum: +20 dB (very easy - speech 20dB louder than noise)
 */
function calculateNextSNR(current_snr: number, results: boolean[]): EvaluateSessionResponse {
  // Calculate accuracy
  const correct_count = results.filter(r => r === true).length;
  const total_count = results.length;
  const accuracy = total_count > 0 ? correct_count / total_count : 0;

  let next_snr = current_snr;
  let action: "increase" | "decrease" | "maintain" = "maintain";
  let recommendation = "";

  // Staircase Logic
  if (accuracy >= 0.8) {
    // User is excelling - make it harder
    next_snr = current_snr - 5;
    action = "decrease";
    recommendation = "Excellent performance! Increasing difficulty.";
  } else if (accuracy <= 0.5) {
    // User is struggling - make it easier
    next_snr = current_snr + 5;
    action = "increase";
    recommendation = "Let's make this a bit easier to build confidence.";
  } else {
    // User is in the sweet spot - maintain difficulty
    next_snr = current_snr;
    action = "maintain";
    recommendation = "Good challenge level. Keep practicing at this difficulty.";
  }

  // Clamp to clinical bounds
  next_snr = Math.max(-10, Math.min(20, next_snr));

  return {
    next_snr,
    action,
    accuracy: Math.round(accuracy * 100) / 100, // Round to 2 decimals
    recommendation
  };
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request
    const { current_snr, results }: EvaluateSessionRequest = await req.json();

    // Validate input
    if (typeof current_snr !== 'number') {
      return new Response(
        JSON.stringify({ error: 'current_snr must be a number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!Array.isArray(results) || results.length === 0) {
      return new Response(
        JSON.stringify({ error: 'results must be a non-empty array of booleans' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate next SNR
    const response = calculateNextSNR(current_snr, results);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
