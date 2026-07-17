import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CookiesPage from '@/app/early-access/cookies/page';
import PrivacyPage from '@/app/early-access/privacy/page';
import TermsPage from '@/app/early-access/terms/page';
import { StepEmail } from '@/components/waitlist/step-email';

describe('legal pages', () => {
  it('renders the tailored privacy notice with the confirmed operator and contact', () => {
    render(<PrivacyPage />);

    expect(
      screen.getByRole('heading', { name: 'Early Access Privacy Notice', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Guhan Purushothaman/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'legal@bytesizedcareers.com' }).length).toBeGreaterThan(0);
    expect(screen.getByText(/intended only for people aged 18 or older/i)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Early Access Storage Notice' })[0]).toHaveAttribute(
      'href',
      '/early-access/cookies',
    );
    expect(screen.getByText(/does not sell personal information/i)).toBeInTheDocument();
  });

  it('renders pre-launch terms without describing an operating marketplace', () => {
    render(<TermsPage />);

    expect(
      screen.getByRole('heading', { name: 'Early Access Terms of Use', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/does not create a marketplace account/i)).toBeInTheDocument();
    expect(screen.getByText(/governed by the laws of India/i)).toBeInTheDocument();
    expect(screen.getByText(/competent courts in Chennai/i)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Early Access Privacy Notice' })[0]).toHaveAttribute(
      'href',
      '/early-access/privacy',
    );
  });

  it('describes first-party storage and the no-banner conclusion', () => {
    render(<CookiesPage />);

    expect(screen.getByRole('heading', { name: 'Early Access Storage Notice', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('bytesized_waitlist_resume (localStorage)')).toBeInTheDocument();
    expect(screen.getByText('bytesized_waitlist_attribution (localStorage)')).toBeInTheDocument();
    expect(screen.getByText(/does not need a general tracking banner/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'No analytics or advertising storage' }),
    ).toBeInTheDocument();
  });
});

describe('point-of-collection notice', () => {
  it('links Terms and Privacy without bundling optional marketing consent', () => {
    render(<StepEmail onComplete={() => undefined} />);

    expect(screen.getByRole('link', { name: 'Early-Access Terms' })).toHaveAttribute(
      'href',
      '/early-access/terms',
    );
    expect(screen.getByRole('link', { name: 'Privacy Notice' })).toHaveAttribute(
      'href',
      '/early-access/privacy',
    );
    expect(screen.getByText(/confirm you are 18 or older/i)).toBeInTheDocument();
    expect(screen.getByText(/can be stopped separately from deleting your registration/i)).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
