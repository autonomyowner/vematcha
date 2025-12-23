import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { getArticleBySlug, getAllArticleSlugs } from '../../../lib/blog-data';
import { ArticleContent } from './ArticleContent';
import '../blog-article.css';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static paths for all articles
export async function generateStaticParams() {
  const slugs = getAllArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Generate metadata for each article
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vematcha.com';

  return {
    title: `${article.titleEn} | Matcha Blog`,
    description: article.descriptionEn,
    keywords: [
      article.category.toLowerCase(),
      'mental health',
      'trauma therapy',
      'EMDR',
      'psychology',
      'wellness',
    ],
    authors: [{ name: 'Matcha' }],
    openGraph: {
      title: article.titleEn,
      description: article.descriptionEn,
      type: 'article',
      publishedTime: article.date,
      authors: ['Matcha'],
      url: `${baseUrl}/blog/${article.slug}`,
      siteName: 'Matcha',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.titleEn,
      description: article.descriptionEn,
    },
    alternates: {
      canonical: `${baseUrl}/blog/${article.slug}`,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vematcha.com';

  // Article structured data (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.titleEn,
    description: article.descriptionEn,
    datePublished: article.date,
    dateModified: article.date,
    author: {
      '@type': 'Organization',
      name: 'Matcha',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Matcha',
      url: baseUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${article.slug}`,
    },
    articleSection: article.category,
    wordCount: article.readTime * 200, // Approximate based on read time
    inLanguage: 'en',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen" style={{ background: 'var(--cream-50)' }}>
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <Link
            href="/blog"
            className="mb-8 text-sm flex items-center gap-2 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--matcha-600)' }}
          >
            <span>&larr;</span>
            <span>Back to all articles</span>
          </Link>

          <article className="blog-article">
            <header className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: 'var(--matcha-100)',
                    color: 'var(--matcha-700)'
                  }}
                >
                  {article.category}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {article.readTime} min read
                </span>
              </div>
              <ArticleContent article={article} section="header" />
            </header>

            <ArticleContent article={article} section="body" />
          </article>
        </main>

        {/* CTA Section */}
        <section
          className="py-16 px-4"
          style={{ background: 'var(--cream-100)' }}
        >
          <div className="max-w-3xl mx-auto text-center">
            <h2
              className="text-2xl md:text-3xl mb-4"
              style={{
                fontFamily: 'var(--font-dm-serif), Georgia, serif',
                color: 'var(--text-primary)'
              }}
            >
              Experience Evidence-Based Healing
            </h2>
            <p
              className="mb-8"
              style={{ color: 'var(--text-secondary)' }}
            >
              Matcha combines proven techniques like EMDR and Flash to support your mental wellness journey.
            </p>
            <SignedOut>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-medium transition-all"
                style={{
                  background: 'var(--matcha-500)',
                  color: 'white',
                }}
              >
                Get Started Free
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/chat"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-medium transition-all"
                style={{
                  background: 'var(--matcha-500)',
                  color: 'white',
                }}
              >
                Chat Now
              </Link>
            </SignedIn>
          </div>
        </section>

        {/* Footer */}
        <footer
          className="py-12 px-4 border-t"
          style={{
            background: 'var(--cream-50)',
            borderColor: 'var(--border-soft)',
          }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <p
                  className="text-xl font-semibold mb-1"
                  style={{
                    fontFamily: 'var(--font-dm-serif), Georgia, serif',
                    color: 'var(--matcha-600)',
                  }}
                >
                  Matcha
                </p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Your companion for mental wellness
                </p>
              </div>
              <div className="flex gap-8">
                <Link
                  href="/"
                  className="text-sm hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Home
                </Link>
                <Link
                  href="/pricing"
                  className="text-sm hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Pricing
                </Link>
                <Link
                  href="/login"
                  className="text-sm hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Login
                </Link>
              </div>
            </div>
            <div
              className="mt-8 pt-8 border-t text-center text-sm"
              style={{
                borderColor: 'var(--border-soft)',
                color: 'var(--text-muted)',
              }}
            >
              &copy; 2025 Matcha. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
