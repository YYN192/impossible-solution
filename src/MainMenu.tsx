import { useState } from "react";

const volumeKey = "mars-master-volume";
const stars = Array.from({ length: 72 }, (_, i) => ({
  left: `${(i * 37 + 13) % 100}%`,
  top: `${(i * 61 + 7) % 100}%`,
  animationDelay: `${(i % 9) * -0.4}s`,
}));

export default function MainMenu() {
  const [settings, setSettings] = useState(false);
  const [volume, setVolume] = useState(() =>
    Number(localStorage.getItem(volumeKey) ?? 70),
  );
  const [quitMessage, setQuitMessage] = useState("");
  const go = (page: string) => {
    window.location.href = `${import.meta.env.BASE_URL}${page}`;
  };
  const changeVolume = (value: number) => {
    setVolume(value);
    localStorage.setItem(volumeKey, String(value));
  };
  const quit = () => {
    window.close();
    setQuitMessage("You can close this tab to leave the mission.");
  };

  return (
    <main className="menu-screen">
      <div className="starfield" aria-hidden="true">
        {stars.map((star, i) => (
          <i key={i} style={star} />
        ))}
      </div>
      <div className="menu-content">
        <p className="eyebrow">NASA SPACE APPS · MARS MISSION</p>
        <h1>
          THE IMPOSSIBLE
          <br />
          SOLUTION
        </h1>
        <p className="menu-subtitle">A new home on the red planet</p>
        {!settings ? (
          <nav className="menu-actions" aria-label="Main menu">
            <button className="pixel-button" onClick={() => go("hub.html")}>
              PLAY
            </button>
            <button className="pixel-button" onClick={() => setSettings(true)}>
              SETTINGS
            </button>
            <button className="pixel-button" onClick={quit}>
              QUIT
            </button>
          </nav>
        ) : (
          <section className="settings-panel pixel-panel">
            <h2>SETTINGS</h2>
            <label htmlFor="volume">
              MASTER VOLUME <span>{volume}%</span>
            </label>
            <input
              id="volume"
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
            />
            <button className="pixel-button" onClick={() => setSettings(false)}>
              BACK
            </button>
          </section>
        )}
        {quitMessage && (
          <p role="status" className="pixel-small">
            {quitMessage}
          </p>
        )}
        <p className="menu-footer">MISSION CONTROL · 2042</p>
      </div>
    </main>
  );
}
