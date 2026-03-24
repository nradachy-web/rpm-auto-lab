import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-rpm-black flex flex-col items-center justify-center relative">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-rpm-red/3 via-rpm-black to-rpm-dark" />

      {/* Logo */}
      <div className="relative z-10 mb-8">
        <Link href="/" className="inline-block">
          <Image
            src="/logo.png"
            alt="RPM Auto Lab"
            width={160}
            height={48}
            className="h-12 w-auto"
            priority
          />
        </Link>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">{children}</div>
    </div>
  );
}
