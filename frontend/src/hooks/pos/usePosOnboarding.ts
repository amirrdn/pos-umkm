import { useState, useEffect, useCallback } from 'react';
import { POS_ONBOARDING_KEY } from '../../utils/posRecentProducts';

export function usePosOnboarding() {
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  useEffect(() => {
    try {
      const completed = localStorage.getItem(POS_ONBOARDING_KEY);
      if (!completed) {
        Promise.resolve().then(() => {
          setShowOnboarding(true);
        });
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const completeOnboarding = useCallback(() => {
    try {
      localStorage.setItem(POS_ONBOARDING_KEY, 'true');
    } catch {
      // ignore
    }
    setShowOnboarding(false);
  }, []);

  const advanceOnboarding = useCallback(() => {
    if (onboardingStep >= 2) {
      completeOnboarding();
      return;
    }
    setOnboardingStep((prev) => prev + 1);
  }, [onboardingStep, completeOnboarding]);

  return {
    onboardingStep,
    showOnboarding,
    setOnboardingStep,
    setShowOnboarding,
    completeOnboarding,
    advanceOnboarding,
  };
}
