import React, { useEffect, useState } from "react";
export default function App() {
  const [health, setHealth] = useState(null);
  useEffect(() => { fetch("/api/v1/health").then(r=>r.json()).then(setHealth).catch(()=>setHealth({ok:false})); }, []);
  return (
    <div style={{fontFamily:"system-ui, sans-serif", padding:16}}>
      <h1>World Cup in Miami</h1>
      <p>Frontend is running (Vite + React).</p>
      <pre>API health: {health ? JSON.stringify(health, null, 2) : "…"}</pre>
    </div>
  );
}
