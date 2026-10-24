import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, LayoutDashboard, LogOut, Package, Settings, ShoppingBag, ExternalLink, Tag } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { logoutAction } from "../login/actions";
import { CrownMark } from "@/components/ui/Logo";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · DHA Admin" }, robots: { index: false } };
export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products & stock", icon: Package },
  { href: "/admin/discounts", label: "Discount codes", icon: Tag },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[#F6F4F0] print:block print:bg-white lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-ink text-ivory print:hidden lg:sticky lg:top-0 lg:h-screen lg:border-b-0">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <CrownMark className="h-3.5 w-6 text-brand-gold" />
          <span className="text-sm font-medium tracking-wide">DHA Admin</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-2 text-sm text-ivory/75 hover:bg-ivory/10 hover:text-ivory"
            >
              <Icon size={16} strokeWidth={1.5} /> {label}
            </Link>
          ))}
        </nav>
        <div className="flex gap-1 px-3 pb-3 lg:absolute lg:bottom-4 lg:block lg:w-full lg:space-y-1 lg:pb-0">
          <Link href="/" target="_blank" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-ivory/60 hover:bg-ivory/10 hover:text-ivory">
            <ExternalLink size={16} strokeWidth={1.5} /> View store
          </Link>
          <form action={logoutAction}>
            <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-ivory/60 hover:bg-ivory/10 hover:text-ivory">
              <LogOut size={16} strokeWidth={1.5} /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-8 print:p-0 sm:px-8 lg:px-10">{children}</main>
    </div>
  );
}
