import { asset } from "../game/assets";
import { ICON_BADGES } from "../sim/icons";
import "./Icon.css";

const isBadge = (name: string) => (ICON_BADGES as readonly string[]).includes(name);

function src(name: string): string | undefined {
  try {
    return asset(`icons/${name}`);
  } catch {
    // Unknown name (e.g. an old saved run): show nothing rather than break the screen.
    return undefined;
  }
}

/**
 * One pixel-art icon from src/assets/pixel/icons/ (#50). Decoration only: the text next to it
 * already says what it means, so screen readers skip it.
 */
export function Icon({ name, className }: { name: string; className?: string }) {
  const url = src(name);
  if (!url) return null;
  return (
    <img
      className={className ? `px-icon ${className}` : "px-icon"}
      src={url}
      alt=""
      aria-hidden="true"
      data-icon={name}
      draggable={false}
    />
  );
}

/**
 * A domino or choice icon: names separated by spaces (see src/sim/icons.ts). A badge (x, up,
 * down, zero) sits on the corner of the icon before it: "food power x" = food, then power with an x badge.
 */
export function Icons({ icon, className }: { icon: string; className?: string }) {
  const groups: { name: string; badges: string[] }[] = [];
  for (const part of icon.split(/\s+/).filter(Boolean)) {
    const last = groups.at(-1);
    if (isBadge(part) && last) last.badges.push(part);
    else groups.push({ name: part, badges: [] });
  }
  return (
    <span className={className ? `px-icons ${className}` : "px-icons"} aria-hidden="true">
      {groups.map(({ name, badges }, i) =>
        badges.length ? (
          <span className="px-stack" key={i}>
            <Icon name={name} />
            {badges.map((b) => (
              <Icon key={b} name={b} className="px-badge" />
            ))}
          </span>
        ) : (
          <Icon key={i} name={name} />
        ),
      )}
    </span>
  );
}
