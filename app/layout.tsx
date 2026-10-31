import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sistema de Gestão Pastoral dos Vicentinos',
  description: 'Sistema de Gestão Pastoral dos Vicentinos - Entrega de benefícios alimentares e assistência social comunitária.',
  openGraph: {
    title: 'Sistema de Gestão Pastoral dos Vicentinos',
    description: 'Sistema de Gestão Pastoral dos Vicentinos - Entrega de benefícios alimentares e assistência social comunitária.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sistema de Gestão Pastoral dos Vicentinos',
    description: 'Sistema de Gestão Pastoral dos Vicentinos - Entrega de benefícios alimentares e assistência social comunitária.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning className="font-sans antialiased text-[#111c2c] bg-[#f9f9ff]">
        {children}
      </body>
    </html>
  );
}


