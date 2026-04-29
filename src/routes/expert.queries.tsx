import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/expert/queries")({
  head: () => ({
    meta: [{ title: "Query Inbox — KrishiSathi Expert" }],
  }),
  component: ExpertQueries,
});

const mockQueries = [
  {
    id: "q1",
    farmer: "Ravi Patil",
    crop: "Wheat",
    urgency: "High",
    question: "Leaf tips are drying in 30-day-old wheat. What spray should I use?",
  },
  {
    id: "q2",
    farmer: "Sunita Kaur",
    crop: "Tomato",
    urgency: "Medium",
    question: "Fruit cracking after sudden rain. How to prevent in next cycle?",
  },
  {
    id: "q3",
    farmer: "Asha Devi",
    crop: "Paddy",
    urgency: "Low",
    question: "Which PMFBY documents are needed for claim filing?",
  },
];

function ExpertQueries() {
  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">Query Inbox</h1>
          <p className="text-muted-foreground mt-1">
            Respond to unresolved farmer questions by specialization and urgency.
          </p>
        </div>

        {mockQueries.map((q) => (
          <div key={q.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{q.farmer}</div>
                <div className="text-xs text-muted-foreground">
                  {q.crop} · {q.urgency} priority
                </div>
              </div>
              <button className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                Reply
              </button>
            </div>
            <p className="mt-3 text-sm text-foreground/90">{q.question}</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
