import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 text-center">
      <Logo />
      <p className="eyebrow mt-12">404</p>
      <h1 className="heading-display mt-3 text-5xl">This page has evaporated</h1>
      <p className="mt-4 max-w-sm text-stone">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link href="/" className="btn-primary mt-8">
        Back to the shop
      </Link>
    </div>
  );
}
