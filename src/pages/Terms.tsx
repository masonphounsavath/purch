import { LegalPage, type LegalSection } from '../components/layout/LegalPage'

const sections: LegalSection[] = [
  {
    title: 'Who can use Purch',
    body: (
      <p>
        Purch is exclusively for current UNC Chapel Hill students and affiliates with an active <strong>@unc.edu</strong> email address. By signing in, you confirm that the email you use belongs to you and is associated with your enrollment.
      </p>
    ),
  },
  {
    title: 'Listing rules',
    body: (
      <>
        <p>
          Every listing must represent a real, available sublease in the Chapel Hill / Carrboro area. You may only post a listing for a unit you have the right to sublease. Fraudulent, duplicate, or misleading listings will be removed and your account suspended.
        </p>
        <p>
          Pricing must reflect what you are actually charging. Do not mark a place as available if it's already been filled.
        </p>
      </>
    ),
  },
  {
    title: 'Purch is not a party to transactions',
    body: (
      <>
        <p>
          Purch provides a platform for UNC students to find and connect with subletters. We do not verify individual listings, guarantee availability, or take responsibility for agreements made between users. All sublease arrangements are between you and the other party.
        </p>
        <p>
          Always exercise common sense: tour before you commit, use a written agreement, and never send money before you've confirmed the listing is legitimate.
        </p>
      </>
    ),
  },
  {
    title: 'Acceptable use',
    body: (
      <p>
        Don't use Purch to harass other users, post spam, or scrape listings for use elsewhere. Messages sent through the in-app thread must be related to the listing at hand. We reserve the right to remove content or accounts that violate this policy.
      </p>
    ),
  },
  {
    title: 'Intellectual property',
    body: (
      <p>
        By posting photos or content on Purch, you grant us a limited license to display that content on the platform. You retain ownership of everything you post. We will never sell or license your content to third parties.
      </p>
    ),
  },
  {
    title: 'Subletting & lease policies',
    body: (
      <>
        <p>
          Many apartments and landlords have specific policies regarding subletting — including restrictions or outright prohibitions. <strong>It is your responsibility to review and comply with your own lease agreement and your landlord's policies before listing or taking over a sublet.</strong>
        </p>
        <p>
          Purch does not review, enforce, or intervene in the terms between you and your landlord. By using the platform, you acknowledge that any subletting arrangement you enter into is solely your own, and that Purch bears no responsibility for lease violations or disputes that may arise.
        </p>
      </>
    ),
  },
  {
    title: 'Changes to these terms',
    body: (
      <p>
        We may update these terms as the platform evolves. If we make a material change, we'll let you know via the email on file. Continued use of Purch after an update means you accept the revised terms.
      </p>
    ),
  },
]

export default function Terms() {
  return (
    <LegalPage
      eyebrow="LEGAL · TERMS"
      title="Terms of Use"
      intro="The rules that keep Purch fair and trustworthy for everyone."
      updated="May 2026"
      sections={sections}
      contact={
        <>
          Questions about these terms? Reach us at{' '}
          <a href="mailto:mason@purchit.org">mason@purchit.org</a>.
        </>
      }
    />
  )
}
