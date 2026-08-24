// "use client";

// import Link from "next/link";
// import { useState } from "react";
// import { Menu, X } from "lucide-react";

// export function MobileMenuToggle() {
//   const [open, setOpen] = useState(false);

//   return (
//     <>
//       <button
//         type="button"
//         aria-label={open ? "Close menu" : "Open menu"}
//         onClick={() => setOpen((v) => !v)}
//         className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
//       >
//         {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
//       </button>

//       {open && (
        
//         <div className="absolute left-0 right-0 top-full z-50 border-t border-border/60 px-4 py-3 shadow-md">
//           <nav className="flex flex-col gap-1">
//             <Link
//               href="/"
//               onClick={() => setOpen(false)}
//               className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
//             >
//               <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-base">🏠</span>
//               Home
//             </Link>
//             <Link
//               href="/about"
//               onClick={() => setOpen(false)}
//               className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
//             >
//               <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-base">ℹ️</span>
//               About
//             </Link>
//             <Link
//               href="/privacy"
//               onClick={() => setOpen(false)}
//               className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
//             >
//               <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-base">🔒</span>
//               Privacy
//             </Link>
//           </nav>
//         </div>
//       )}
//     </>
//   );
// }

// Calude code

// "use client";

// import Link from "next/link";
// import { useState, useEffect, useRef } from "react";
// import { Menu, X } from "lucide-react";

// export function MobileMenuToggle() {
//   const [open, setOpen] = useState(false);
//   const ref = useRef<HTMLDivElement>(null);

//   // Close on outside click
//   useEffect(() => {
//     if (!open) return;
//     const handler = (e: MouseEvent) => {
//       if (ref.current && !ref.current.contains(e.target as Node)) {
//         setOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, [open]);

//   return (
//     <div ref={ref} className="relative">
//       <button
//         type="button"
//         aria-label={open ? "Close menu" : "Open menu"}
//         onClick={() => setOpen((v) => !v)}
//         className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
//       >
//         {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
//       </button>

//       {open && (
//         <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-background shadow-lg">
//           <nav className="flex flex-col gap-0.5 p-2">
//             <Link
//               href="/"
//               onClick={() => setOpen(false)}
//               className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
//             >
//               <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-sm">🏠</span>
//               Home
//             </Link>
//             <Link
//               href="/about"
//               onClick={() => setOpen(false)}
//               className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
//             >
//               <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-sm">ℹ️</span>
//               About
//             </Link>
//             <Link
//               href="/privacy"
//               onClick={() => setOpen(false)}
//               className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
//             >
//               <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-sm">🔒</span>
//               Privacy
//             </Link>
//           </nav>
//         </div>
//       )}
//     </div>
//   );
// }


// Calude code - 2w


"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";

export function MobileMenuToggle() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-border bg-background shadow-lg">
          <nav className="flex flex-col gap-0.5 p-2">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-sm">🏠</span>
              Home
            </Link>
            <Link
              href="/about"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-sm">ℹ️</span>
              About
            </Link>
            <Link
              href="/privacy"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-sm">🔒</span>
              Privacy
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}