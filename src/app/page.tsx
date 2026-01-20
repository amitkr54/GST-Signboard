import { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { generateLocalBusinessSchema } from '@/lib/seo';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: `${siteConfig.name} - Custom Business Signage & Design Tool`,
  description: siteConfig.description,
  openGraph: {
    title: `${siteConfig.name} - Custom Business Signage`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: `${siteConfig.url}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: siteConfig.url,
  },
};

export default function Home() {
  const localBusinessSchema = generateLocalBusinessSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <HomeClient />
    </>
  );
}
