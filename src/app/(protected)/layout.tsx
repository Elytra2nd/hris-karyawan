import { verifySession } from '@/lib/dal';
import LayoutWrapper from '@/components/layout-wrapper';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();
  return (
    <LayoutWrapper role={session?.role}>
      {children}
    </LayoutWrapper>
  );
}