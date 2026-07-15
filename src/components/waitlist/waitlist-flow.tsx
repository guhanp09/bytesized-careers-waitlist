'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { StepEmail } from './step-email';
import { StepRole } from './step-role';
import { StepPreferences, type PreferencesData } from './step-preferences';
import { StepContext, type ContextData } from './step-context';
import { StepPhone } from './step-phone';
import { StepVerify } from './step-verify';
import { StepNote } from './step-note';
import { StepSuccess } from './step-success';
import { ResumePrompt } from './resume-prompt';
import { ProgressIndicator } from './progress-indicator';
import { useAmbient } from './ambient-context';
import type { SubmitEmailData } from '@/lib/actions/submit-email';
import { getLeadForResume } from '@/lib/actions/resume-lead';
import { requestEmailCode, submitEmailCode } from '@/lib/actions/verify-email';
import { requestPhoneCode, submitPhoneCode } from '@/lib/actions/verify-phone';
import { saveResume, loadResume, clearResume } from '@/lib/utils/resume-storage';
import type { Role } from '@/types/waitlist';

/**
 * Client orchestrator (v2). Save-first funnel with deferred, non-blocking verification:
 * 1 email → 2 role → 3 interests → 4 email verify → 5 context → 6 phone → 7 phone verify
 * → 8 note → 9 success.
 */
const TOTAL_STEPS = 9;

interface FlowData
  extends PreferencesData,
    ContextData {
  leadId: string | null;
  resumeToken: string | null;
  fullName: string;
  role: Role | null;
  phoneProvided: boolean;
  emailMasked: string | null;
  additionalNotes: string;
}

const initialData: FlowData = {
  leadId: null,
  resumeToken: null,
  fullName: '',
  role: null,
  jobCategories: [],
  workFormats: [],
  talentCategories: [],
  organisationTypes: [],
  jobCategoryOthers: {},
  talentCategoryOthers: {},
  platforms: [],
  niches: [],
  platformOther: '',
  nicheOther: '',
  experienceLevel: null,
  availabilityToStart: null,
  portfolioUrl: '',
  hiringTimeline: null,
  teamSize: null,
  companyUrl: '',
  additionalNotes: '',
  phoneProvided: false,
  emailMasked: null,
};

function resumeStepFrom(
  lastCompletedStep: number,
  emailVerified: boolean,
  hasPhone: boolean,
  phoneVerified: boolean,
): number {
  if (lastCompletedStep <= 1) return 2;
  if (lastCompletedStep === 2) return 3;
  if (lastCompletedStep === 3) return emailVerified ? 5 : 4;
  if (lastCompletedStep === 4) return 5;
  if (lastCompletedStep === 5) return 6;
  if (lastCompletedStep === 6) return hasPhone && !phoneVerified ? 7 : 8;
  if (lastCompletedStep === 7) return 8;
  if (lastCompletedStep >= 8) return 9;
  return 2;
}

export function WaitlistFlow() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FlowData>(initialData);
  const [resumeEmailMasked, setResumeEmailMasked] = useState<string | null>(null);
  const [resumeNextStep, setResumeNextStep] = useState(1);
  const [changingEmail, setChangingEmail] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigationVersionRef = useRef(0);
  const positionedVersionRef = useRef(0);
  const settleRafRef = useRef(0);
  const currentStepRef = useRef(step);

  useEffect(() => {
    currentStepRef.current = step;
  }, [step]);

  const navigate = useCallback((nextStep: number) => {
    navigationVersionRef.current += 1;
    setStep(nextStep);
  }, []);

  // Feed funnel state to the ambient background (setters are stable).
  const ambient = useAmbient();
  const setAmbientProgress = ambient?.setProgress;
  const setAmbientRole = ambient?.setRole;
  useEffect(() => {
    setAmbientProgress?.(Math.min((step - 1) / (TOTAL_STEPS - 1), 1));
  }, [step, setAmbientProgress]);
  useEffect(() => {
    setAmbientRole?.(data.role);
  }, [data.role, setAmbientRole]);

  useEffect(() => {
    const record = loadResume();
    if (!record) return;
    let cancelled = false;
    void getLeadForResume({ leadId: record.leadId, resumeToken: record.resumeToken }).then(
      (result) => {
        if (cancelled) return;
        if (!result.ok) {
          clearResume();
          return;
        }
        const s = result.data;
        setData((prev) => ({
          ...prev,
          leadId: record.leadId,
          resumeToken: record.resumeToken,
          fullName: s.fullName ?? '',
          role: s.role,
          jobCategories: s.jobCategories,
          workFormats: s.workFormats,
          talentCategories: s.talentCategories,
          organisationTypes: s.organisationTypes,
          jobCategoryOthers: s.jobCategoryOthers,
          talentCategoryOthers: s.talentCategoryOthers,
          platforms: s.platforms,
          niches: s.niches,
          platformOther: s.platformOther,
          nicheOther: s.nicheOther,
          experienceLevel: s.experienceLevel,
          availabilityToStart: s.availabilityToStart,
          portfolioUrl: s.portfolioUrl,
          hiringTimeline: s.hiringTimeline,
          teamSize: s.teamSize,
          companyUrl: s.companyUrl,
          additionalNotes: s.additionalNotes,
          phoneProvided: s.hasPhone,
          emailMasked: s.emailMasked,
        }));
        setResumeEmailMasked(s.emailMasked);
        setResumeNextStep(
          resumeStepFrom(
            s.lastCompletedStep,
            s.emailVerified,
            s.hasPhone,
            s.phoneVerified,
          ),
        );
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const merge = (partial: Partial<FlowData>) => setData((prev) => ({ ...prev, ...partial }));

  function handleEmailComplete(result: SubmitEmailData) {
    merge({
      leadId: result.leadId,
      resumeToken: result.resumeToken,
      fullName: result.fullName ?? '',
      emailMasked: result.emailMasked,
    });
    saveResume({ leadId: result.leadId, resumeToken: result.resumeToken });
    navigate(2);
  }

  const ctx = data.leadId && data.resumeToken ? { leadId: data.leadId, resumeToken: data.resumeToken } : null;

  function renderContent() {
    if (resumeEmailMasked) {
      return (
        <ResumePrompt
          emailMasked={resumeEmailMasked}
          onContinue={() => {
            setResumeEmailMasked(null);
            navigate(resumeNextStep);
          }}
          onStartOver={() => {
            clearResume();
            setResumeEmailMasked(null);
            setData(initialData);
            navigate(1);
          }}
        />
      );
    }
    if (changingEmail && ctx) {
      return (
        <StepEmail
          changeSession={ctx}
          initialFullName={data.fullName}
          onComplete={(result) => {
            merge({ fullName: result.fullName ?? data.fullName, emailMasked: result.emailMasked });
            saveResume({ leadId: result.leadId, resumeToken: result.resumeToken });
            navigationVersionRef.current += 1;
            setChangingEmail(false);
          }}
        />
      );
    }
    if (step === 1) {
      return <StepEmail initialFullName={data.fullName} onComplete={handleEmailComplete} />;
    }
    if (!ctx) return null;

    if (step === 2) {
      return (
        <StepRole
          {...ctx}
          currentRole={data.role}
          onComplete={(role) => {
            merge({ role });
            navigate(3);
          }}
        />
      );
    }
    if (step === 3 && data.role) {
      return (
        <StepPreferences
          {...ctx}
          role={data.role}
          data={data}
          onChange={merge}
          onComplete={() => navigate(4)}
        />
      );
    }
    if (step === 4) {
      return (
        <StepVerify
          {...ctx}
          channel="email"
          title="Confirm your email"
          benefit="Confirm your email so we can reliably send opportunities matching your interests."
          targetLabel={data.emailMasked ?? 'your email'}
          requestCode={requestEmailCode}
          submitCode={submitEmailCode}
          onVerified={() => navigate(5)}
          onSkip={() => navigate(5)}
          onChangeContact={() => {
            navigationVersionRef.current += 1;
            setChangingEmail(true);
          }}
          changeLabel="Change email"
        />
      );
    }
    if (step === 5 && data.role) {
      return (
        <StepContext
          {...ctx}
          role={data.role}
          data={data}
          onChange={merge}
          onComplete={() => navigate(6)}
        />
      );
    }
    if (step === 6) {
      return (
        <StepPhone
          {...ctx}
          onComplete={(phoneProvided) => {
            merge({ phoneProvided });
            navigate(phoneProvided ? 7 : 8);
          }}
        />
      );
    }
    if (step === 7) {
      return (
        <StepVerify
          {...ctx}
          channel="phone"
          title="Verify your number"
          benefit="Verify your number to get priority alerts the moment matching work appears."
          targetLabel="your number"
          requestCode={requestPhoneCode}
          submitCode={submitPhoneCode}
          onVerified={() => navigate(8)}
          onSkip={() => navigate(8)}
          onChangeContact={() => navigate(6)}
          changeLabel="Change number"
        />
      );
    }
    if (step === 8) {
      return (
        <StepNote
          {...ctx}
          role={data.role}
          value={data.additionalNotes}
          onChange={(additionalNotes) => merge({ additionalNotes })}
          onComplete={() => navigate(9)}
        />
      );
    }
    if (step === 9) return <StepSuccess role={data.role} />;
    return null;
  }

  const showProgress = !resumeEmailMasked && step >= 1 && step <= 8;
  const transitionKey = resumeEmailMasked
    ? 'resume'
    : changingEmail
      ? 'change-email'
      : `step-${step}`;

  const previousStep =
    step === 8 && !data.phoneProvided ? 6 : step > 1 && step <= 8 ? step - 1 : null;
  const showBack = !resumeEmailMasked && (changingEmail || previousStep !== null);

  const handleBack = () => {
    if (changingEmail) {
      navigationVersionRef.current += 1;
      setChangingEmail(false);
      return;
    }
    if (previousStep !== null) navigate(previousStep);
  };

  const positionActiveStep = useCallback(() => {
    const version = navigationVersionRef.current;
    if (version === positionedVersionRef.current) return;
    cancelAnimationFrame(settleRafRef.current);

    let lastHeight = -1;
    let stableFrames = 0;
    let frames = 0;
    const settle = () => {
      const card = cardRef.current;
      const panel = panelRef.current;
      if (!card || !panel) return;
      const height = card.getBoundingClientRect().height;
      stableFrames = Math.abs(height - lastHeight) < 0.75 ? stableFrames + 1 : 0;
      lastHeight = height;
      frames += 1;
      if (stableFrames < 2 && frames < 30) {
        settleRafRef.current = requestAnimationFrame(settle);
        return;
      }

      positionedVersionRef.current = version;
      const heading = panel.querySelector<HTMLElement>('[data-step-heading]');
      heading?.focus({ preventScroll: true });
      const headingText = heading?.textContent?.trim();
      if (headingText) {
        const currentStep = currentStepRef.current;
        setAnnouncement(
          currentStep <= 8
            ? `Step ${currentStep} of ${TOTAL_STEPS - 1}: ${headingText}`
            : headingText,
        );
      }

      const viewport = window.visualViewport;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const viewportOffset = viewport?.offsetTop ?? 0;
      const topGap = window.innerWidth < 640 ? 16 : 28;
      const bottomGap = window.innerWidth < 640 ? 18 : 28;
      const rect = card.getBoundingClientRect();
      const visibleTop = viewportOffset + topGap;
      const visibleBottom = viewportOffset + viewportHeight - bottomGap;
      const fullyVisible = rect.top >= visibleTop && rect.bottom <= visibleBottom;
      if (fullyVisible) return;

      const fits = rect.height <= viewportHeight - topGap - bottomGap;
      const spare = Math.max(0, viewportHeight - topGap - bottomGap - rect.height);
      const targetTop = visibleTop + (fits ? Math.min(36, spare * 0.18) : 0);
      const targetY = Math.max(0, window.scrollY + rect.top - targetTop);
      window.scrollTo({ top: targetY, behavior: reduce ? 'auto' : 'smooth' });
    };
    settleRafRef.current = requestAnimationFrame(settle);
  }, [reduce]);

  useEffect(
    () => () => {
      cancelAnimationFrame(settleRafRef.current);
    },
    [],
  );

  return (
    <div
      ref={cardRef}
      className="w-full scroll-mt-4 rounded-2xl border border-[color:var(--color-line-strong)] bg-surface/85 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_20px_60px_-20px_rgba(0,0,0,0.7)] ring-1 ring-black/20 backdrop-blur-md sm:scroll-mt-7 sm:p-6"
    >
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      {showBack ? (
        <button
          type="button"
          onClick={handleBack}
          className="mb-3 inline-flex min-h-8 items-center gap-1 text-sm text-faint transition-colors hover:text-muted"
        >
          <span aria-hidden="true">←</span> Back
        </button>
      ) : null}
      {showProgress && <ProgressIndicator step={step} total={TOTAL_STEPS} />}
      <motion.div layout={!reduce} style={{ overflow: 'hidden' }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            ref={panelRef}
            key={transitionKey}
            initial={{ opacity: 0, y: reduce ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -8 }}
            transition={{ duration: reduce ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
            onAnimationComplete={positionActiveStep}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
