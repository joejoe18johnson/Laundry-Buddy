import { TERMS_SECTIONS } from '../../lib/legalContent'
import { LegalDocumentScreen } from './LegalDocumentScreen'

export function TermsScreen() {
  return (
    <LegalDocumentScreen
      title="Terms and conditions"
      subtitle="Rules for using Laundry Buddy as a guest or host."
      sections={TERMS_SECTIONS}
    />
  )
}
