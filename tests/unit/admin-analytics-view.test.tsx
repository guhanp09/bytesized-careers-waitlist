import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FunnelChart, SignupTrend, VerificationTable } from '@/app/admin/waitlist/analytics-visuals';

describe('accessible analytics views', () => {
  it('provides a labelled trend, legend, tooltips, and tabular alternative', () => {
    render(<SignupTrend period="7" rows={[
      { date: '2026-07-14', total: 2, completed: 1, verified: 1 },
      { date: '2026-07-15', total: 3, completed: 2, verified: 1 },
    ]} />);
    expect(screen.getByRole('img', { name: /grouped by Indian Standard Time/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Chart legend')).toHaveTextContent('All signups');
    expect(screen.getByText('View accessible data table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Date (IST)' })).toBeInTheDocument();
  });

  it('keeps completion and verification as separately labelled concepts', () => {
    render(<>
      <FunnelChart rows={[
        { key: 'email_captured', label: 'Email captured', count: 10, percentage: 100 },
        { key: 'completed', label: 'Profile completed', count: 6, percentage: 60 },
        { key: 'email_verified', label: 'Email verified', count: 4, percentage: 40, note: 'Independent of completion' },
      ]} />
      <VerificationTable rows={[{ key: 'email_verified', label: 'Verified email', count: 4, percentage: 40 }]} />
    </>);
    expect(screen.getByText('Profile completed')).toBeInTheDocument();
    expect(screen.getByText('Email verified')).toBeInTheDocument();
    expect(screen.getByText('(Independent of completion)')).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Verified email' })).toBeInTheDocument();
  });

  it('renders a calm zero-data funnel state', () => {
    render(<FunnelChart rows={[{ key: 'email_captured', label: 'Email captured', count: 0, percentage: 0 }]} />);
    expect(screen.getByText('No funnel activity yet.')).toBeInTheDocument();
  });
});
