import { BomProvider } from '@/context/BomContext';

export default function BomDetailLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <BomProvider>{children}</BomProvider>;
}
