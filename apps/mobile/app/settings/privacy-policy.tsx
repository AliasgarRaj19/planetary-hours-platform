import { LegalPage } from '@/features/legal/LegalPage';
import { legalPages } from '@/features/legal/legal-content';

export default function PrivacyPolicySettingsScreen() {
  return <LegalPage content={legalPages.privacy} />;
}
