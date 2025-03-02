'use client';

import Script from 'next/script';

type AnalyticsProps = {
  googleAnalyticsId?: string;
  microsoftClarityId?: string;
};

/**
 * Analytics scripts component that loads Google Analytics and Microsoft Clarity
 * This component is designed to be used in the head section of the layout
 * 
 * @param googleAnalyticsId - Google Analytics measurement ID (format: G-XXXXXXXXXX)
 * @param microsoftClarityId - Microsoft Clarity project ID
 */
export default function Analytics({
  googleAnalyticsId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  microsoftClarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID
}: AnalyticsProps) {
  return (
    <>
      {/* Google Analytics Script */}
      {googleAnalyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleAnalyticsId}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      {/* Microsoft Clarity Script */}
      {microsoftClarityId && (
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${microsoftClarityId}");
          `}
        </Script>
      )}
    </>
  );
}

// Declare global window interface for TypeScript
declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void;
  }
}
