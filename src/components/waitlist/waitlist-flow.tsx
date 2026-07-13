'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { StepEmail } from './step-email';
import { StepRole } from './step-role';
import { StepPreferences, type PreferencesData } from './step-preferences';
import { StepPhone } from './step-phone';
import { StepSuccess } from './step-success';
import { ResumePrompt } from './resume-prompt';
import { ProgressIndicator } from './progress-indicator';
import type { SubmitEmailData } from '@/lib/actions/submit-email';
import { getLeadForResume } from '@/lib/actions/resume-lead';
import { saveResume, loadResume, clearResume } from '@/lib/utils/resume-storage';
import type { Role } from '@/types/waitlist';

/**
 * Client orchestrator for the progressive waitlist flow (plan §3, §4, §12).
 *
 * Holds the step state machine and lead context (leadId + resume token). Each step persists
 * before advancing — there is no terminal "Submit" gate. On mount, a valid resume token
 * shows the resume prompt (masked email, explicit Continue / Start over).
 */
export interface FlowData {
  leadId: string | null;
  resumeToken: string | null;
  role: Role | null;
  jobCategories: string[];
  workFormats: string[];
  talentCategories: string[];
  organisationTypes: string[];
  phoneProvided: boolean;
}

const initialData: FlowData = {
  leadId: null,
  resumeToken: null,
  role: null,
  jobCategories: [],
  workFormats: [],
  talentCategories: [],
  organisationTypes: [],
  phoneProvided: false,
};

export function WaitlistFlow() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FlowData>(initialData);
  const [resumeEmailMasked, setResumeEmailMasked] = useState<string | null>(null);
  const [resumeNextStep, setResumeNextStep] = useState(1);

  // On mount, check for a resumable session (plan §12).
  useEffect(() => {
    const record = loadResume();
    if (!record) return;
    let cancelled = false;
    void getLeadForResume({
      leadId: record.leadId,
      resumeToken: record.resumeToken,
    }).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        clearResume();
        return;
      }
      const state = result.data;
      setData((prev) => ({
        ...prev,
        leadId: record.leadId,
        resumeToken: record.resumeToken,
        role: state.role,
        jobCategories: state.jobCategories,
        workFormats: state.workFormats,
        talentCategories: state.talentCategories,
        organisationTypes: state.organisationTypes,
        phoneProvided: state.hasPhone,
      }));
      setResumeEmailMasked(state.emailMasked);
      // Phone/consent are never prefilled; if completed, go straight to success.
      setResumeNextStep(
        state.lastCompletedStep >= 4 ? 5 : state.lastCompletedStep + 1,
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleEmailComplete(result: SubmitEmailData) {
    setData((prev) => ({
      ...prev,
      leadId: result.leadId,
      resumeToken: result.resumeToken,
    }));
    saveResume({ leadId: result.leadId, resumeToken: result.resumeToken });
    setStep(2);
  }

  function handleRoleComplete(role: Role) {
    setData((prev) => ({ ...prev, role }));
    setStep(3);
  }

  function handlePreferencesChange(partial: Partial<PreferencesData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  function handlePreferencesComplete() {
    setStep(4);
  }

  function handlePhoneComplete(phoneProvided: boolean) {
    setData((prev) => ({ ...prev, phoneProvided }));
    setStep(5);
  }

  function handleResumeContinue() {
    setResumeEmailMasked(null);
    setStep(resumeNextStep);
  }

  function handleStartOver() {
    clearResume();
    setResumeEmailMasked(null);
    setData(initialData);
    setStep(1);
  }

  const transitionKey = resumeEmailMasked ? 'resume' : `step-${step}`;

  function renderContent() {
    if (resumeEmailMasked) {
      return (
        <ResumePrompt
          emailMasked={resumeEmailMasked}
          onContinue={handleResumeContinue}
          onStartOver={handleStartOver}
        />
      );
    }
    if (step === 1) return <StepEmail onComplete={handleEmailComplete} />;
    if (step === 2 && data.leadId && data.resumeToken) {
      return (
        <StepRole
          leadId={data.leadId}
          resumeToken={data.resumeToken}
          currentRole={data.role}
          onComplete={handleRoleComplete}
        />
      );
    }
    if (step === 3 && data.leadId && data.resumeToken && data.role) {
      return (
        <StepPreferences
          leadId={data.leadId}
          resumeToken={data.resumeToken}
          role={data.role}
          data={{
            jobCategories: data.jobCategories,
            workFormats: data.workFormats,
            talentCategories: data.talentCategories,
            organisationTypes: data.organisationTypes,
          }}
          onChange={handlePreferencesChange}
          onComplete={handlePreferencesComplete}
        />
      );
    }
    if (step === 4 && data.leadId && data.resumeToken) {
      return (
        <StepPhone
          leadId={data.leadId}
          resumeToken={data.resumeToken}
          onComplete={handlePhoneComplete}
        />
      );
    }
    if (step === 5) return <StepSuccess role={data.role} />;
    return null;
  }

  const showProgress = !resumeEmailMasked && step <= 4;

  return (
    <div className="w-full rounded-2xl border border-[color:var(--color-line)] bg-surface/60 p-5 backdrop-blur-sm sm:p-6">
      {showProgress && <ProgressIndicator step={step} />}
      <motion.div layout={!reduce} style={{ overflow: 'hidden' }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={transitionKey}
            initial={{ opacity: 0, y: reduce ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -8 }}
            transition={{ duration: reduce ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
