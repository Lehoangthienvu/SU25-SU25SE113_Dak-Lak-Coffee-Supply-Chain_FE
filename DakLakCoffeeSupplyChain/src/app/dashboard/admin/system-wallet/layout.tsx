import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ví Hệ Thống - Admin Dashboard',
  description: 'Quản lý và theo dõi ví System (Admin)',
};

export default function SystemWalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

