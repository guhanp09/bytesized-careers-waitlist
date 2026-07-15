import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StepVerify } from '@/components/waitlist/step-verify';
import { actionError, actionOk } from '@/types/waitlist';
import type { RequestCodeData } from '@/lib/actions/verify-shared';

const baseProps = {
  leadId: '4f5bd47b-8647-4c35-b340-30c155d8974f',
  resumeToken: 'resume-token',
  channel: 'email' as const,
  title: 'Confirm your email',
  benefit: 'Confirm your address.',
  targetLabel: 'g***@example.com',
  submitCode: vi.fn(async () => ({ ok: false as const, reason: 'invalid_code' as const, message: 'No match' })),
  onVerified: vi.fn(),
  onSkip: vi.fn(),
  onChangeContact: vi.fn(),
  changeLabel: 'Change email',
};

describe('StepVerify delivery truthfulness', () => {
  it('does not say a code was sent before provider acceptance', async () => {
    let resolveRequest!: (value: ReturnType<typeof actionOk<RequestCodeData>>) => void;
    const requestCode = vi.fn(
      () =>
        new Promise<ReturnType<typeof actionOk<RequestCodeData>>>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    render(<StepVerify {...baseProps} requestCode={requestCode} />);

    expect(await screen.findByText(/Sending a code to/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Code sent to/i)).not.toBeInTheDocument();

    resolveRequest(
      actionOk({
        available: true,
        channel: 'email',
        cooldownMs: 0,
        expiresInMs: 600_000,
        target: 'g***@example.com',
        deliveryStatus: 'accepted',
      }),
    );
    expect(await screen.findByText(/^Code sent to/i)).toBeInTheDocument();
  });

  it('shows a retry path and keeps continue available after provider failure', async () => {
    const requestCode = vi.fn(async () =>
      actionError<RequestCodeData>(
        'delivery_failed',
        'We couldn’t send a code just now. Your waitlist place is safe.',
      ),
    );
    render(<StepVerify {...baseProps} requestCode={requestCode} />);

    expect(await screen.findByText(/The code (?:wasn't|wasn’t) sent/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry send/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Continue for now/i })).toBeEnabled();
    expect(screen.queryByText(/^Code sent to/i)).not.toBeInTheDocument();
  });

  it('accepts pasted digits and submits automatically at six digits', async () => {
    const submitCode = vi.fn(async () => ({
      ok: false as const,
      reason: 'invalid_code' as const,
      message: 'No match',
    }));
    const requestCode = vi.fn(async () =>
      actionOk<RequestCodeData>({
        available: true,
        channel: 'email',
        cooldownMs: 0,
        expiresInMs: 600_000,
        target: 'g***@example.com',
        deliveryStatus: 'accepted',
      }),
    );
    const user = userEvent.setup();
    render(<StepVerify {...baseProps} requestCode={requestCode} submitCode={submitCode} />);
    const input = await screen.findByLabelText(/Enter the 6-digit code/i);
    await waitFor(() => expect(input).toBeEnabled());
    await user.click(input);
    await user.paste('12 34-56');
    await waitFor(() =>
      expect(submitCode).toHaveBeenCalledWith({
        leadId: baseProps.leadId,
        resumeToken: baseProps.resumeToken,
        code: '123456',
      }),
    );
  });
});
