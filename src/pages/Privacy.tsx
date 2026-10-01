import { LegalPage, type LegalSection } from '../components/layout/LegalPage'

const sections: LegalSection[] = [
  {
    title: 'What we collect',
    body: (
      <>
        <p>
          When you sign in, we receive your <strong>@unc.edu email address</strong> from your institution's authentication provider. That's the only personal identifier we store. No password, no phone number, no payment info.
        </p>
        <p>
          We also store content you create — listing details, photos, and messages sent through the app — as well as anonymous page view counts to understand how the platform is being used.
        </p>
      </>
    ),
  },
  {
    title: 'How we use it',
    body: (
      <>
        <p>
          Your information is used solely to operate Purch — to display your listings, route your messages, and keep the board trustworthy. We do not sell, rent, or share your data with third parties for marketing.
        </p>
        <p>
          Your email is visible to Purch but is never displayed publicly on the platform. Other users see your listing and can message you through the in-app thread — your address never leaves our system.
        </p>
      </>
    ),
  },
  {
    title: 'Third-party services',
    body: (
      <p>
        Purch runs on <strong>Supabase</strong> for authentication and data storage, and uses <strong>Mapbox</strong> for map rendering. Both services operate under their own privacy policies and comply with standard data protection practices. No third party receives your email address from us.
      </p>
    ),
  },
  {
    title: 'Data security',
    body: (
      <p>
        All data is encrypted in transit (TLS) and at rest. Access to the database is strictly controlled. We follow industry best practices and regularly review our security posture.
      </p>
    ),
  },
  {
    title: 'Your rights',
    body: (
      <p>
        You can request access to, correction of, or deletion of your personal data at any time. To close your account and remove your data, contact us and we'll handle it promptly.
      </p>
    ),
  },
]

export default function Privacy() {
  return (
    <LegalPage
      eyebrow="LEGAL · PRIVACY"
      title="Privacy Policy"
      intro="Your privacy and data security are our top priorities."
      updated="May 2026"
      sections={sections}
      contact={
        <>
          Questions about your data? Email us at{' '}
          <a href="mailto:mason@purchit.org">mason@purchit.org</a>{' '}
          and we'll respond within 48 hours.
        </>
      }
    />
  )
}
