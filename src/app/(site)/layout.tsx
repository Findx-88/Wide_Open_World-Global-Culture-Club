import { Nav } from '@/components/site/Nav';
import { Footer } from '@/components/site/Footer';
import { getMember } from '@/server/member-auth';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const member = await getMember();
  return (
    // Bottom padding keeps content clear of the fixed mobile tab bar.
    <div className="pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0">
      <Nav member={member ? { name: member.name } : null} />
      <main className="min-h-[70vh]">{children}</main>
      <Footer />
    </div>
  );
}
