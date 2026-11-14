import { DataSources } from "./screens/DataSources";

// Temporary preview switch until the app shell (#12) adds real navigation: ?view=sources
const view = new URLSearchParams(globalThis.location?.search ?? "").get("view");

export default function App() {
  if (view === "sources")
    return <DataSources onBack={() => (location.search = "")} />;
  return (
    <main className="shell">
      <h1>The Impossible SOLution</h1>
      <p>
        Junior Astronaut Mission Trainer — NASA Space Apps 2026. Under
        construction.
      </p>
      <p className="note">
        Uses NASA open data. Not affiliated with or endorsed by NASA.
      </p>
    </main>
  );
}
