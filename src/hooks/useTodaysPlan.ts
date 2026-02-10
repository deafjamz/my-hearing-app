import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

// --- Types ---

export interface PlanStep {
  activityId: string;
  path: string;
  label: string;
  description: string;
}

interface StoredPlan {
  steps: PlanStep[];
  currentStep: number;
  date: string; // 'yyyy-MM-dd' — auto-expires next day
}

const PLAN_KEY = 'soundsteps_today_plan';

// --- Write helper (called from TodaysPracticeCard) ---

export function startTodaysPlan(steps: PlanStep[], navigate: (path: string) => void) {
  const plan: StoredPlan = {
    steps,
    currentStep: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
  };
  sessionStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  navigate(steps[0].path);
}

// --- Read hook (called from activity pages) ---

export function useTodaysPlan() {
  const navigate = useNavigate();

  const stored = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(PLAN_KEY);
      if (!raw) return null;
      const plan: StoredPlan = JSON.parse(raw);
      // Expire if not today
      if (plan.date !== format(new Date(), 'yyyy-MM-dd')) {
        sessionStorage.removeItem(PLAN_KEY);
        return null;
      }
      return plan;
    } catch {
      return null;
    }
  }, []);

  const isInPlan = stored !== null;
  const isLastStep = stored ? stored.currentStep >= stored.steps.length - 1 : false;

  const nextActivity = useMemo(() => {
    if (!stored || stored.currentStep >= stored.steps.length - 1) return undefined;
    const next = stored.steps[stored.currentStep + 1];
    return {
      label: next.label,
      description: next.description,
      path: next.path,
    };
  }, [stored]);

  const advancePlan = useCallback(() => {
    if (!stored) return;
    const nextStep = stored.currentStep + 1;
    if (nextStep < stored.steps.length) {
      const updated: StoredPlan = { ...stored, currentStep: nextStep };
      sessionStorage.setItem(PLAN_KEY, JSON.stringify(updated));
      navigate(stored.steps[nextStep].path);
    } else {
      // Plan complete — clear and go to practice hub
      sessionStorage.removeItem(PLAN_KEY);
      navigate('/practice');
    }
  }, [stored, navigate]);

  return { isInPlan, nextActivity, advancePlan, isLastStep };
}
