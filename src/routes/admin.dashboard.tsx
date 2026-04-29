import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [{ title: "Admin Dashboard — KrishiSathi" }],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time platform metrics, moderation status, and system health.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label="Total Users" value="1,24,580" />
          <Kpi label="Active Today" value="8,432" />
          <Kpi label="Premium Users" value="12,340" />
          <Kpi label="Revenue Today" value="₹84,200" />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Panel title="System Health" rows={["API latency: 142ms", "Redis: healthy", "DB CPU: 41%"]} />
          <Panel
            title="Moderation Queue"
            rows={[
              "14 posts flagged for review",
              "3 users pending suspension decision",
              "2 expert KYC approvals pending",
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
