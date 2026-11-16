import React from 'react';
import { ArrowRight, Package } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import UserProductVisibility from './UserProductVisibility';

export default function AdminUserProducts() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  return <main dir="rtl" className="mx-auto max-w-5xl space-y-4 px-3 py-5 sm:px-6">
    <button type="button" onClick={() => navigate('/admin/users')} className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-bold"><ArrowRight className="h-4 w-4" />العودة إلى المستخدمين</button>
    <header className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <div className="flex items-center gap-3"><Package className="h-6 w-6 text-[var(--color-primary)]" /><div><h1 className="text-xl font-black">إدارة منتجات المستخدم</h1><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{location.state?.userName || `معرّف المستخدم: ${userId}`}</p></div></div>
    </header>
    <UserProductVisibility userId={userId} standalone />
  </main>;
}
