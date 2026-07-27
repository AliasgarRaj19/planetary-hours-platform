import { LegalPage } from '@/features/legal/LegalPage';
import { legalPages } from '@/features/legal/legal-content';

export default function DisclaimerSettingsScreen() {
  return <LegalPage content={legalPages.disclaimer} />;
}
