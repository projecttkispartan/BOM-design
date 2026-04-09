'use client';

import { useState } from 'react';
import { MasterDataProvider } from '@/context/MasterDataContext';
import { MasterManagement } from '@/components/MasterManagement';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MasterPage() {
  return (
    <MasterDataProvider>
      <div className="min-h-screen bg-slate-100">
        <div className="max-w-7xl mx-auto p-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Daftar BOM
          </Link>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-slate-200">
              <h1 className="text-2xl font-bold text-slate-900">Master Data Management</h1>
              <p className="text-slate-600 text-sm mt-1">Kelola master modul, sub-modul, dan materials untuk digunakan di BOM</p>
            </div>

            <div className="p-6">
              <MasterManagement />
            </div>
          </div>
        </div>
      </div>
    </MasterDataProvider>
  );
}
