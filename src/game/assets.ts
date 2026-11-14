import floorMetal from "../assets/pixel/environment/floors/mars-floor-metal.png";
import floorBlueStrip from "../assets/pixel/environment/floors/mars-floor-blue-strip.png";
import wallStraight from "../assets/pixel/environment/walls/mars-wall-straight.png";
import wallTop from "../assets/pixel/environment/walls/mars-wall-top-edge.png";
import wallBottom from "../assets/pixel/environment/walls/mars-wall-bottom-edge.png";
import wallLeft from "../assets/pixel/environment/walls/mars-wall-left-edge.png";
import wallRight from "../assets/pixel/environment/walls/mars-wall-right-edge.png";
import wallCorner from "../assets/pixel/environment/walls/mars-wall-outer-corner.png";
import windowSurface from "../assets/pixel/environment/windows/mars-window-surface.png";
import doorStandard from "../assets/pixel/environment/doors/mars-door-standard-closed.png";
import doorAirlock from "../assets/pixel/environment/doors/mars-door-airlock-closed.png";
import crate from "../assets/pixel/environment/decorations/mars-crate.png";
import shelf from "../assets/pixel/environment/decorations/mars-shelf.png";
import table from "../assets/pixel/environment/decorations/mars-table.png";
import chair from "../assets/pixel/environment/decorations/mars-chair.png";
import vent from "../assets/pixel/environment/decorations/mars-vent.png";
import equipment from "../assets/pixel/environment/decorations/mars-research-equipment.png";
import workstation from "../assets/pixel/consoles/workstation.png";
import consoleInactive from "../assets/pixel/consoles/mission-console-inactive.png";
import consoleActive from "../assets/pixel/consoles/mission-console-active.png";
import consoleHighlighted from "../assets/pixel/consoles/mission-console-highlighted.png";
import interactionPrompt from "../assets/pixel/ui/interaction-prompt.png";
import dialogFrame from "../assets/pixel/ui/dialog-frame.png";
import commanderFront from "../assets/pixel/characters/npcs/mission-commander-idle-front.png";
import commanderBack from "../assets/pixel/characters/npcs/mission-commander-idle-back.png";
import commanderLeft from "../assets/pixel/characters/npcs/mission-commander-idle-left.png";
import commanderRight from "../assets/pixel/characters/npcs/mission-commander-idle-right.png";
import scientistFront from "../assets/pixel/characters/npcs/scientist-idle-front.png";
import scientistBack from "../assets/pixel/characters/npcs/scientist-idle-back.png";
import scientistLeft from "../assets/pixel/characters/npcs/scientist-idle-left.png";
import scientistRight from "../assets/pixel/characters/npcs/scientist-idle-right.png";
import engineerFront from "../assets/pixel/characters/npcs/engineer-idle-front.png";
import engineerBack from "../assets/pixel/characters/npcs/engineer-idle-back.png";
import engineerLeft from "../assets/pixel/characters/npcs/engineer-idle-left.png";
import engineerRight from "../assets/pixel/characters/npcs/engineer-idle-right.png";
import drone from "../assets/pixel/characters/robots/assistant-drone.png";

const playerFrames = {
  front: [
    "../assets/pixel/characters/player/astronaut-walk-front-1.png",
    "../assets/pixel/characters/player/astronaut-walk-front-2.png",
    "../assets/pixel/characters/player/astronaut-walk-front-3.png",
    "../assets/pixel/characters/player/astronaut-walk-front-4.png",
  ],
  back: [
    "../assets/pixel/characters/player/astronaut-walk-back-1.png",
    "../assets/pixel/characters/player/astronaut-walk-back-2.png",
    "../assets/pixel/characters/player/astronaut-walk-back-3.png",
    "../assets/pixel/characters/player/astronaut-walk-back-4.png",
  ],
  left: [
    "../assets/pixel/characters/player/astronaut-walk-left-1.png",
    "../assets/pixel/characters/player/astronaut-walk-left-2.png",
    "../assets/pixel/characters/player/astronaut-walk-left-3.png",
    "../assets/pixel/characters/player/astronaut-walk-left-4.png",
  ],
  right: [
    "../assets/pixel/characters/player/astronaut-walk-right-1.png",
    "../assets/pixel/characters/player/astronaut-walk-right-2.png",
    "../assets/pixel/characters/player/astronaut-walk-right-3.png",
    "../assets/pixel/characters/player/astronaut-walk-right-4.png",
  ],
};

import playerFront from "../assets/pixel/characters/player/astronaut-idle-front.png";
import playerBack from "../assets/pixel/characters/player/astronaut-idle-back.png";
import playerLeft from "../assets/pixel/characters/player/astronaut-idle-left.png";
import playerRight from "../assets/pixel/characters/player/astronaut-idle-right.png";
import playerInteract from "../assets/pixel/characters/player/astronaut-interacting.png";

const playerWalk = {
  front: playerFrames.front.map((path) => new URL(path, import.meta.url).href),
  back: playerFrames.back.map((path) => new URL(path, import.meta.url).href),
  left: playerFrames.left.map((path) => new URL(path, import.meta.url).href),
  right: playerFrames.right.map((path) => new URL(path, import.meta.url).href),
};

export const sprites = {
  floorMetal,
  floorBlueStrip,
  wallStraight,
  wallTop,
  wallBottom,
  wallLeft,
  wallRight,
  wallCorner,
  windowSurface,
  doorStandard,
  doorAirlock,
  crate,
  shelf,
  table,
  chair,
  vent,
  equipment,
  workstation,
  consoleInactive,
  consoleActive,
  consoleHighlighted,
  interactionPrompt,
  dialogFrame,
  drone,
  players: {
    idle: {
      front: playerFront,
      back: playerBack,
      left: playerLeft,
      right: playerRight,
    },
    walk: playerWalk,
    interact: playerInteract,
  },
  npcs: {
    commander: {
      front: commanderFront,
      back: commanderBack,
      left: commanderLeft,
      right: commanderRight,
    },
    scientist: {
      front: scientistFront,
      back: scientistBack,
      left: scientistLeft,
      right: scientistRight,
    },
    engineer: {
      front: engineerFront,
      back: engineerBack,
      left: engineerLeft,
      right: engineerRight,
    },
  },
} as const;

const imageCache = new Map<string, HTMLImageElement>();

export function getSprite(url: string): HTMLImageElement {
  let image = imageCache.get(url);
  if (!image) {
    image = new Image();
    image.src = url;
    imageCache.set(url, image);
  }
  return image;
}
