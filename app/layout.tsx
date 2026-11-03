import type { Metadata } from 'next';
import './globals.css';
import './editorial.css';
export const metadata: Metadata={title:'FINN | Evidence-led investment intelligence',description:'A considered investment workspace. Explore the signals, question the narrative, and follow the original evidence.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
