'use client';

type BomStatus = 'draft' | 'submitted' | 'approved' | 'final' | 'archived' | 'review';

const STATUS_CONFIG: Record<BomStatus, { label: string; bg: string; text: string; dot: string }> = {
  draft: { label: 'Draft', bg: 'bg-slate-200', text: 'text-slate-700', dot: 'bg-slate-500' },
  review: { label: 'Submitted', bg: 'bg-amber-100', text: 'text-amber-900', dot: 'bg-amber-500' },
  submitted: { label: 'Submitted', bg: 'bg-amber-100', text: 'text-amber-900', dot: 'bg-amber-500' },
  approved: { label: 'Approved', bg: 'bg-lime-100', text: 'text-lime-900', dot: 'bg-lime-600' },
  final: { label: 'Final', bg: 'bg-emerald-100', text: 'text-emerald-900', dot: 'bg-emerald-600' },
  archived: { label: 'Archived', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-500' },
};

export function StatusBadge({ status, size = 'sm' }: { status: BomStatus; size?: 'xs' | 'sm' | 'md' }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const sizeMap = { xs: 'text-[9px] px-1.5 py-0.5', sm: 'text-[10px] px-2 py-0.5', md: 'text-xs px-2.5 py-1' };
  const dotSize = size === 'xs' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${cfg.bg} ${cfg.text} ${sizeMap[size]}`}>
      <span className={`${dotSize} rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
