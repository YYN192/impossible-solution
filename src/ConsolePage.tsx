import PlanScreen from "./PlanScreen";

export default function ConsolePage() {
  return (
    <main className="console-page">
      <header className="console-header">
        <button
          className="pixel-button pixel-small"
          onClick={() => {
            window.location.href = `${import.meta.env.BASE_URL}hub.html`;
          }}
        >
          ← RETURN TO STATION
        </button>
        <div>
          <b>ARES STATION · MISSION PLANNER</b>
          <span className="pixel-small">SOL 01 · OPERATIONS CONSOLE</span>
        </div>
        <span className="console-live pixel-small">● SYSTEM ONLINE</span>
      </header>
      <section className="console-frame">
        <PlanScreen />
      </section>
    </main>
  );
}
