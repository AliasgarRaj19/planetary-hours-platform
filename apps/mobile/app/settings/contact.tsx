import { LegalPage } from '@/features/legal/LegalPage';
import { legalPages } from '@/features/legal/legal-content';

export default function ContactSettingsScreen() {
  return <LegalPage content={legalPages.contact} />;
}
