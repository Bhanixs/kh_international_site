import logo from "@/assets/optimized/logo-256-lossless.webp";

export function Logo({ className = "h-12 w-auto" }: { className?: string }) {
  return <img src={logo} alt="KH International" width={1024} height={1024} className={className} />;
}