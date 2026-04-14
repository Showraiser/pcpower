import './globals.css';

export const metadata = {
  title: 'PCPOWER — Can Your PC Run It?',
  description: 'Check game compatibility with your PC specs.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
