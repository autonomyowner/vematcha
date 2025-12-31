'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useLanguage } from './LanguageProvider';

export function ExportButton() {
  const { getToken } = useAuth();
  const { language } = useLanguage();
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/dashboard/export?format=${format}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error('Export failed');

      const data = format === 'json' ? await res.json() : await res.text();

      const blob = new Blob(
        [format === 'json' ? JSON.stringify(data, null, 2) : data],
        { type: format === 'json' ? 'application/json' : 'text/csv' }
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `matcha-insights-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const t = {
    en: {
      exportJson: 'Export JSON',
      exportCsv: 'Export CSV',
      exporting: 'Exporting...',
    },
    fr: {
      exportJson: 'Exporter JSON',
      exportCsv: 'Exporter CSV',
      exporting: 'Exportation...',
    },
  };

  const text = language === 'fr' ? t.fr : t.en;

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleExport('json')}
        disabled={exporting}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
        style={{
          background: 'var(--cream-200)',
          color: 'var(--text-primary)',
        }}
      >
        {exporting ? text.exporting : text.exportJson}
      </button>
      <button
        onClick={() => handleExport('csv')}
        disabled={exporting}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
        style={{
          background: 'var(--cream-200)',
          color: 'var(--text-primary)',
        }}
      >
        {exporting ? text.exporting : text.exportCsv}
      </button>
    </div>
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
