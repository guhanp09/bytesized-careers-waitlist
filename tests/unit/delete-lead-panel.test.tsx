import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { actionError, actionOk } from '@/types/waitlist';

const deleteLeadAction = vi.fn();
vi.mock('@/lib/actions/delete-lead', () => ({
  deleteLeadAction: (input: { leadId: string }) => deleteLeadAction(input),
}));

const { DeleteLeadPanel } = await import('@/app/admin/waitlist/delete-lead-panel');

const props = {
  leadId: '4f5bd47b-8647-4c35-b340-30c155d8974f',
  email: 'test.signup@example.com',
  onDeleted: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DeleteLeadPanel — destructive action is gated', () => {
  it('never deletes on the first click; it only asks for confirmation', async () => {
    const user = userEvent.setup();
    render(<DeleteLeadPanel {...props} onDeleted={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /delete registration/i }));

    expect(deleteLeadAction).not.toHaveBeenCalled();
    // The confirmation repeats the address so the operator can verify the target.
    expect(screen.getByText(props.email)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /yes, delete permanently/i }),
    ).toBeInTheDocument();
  });

  it('deletes only after the explicit confirmation, then reports upward', async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    deleteLeadAction.mockResolvedValue(actionOk({ leadId: props.leadId }));
    render(<DeleteLeadPanel {...props} onDeleted={onDeleted} />);

    await user.click(screen.getByRole('button', { name: /delete registration/i }));
    await user.click(screen.getByRole('button', { name: /yes, delete permanently/i }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    expect(deleteLeadAction).toHaveBeenCalledWith({ leadId: props.leadId });
  });

  it('backing out cancels without deleting anything', async () => {
    const user = userEvent.setup();
    render(<DeleteLeadPanel {...props} onDeleted={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /delete registration/i }));
    await user.click(screen.getByRole('button', { name: /keep it/i }));

    expect(deleteLeadAction).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('button', { name: /yes, delete permanently/i }),
    ).not.toBeInTheDocument();
  });

  it('surfaces a server refusal instead of pretending the record is gone', async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    deleteLeadAction.mockResolvedValue(
      actionError('invalid_token', 'You are not signed in as an administrator.'),
    );
    render(<DeleteLeadPanel {...props} onDeleted={onDeleted} />);

    await user.click(screen.getByRole('button', { name: /delete registration/i }));
    await user.click(screen.getByRole('button', { name: /yes, delete permanently/i }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/not signed in as an administrator/i),
    );
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it('warns that the removal is permanent before it happens', () => {
    render(<DeleteLeadPanel {...props} onDeleted={vi.fn()} />);
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });
});
