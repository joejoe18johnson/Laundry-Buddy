import { PRIVACY_SECTIONS } from '../../lib/legalContent'
import { LegalDocumentScreen } from './LegalDocumentScreen'

export function PrivacyScreen() {
  return (
    <LegalDocumentScreen
      title="Privacy policy"
      subtitle="How Laundry Buddy collects, uses, and protects your information."
      sections={PRIVACY_SECTIONS}
    />
  )
}
