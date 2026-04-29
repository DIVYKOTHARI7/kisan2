import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [{ title: "User Management — KrishiSathi Admin" }],
  }),
  component: AdminUsers,
});

const users = [
  { id: "u1", name: "Rohan Patel", role: "farmer_premium", state: "Maharashtra", status: "Active" },
  { id: "u2", name: "Asha Devi", role: "farmer_basic", state: "UP", status: "Active" },
  { id: "u3", name: "Dr. Meera Jain", role: "expert", state: "Rajasthan", status: "Pending KYC" },
  { id: "u4", name: "Vikram Traders", role: "input_dealer", state: "Punjab", status: "Suspended" },
];

function AdminUsers() {
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Review role, plan, state distribution, and account status controls.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-5 gap-3 bg-muted/40 px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">
            <div>Name</div>
            <div>Role</div>
            <div>State</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>
          {users.map((user) => (
            <div key={user.id} className="grid grid-cols-5 gap-3 px-4 py-3 border-t border-border items-center">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.role}</div>
              <div className="text-sm text-muted-foreground">{user.state}</div>
              <div className="text-sm">{user.status}</div>
              <div className="flex justify-end gap-2">
                <button className="h-8 px-3 rounded-full border border-border text-xs">View</button>
                <button className="h-8 px-3 rounded-full bg-primary text-primary-foreground text-xs">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
