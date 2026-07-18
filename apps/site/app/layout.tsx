import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'AgenTick', description: 'Watch and verify auditable AI-assisted software work.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
