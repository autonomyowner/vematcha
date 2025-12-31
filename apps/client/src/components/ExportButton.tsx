'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useLanguage } from './LanguageProvider';

export function ExportButton() {
  const { getToken } = useAuth();
  const { language } = useLanguage();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/dashboard/export`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error('Export failed');

      const html = await res.text();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const t = {
    en: {
      downloadReport: 'Download Report',
      generating: 'Generating...',
    },
    fr: {
      downloadReport: 'Telecharger le rapport',
      generating: 'Generation...',
    },
  };

  const text = language === 'fr' ? t.fr : t.en;

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
      style={{
        background: 'var(--matcha-500)',
        color: 'white',
      }}
    >
      {exporting ? text.generating : text.downloadReport}
    </button>
  );
}

// Wrapper component with title for dashboard
export function ExportSection() {
  const { language } = useLanguage();

  const t = {
    en: {
      title: 'Export Your Data',
      description: 'Download your insights and analysis history',
    },
    fr: {
      title: 'Exporter vos donnees',
      description: 'Telecharger votre historique d\'analyses',
    },
  };

  const text = language === 'fr' ? t.fr : t.en;

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'var(--cream-50)',
        border: '1px solid var(--cream-200)',
      }}
    >
      <h3
        className="text-base font-medium mb-1"
        style={{ color: 'var(--text-primary)' }}
      >
        {text.title}
      </h3>
      <p
        className="text-sm mb-3"
        style={{ color: 'var(--text-muted)' }}
      >
        {text.description}
      </p>
      <ExportButton />
    </div>
  );
}
