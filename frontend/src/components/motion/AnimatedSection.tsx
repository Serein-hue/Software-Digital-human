import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { cn } from "../../lib/cn";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedSection({ children, className, delay = 0 }: AnimatedSectionProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".motion-item",
        { y: 12 },
        {
          y: 0,
          duration: 0.34,
          delay,
          ease: "power3.out",
          stagger: 0.055
        }
      );
    },
    { scope }
  );

  return (
    <div ref={scope} className={cn("motion-safe:[&_.motion-item]:will-change-transform", className)}>
      {children}
    </div>
  );
}
