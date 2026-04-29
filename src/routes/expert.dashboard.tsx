import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/expert/dashboard")({
  head: () => ({
    meta: [{ title: "Expert Dashboard — KrishiSathi" }],
  }),
  component: ExpertDashboard,
});

function ExpertDashboard() {
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold">Expert Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track consultations, pending farmer queries, and performance.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label="Today's Calls" value="4" />
          <Kpi label="Pending Queries" value="12" />
          <Kpi label="Rating" value="4.8★" />
          <Kpi label="Earnings Today" value="₹3,200" />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Panel
            title="Upcoming Slots"
            rows={[
              "05:30 PM - Crop disease consultation",
              "06:00 PM - Irrigation optimization",
              "07:30 PM - PMFBY claim guidance",
            ]}
          />
          <Panel
            title="Top Topics"
            rows={[
              "Rice leaf blight management",
              "Soil pH correction in black soil",
              "Mandi timing for onion harvest",
            ]}
          />
        </div>
      </div>
    </AppShell>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="font-serif text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function Panel({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-semibold">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {rows.map((row) => (
          <li key={row} className="rounded-lg bg-muted/40 px-3 py-2">
            {row}
          </li>
        ))}
      </ul>
    </div>
  );
}
