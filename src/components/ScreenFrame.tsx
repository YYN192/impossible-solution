import { useEffect, useRef, type ReactNode } from "react";

/**
 * Shared layout for every screen. On mount it moves focus to the heading, so keyboard and
 * screen-reader users land at the top of the new screen instead of on a vanished button.
 */
export function ScreenFrame({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const h1 = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    h1.current?.focus();
  }, []);
  return (
    <section className="screen">
      <h1 ref={h1} tabIndex={-1}>
        {title}
      </h1>
      {children}
    </section>
  );
}
