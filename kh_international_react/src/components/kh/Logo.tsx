import logo from "@/assets/kh-logo.jpeg";

export function Logo({ className = "h-12 w-auto" }: { className?: string }) {
  return <img src={logo} alt="KH International" className={className} />;
}