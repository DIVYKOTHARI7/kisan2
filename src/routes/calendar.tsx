import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [{ title: "फसल कैलेंडर — KrishiSathi" }],
  }),
  component: CalendarPage,
});

const tasks = [
  { date: 26, label: "गेहूं: पोटाश टॉप ड्रेसिंग", emoji: "🌾", done: false, crop: "Wheat" },
  { date: 27, label: "प्याज: कीट जाँच करें", emoji: "🧅", done: true, crop: "Onion" },
  { date: 30, label: "गन्ना: मिट्टी चढ़ाना + सिंचाई", emoji: "🎋", done: false, crop: "Sugarcane" },
  { date: 3, label: "मौसम: बारिश की संभावना", emoji: "🌧️", done: false, crop: "" },
  { date: 5, label: "मंडी: गेहूं बेचने का अच्छा समय", emoji: "📈", done: false, crop: "Wheat" },
];

function CalendarPage() {
  const { t } = useTranslation();
  const MONTHS = useMemo(() => t('monthsStr').split(','), [t]);
  const DAYS = useMemo(() => t('daysStr').split(','), [t]);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const taskDates = new Set(tasks.map((t) => t.date));

  function prev() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  return (
    <AppShell>
      <div className="max-w-[1600px] w-full mx-auto space-y-5">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">{t('calendarTitle')}</h1>
          <p className="text-muted-foreground mt-1">{t('calendarSubtitle')}</p>
        </div>

        {/* Calendar */}
        <div className="card-farm overflow-hidden">
          {/* Month nav */}
          <div className="bg-primary px-5 py-4 flex items-center justify-between">
            <button onClick={prev} className="size-9 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <ChevronLeft className="size-5" />
            </button>
            <div className="text-center">
              <div className="font-display font-bold text-xl text-white">{MONTHS[month]}</div>
              <div className="text-white/80 text-sm">{year}</div>
            </div>
            <button onClick={next} className="size-9 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <ChevronRight className="size-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-bold text-muted-foreground py-2">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 p-2 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
              const hasTask = taskDates.has(day);
              return (
                <div
                  key={day}
                  className={cn(
                    "aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-semibold relative cursor-pointer hover:bg-muted/50 transition-colors",
                    isToday ? "bg-primary text-white font-bold" : "text-foreground"
                  )}
                >
                  {day}
                  {hasTask && (
                    <div className={cn("size-1.5 rounded-full absolute bottom-1", isToday ? "bg-accent" : "bg-accent")} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming tasks */}
        <div>
          <h2 className="font-display font-bold text-lg text-foreground mb-3">{t('upcomingTasks')}</h2>
          <div className="space-y-3">
            {tasks.map((t) => (
              <div key={t.label} className={cn("card-farm border-l-4 p-4 flex items-center gap-4", t.done ? "border-l-success opacity-60" : "border-l-accent")}>
                <span className="text-2xl shrink-0">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base text-foreground">{t.label}</div>
                  {t.crop && <div className="text-sm text-muted-foreground mt-0.5">{t.crop}</div>}
                </div>
                <div className="text-center shrink-0">
                  <div className="font-display font-bold text-2xl text-primary">{t.date}</div>
                  <div className="text-xs text-muted-foreground">{MONTHS[month]}</div>
                </div>
                {t.done && <CheckCircle2 className="size-6 text-success shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
