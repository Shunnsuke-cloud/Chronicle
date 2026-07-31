import Image from "next/image";
import Link from "next/link";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="Chronicle home" className={`block ${className}`}>
      <span className="relative block h-[42px] w-[164px] overflow-hidden">
        <Image
          src="/brand/chronicle-logo-options.png"
          alt="Chronicle"
          width={392}
          height={296}
          priority
          className="absolute -left-[212px] -top-[62px] max-w-none"
        />
      </span>
    </Link>
  );
}
