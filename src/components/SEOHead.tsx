import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://nigam-park.lovable.app';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  /** Route path (e.g. "/profile") used to build a self-referencing canonical + og:url */
  path?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noIndex?: boolean;
  structuredData?: object;
}

export function SEOHead({
    title,
    description,
    keywords,
    canonicalUrl,
    path,
    ogImage = 'https://nigam-park.lovable.app/favicon.png',
    ogType = 'website',
    noIndex = false,
  structuredData,
}: SEOHeadProps) {
  const fullTitle = /nigam-park/i.test(title) ? title : `${title} | NIGAM-Park`;
    const url = canonicalUrl || (path ? `${SITE_URL}${path}` : undefined);

  return (
    <Helmet>
          <title>{fullTitle}</title>
          <meta name="description" content={description} />
          {keywords && <meta name="keywords" content={keywords} />}
          {noIndex && <meta name="robots" content="noindex, nofollow" />}

          {/* Open Graph */}
          <meta property="og:title" content={fullTitle} />
          <meta property="og:description" content={description} />
          <meta property="og:type" content={ogType} />
          <meta property="og:image" content={ogImage} />
          {url && <meta property="og:url" content={url} />}

          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={fullTitle} />
          <meta name="twitter:description" content={description} />
          <meta name="twitter:image" content={ogImage} />

          {/* Canonical URL */}
          {url && <link rel="canonical" href={url} />}

          {/* Structured Data */}
          {structuredData && (
            <script type="application/ld+json">
              {JSON.stringify(structuredData)}
            </script>
          )}
    </Helmet>
  );
}
