"use client";

import { useEffect, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Shield, Calendar } from "lucide-react";
import Badge from "@/components/Badge";

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/login");
      return;
    }
    try {
      startTransition(() => setUser(JSON.parse(stored)));
    } catch {
      router.push("/login");
    }
  }, [router]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Profile</h1>
        <p className="mt-1 text-sm text-text-secondary">Your account information</p>
      </div>

      <div className="rounded-xl border border-border bg-surface-card shadow-sm">
        <div className="flex flex-col items-center gap-4 border-b border-border px-6 py-8 sm:flex-row">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl font-bold text-white shadow-lg shadow-brand-600/30">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-text-primary">{user.name}</h2>
            <p className="text-sm text-text-secondary">{user.email}</p>
            <div className="mt-1.5">
              <Badge>{user.role}</Badge>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border">
          <div className="flex items-center gap-3 px-6 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
              <User size={16} className="text-brand-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text-secondary">Name</p>
              <p className="text-sm font-medium text-text-primary">{user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
              <Mail size={16} className="text-brand-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text-secondary">Email</p>
              <p className="text-sm font-medium text-text-primary">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
              <Shield size={16} className="text-brand-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text-secondary">Role</p>
              <p className="text-sm font-medium text-text-primary capitalize">{user.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
              <Calendar size={16} className="text-brand-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text-secondary">User ID</p>
              <p className="text-sm font-medium text-text-primary">#{user.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
