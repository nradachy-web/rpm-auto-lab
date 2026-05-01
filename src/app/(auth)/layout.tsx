import Link from "next/link";
import Image from "next/image";
import { BASE_PATH } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-rpm-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Cinematic photo backdrop. Heavy darkening overlay keeps the form
          legible without obscuring the atmosphere. */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${BASE_PATH}/portal-art/login-bay.jpg")` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/65 to-black/85" />
      <div className="absolute inset-0 bg-rpm-black/30" />

      {/* Logo */}
      <div className="relative z-10 mb-8">
        <Link href="/" className="inline-block">
          <Image
            src={`${BASE_PATH}/logo.png`}
            alt="RPM Auto Lab"
            width={160}
            height={48}
            className="h-12 w-auto invert brightness-200"
            priority
          />
        </Link>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">{children}</div>
    </div>
  );
}
