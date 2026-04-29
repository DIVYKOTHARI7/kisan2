import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Droplets, Thermometer, Wind, CheckCircle2, AlertTriangle, Power } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/irrigation-tracker")({
  head: () => ({
    meta: [{ title: "सिंचाई ट्रैकर — KrishiSathi" }],
  }),
  component: IrrigationTracker,
});

const sensors = [
  { id: "S1", field: "Field A (Wheat)", moisture: 42, threshold: 30, status: "Normal", active: true },
  { id: "S2", field: "Field B (Onion)", moisture: 28, threshold: 35, status: "Critical", active: true },
  { id: "S3", field: "Field C (Sugarcane)", moisture: 65, threshold: 40, status: "Healthy", active: true },
];

function IrrigationTracker() {
  return (
    <AppShell>
      <div className="max-w-2xl lg:max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">💧 सिंचाई ट्रैकर</h1>
          <p className="text-muted-foreground mt-1">Irrigation Tracker — Smart water management</p>
        </div>

        {/* Summary Card */}
        <div className="card-farm bg-primary text-white p-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Droplets className="size-32" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-widest text-xs">
              <span className="size-2 rounded-full bg-accent animate-pulse" />
              Live Sensor Data
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-4xl font-display font-bold">42%</div>
                <div className="text-white/70 text-sm">औसत मिट्टी की नमी</div>
              </div>
              <div>
                <div className="text-4xl font-display font-bold">12L</div>
                <div className="text-white/70 text-sm">आज का पानी उपयोग</div>
              </div>
            </div>
            <div className="flex gap-4 pt-4 border-t border-white/20">
              <div className="flex items-center gap-2 text-sm">
                <Thermometer className="size-4" /> 28°C
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Wind className="size-4" /> 15 km/h
              </div>
            </div>
          </div>
        </div>

        {/* Sensor Grid */}
        <div>
          <h2 className="font-display font-bold text-lg text-foreground mb-3">📡 सेंसर की स्थिति / Sensor Status</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {sensors.map((s) => (
              <div key={s.id} className="card-farm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-muted-foreground uppercase">{s.id} · {s.field}</div>
                  <div className={cn(
                    "size-3 rounded-full",
                    s.status === "Healthy" ? "bg-success" : s.status === "Normal" ? "bg-warning" : "bg-destructive"
                  )} />
                </div>
                <div className="text-center py-2">
                  <div className={cn(
                    "text-5xl font-display font-bold",
                    s.status === "Critical" ? "text-destructive" : "text-primary"
                  )}>
                    {s.moisture}%
                  </div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Moisture Level</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">न्यूनतम स्तर (Threshold)</span>
                    <span className="font-bold text-foreground">{s.threshold}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden border border-border">
                    <div
                      className={cn("h-full rounded-full transition-all duration-1000", s.status === "Critical" ? "bg-destructive" : "bg-primary")}
                      style={{ width: `${s.moisture}%` }}
                    />
                  </div>
                </div>
                <button className={cn(
                  "w-full flex items-center justify-center gap-2 font-bold text-sm py-2.5 rounded-lg border-2 transition-all",
                  s.status === "Critical" ? "bg-destructive text-white border-destructive shadow-md" : "bg-white text-primary border-primary/20 hover:border-primary"
                )}>
                  <Power className="size-4" /> {s.status === "Critical" ? "अभी पानी दें / Water Now" : "पंप चालू करें"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className="card-farm p-5">
          <h3 className="font-display font-bold text-lg text-foreground mb-4">📅 सिंचाई का समय / Next Schedule</h3>
          <div className="space-y-3">
            {[
              { time: "आज, 6:00 PM", field: "Field A", type: "स्वचालित (Auto)", icon: <CheckCircle2 className="size-5 text-success" /> },
              { time: "कल, 8:00 AM", field: "Field B", type: "मैन्युअल (Manual)", icon: <AlertTriangle className="size-5 text-warning" /> },
            ].map((item) => (
              <div key={item.field} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-border">
                    <Droplets className="size-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground">{item.field}</div>
                    <div className="text-xs text-muted-foreground">{item.time}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.type}</span>
                  {item.icon}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
