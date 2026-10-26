import Image from "next/image";
import Link from "next/link";

// The Coastal Air Assessments logo, linking home. The source file is small (180px wide);
// swap in a larger or SVG version at public/caa-logo.png when you have one.
export default function Logo({ width = 112 }: { width?: number }) {
  return (
    <Link href="/" className="logo-link">
      <Image
        src="/caa-logo.png"
        alt="Coastal Air Assessments"
        width={width}
        height={Math.round((width * 166) / 180)}
        priority
      />
    </Link>
  );
}
