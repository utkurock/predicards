import clsx from "clsx";

// Predicards brand mark — the 2×2 checkered grid from the logo. Reads as a
// sticker-album / pack grid (phygital collectibles), our own identity rather
// than a generic "AI sparkle". Inherits text color via bg-current.
export function PrediMark({ className }: { className?: string }) {
  return (
    <span className={clsx("grid aspect-square grid-cols-2 grid-rows-2 gap-[2px]", className)}>
      <span className="rounded-[2px] bg-current" />
      <span className="rounded-[2px] bg-current opacity-30" />
      <span className="rounded-[2px] bg-current opacity-30" />
      <span className="rounded-[2px] bg-current" />
    </span>
  );
}
