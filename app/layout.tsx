import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'FINN | Evidence-led investment intelligence',description:'A focused portfolio briefing and source-backed company research workspace.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
