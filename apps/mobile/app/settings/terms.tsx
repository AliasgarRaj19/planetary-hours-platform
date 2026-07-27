import { LegalPage } from '@/features/legal/LegalPage';
import { legalPages } from '@/features/legal/legal-content';

export default function TermsSettingsScreen() {
  return <LegalPage content={legalPages.terms} />;
}
