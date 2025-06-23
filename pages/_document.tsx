import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* PWA Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="background-color" content="#ffffff" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Apple PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Family OS" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-touch-icon-167x167.png" />
        
        {/* Standard Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="shortcut icon" href="/icons/favicon.ico" />
        
        {/* Microsoft PWA Meta Tags */}
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        
        {/* PWA Description */}
        <meta name="description" content="A collaborative family management PWA for organizing your family's daily life" />
        <meta name="keywords" content="family, organization, PWA, productivity, collaboration, schedule, tasks" />
        <meta name="author" content="Family OS" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Family OS - Family Management PWA" />
        <meta property="og:description" content="A collaborative family management PWA for organizing your family's daily life" />
        <meta property="og:image" content="/icons/og-image.png" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Family OS - Family Management PWA" />
        <meta name="twitter:description" content="A collaborative family management PWA for organizing your family's daily life" />
        <meta name="twitter:image" content="/icons/twitter-image.png" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('theme');
                if (theme && (theme === 'pastel' || theme === 'pastel-dark')) {
                  document.documentElement.setAttribute('data-theme', theme);
                } else {
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  document.documentElement.setAttribute('data-theme', prefersDark ? 'pastel-dark' : 'pastel');
                }
              } catch (e) {
                document.documentElement.setAttribute('data-theme', 'pastel');
              }
            `,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 