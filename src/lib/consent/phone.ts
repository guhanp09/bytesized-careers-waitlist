export const PHONE_CONSENT_VERSION = '2026-07-17.v1';
export const PHONE_CONSENT_SOURCE = 'waitlist_phone_step';

export interface PhoneChannelChoices {
  whatsappConsent: boolean;
  smsConsent: boolean;
  voiceConsent: boolean;
}

export const EMPTY_PHONE_CHANNEL_CHOICES: PhoneChannelChoices = {
  whatsappConsent: false,
  smsConsent: false,
  voiceConsent: false,
};
