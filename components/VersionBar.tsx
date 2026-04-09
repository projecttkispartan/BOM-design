'use client';

import type { BomVersionDetail } from '@/lib/bomApiClient';
import { StatusBadge } from './StatusBadge';
import { Plus, ChevronRight, Clock } from 'lucide-react';

interface VersionBarProps {
  versions: BomVersionDetail[];
  currentVersionId: string;
  bomName: string;
  onSelectVersion: (versionId: string) => void;
  onCreateVersion: () => void;
  onCompareVersions: () => void;
  lastSavedLabel?: string | null;
}

export function VersionBar({ versions, currentVersionId, bomName, onSelectVersion, onCreateVersion, onCompareVersions, lastSavedLabel }: VersionBarProps) {
  const sorted = [...versions].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const current = sorted.find((v) => v.id === currentVersionId || v.versionId === currentVersionId);

  return (
    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2.5">
        <a href="/" className="hover:text-slate-800 transition-colors">Daftar BOM</a>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-700 font-medium">{bomName}</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-900">Versi {current?.version ?? '—'}</span>
      </div>

      {/* Version timeline */}
      <div className="flex items-end gap-2 overflow-x-auto scrollbar-visible pb-1">
        {sorted.map((ver) => {
          const isActive = ver.id === currentVersionId || ver.versionId === currentVersionId;
          const isFinal = ver.status === 'final';
          return (
            <button
              key={ver.versionId}
              type="button"
              onClick={() => onSelectVersion(ver.id)}
              className={`shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-lg border transition-all text-center min-w-[80px] ${
                isActive
                  ? 'bg-sky-50 border-sky-400 ring-1 ring-sky-200'
                  : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span className={`text-xs font-bold ${isActive ? 'text-sky-700' : 'text-slate-600'}`}>
                v{ver.version}
                {isFinal && <span className="ml-1 text-emerald-600">✓</span>}
                {isActive && <span className="ml-1 text-sky-600">●</span>}
              </span>
              <span className="text-[10px] text-slate-500">
                {new Date(ver.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              </span>
              <StatusBadge status={ver.status} size="xs" />
            </button>
          );
        })}
        <button
          type="button"
          onClick={onCreateVersion}
          className="shrink-0 flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg border border-dashed border-slate-300 hover:border-sky-400 hover:bg-sky-50 transition-all min-w-[64px] min-h-[64px]"
        >
          <Plus className="w-4 h-4 text-slate-400" />
          <span className="text-[10px] text-slate-500">Versi Baru</span>
        </button>
        {sorted.length >= 2 && (
          <button
            type="button"
            onClick={onCompareVersions}
            className="shrink-0 flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-all min-w-[64px] min-h-[64px]"
          >
            <span className="text-[10px] font-bold text-slate-500">⇄</span>
            <span className="text-[10px] text-slate-600">Bandingkan</span>
          </button>
        )}
      </div>

      {/* Status bar */}
      {current && (
        <div className="flex items-center gap-4 mt-2.5 text-[11px] text-slate-500">
          <span>STATUS: <StatusBadge status={current.status} size="xs" /></span>
          {current.parentVersionId && (
            <span>Dibuat dari: v{sorted.find((v) => v.versionId === current.parentVersionId)?.version ?? '—'}</span>
          )}
          {lastSavedLabel && (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{lastSavedLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
