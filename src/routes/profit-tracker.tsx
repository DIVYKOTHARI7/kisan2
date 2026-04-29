import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TrendingUp, TrendingDown, Plus, Trash2, Calendar as CalendarIcon, Wallet, PieChart as PieChartIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export const Route = createFileRoute("/profit-tracker")({
  head: () => ({
    meta: [{ title: "मुनाफा ट्रैकर — KrishiSathi" }],
  }),
  component: ProfitTracker,
});

interface LedgerEntry {
  id: string;
  type: "income" | "expense";
  label: string;
  amount: number;
  date: string;
  crop: string;
  emoji: string;
}

const INITIAL_LEDGER: LedgerEntry[] = [
  { id: "1", type: "income", label: "गेहूं बिक्री", amount: 45000, date: "2026-04-20", crop: "Wheat", emoji: "🌾" },
  { id: "2", type: "expense", label: "यूरिया खाद", amount: 3200, date: "2026-04-18", crop: "Wheat", emoji: "🌾" },
  { id: "3", type: "expense", label: "कीटनाशक", amount: 1800, date: "2026-04-15", crop: "Onion", emoji: "🧅" },
  { id: "4", type: "income", label: "प्याज बिक्री", amount: 28000, date: "2026-04-10", crop: "Onion", emoji: "🧅" },
  { id: "5", type: "expense", label: "सिंचाई", amount: 2500, date: "2026-04-08", crop: "Sugarcane", emoji: "🎋" },
  { id: "6", type: "expense", label: "मजदूरी", amount: 6000, date: "2026-04-05", crop: "Wheat", emoji: "🌾" },
];

const CROP_EMOJIS: Record<string, string> = {
  Wheat: "🌾",
  Rice: "🌾",
  Onion: "🧅",
  Tomato: "🍅",
  Sugarcane: "🎋",
  Potato: "🥔",
  Cotton: "☁️",
  Other: "🚜",
};

function ProfitTracker() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<LedgerEntry>>({
    type: "income",
    crop: "Wheat",
    date: new Date().toISOString().split("T")[0],
  });
  const { t } = useTranslation();

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("krishisathi_ledger");
    if (saved) {
      try {
        setLedger(JSON.parse(saved));
      } catch (e) {
        setLedger(INITIAL_LEDGER);
      }
    } else {
      setLedger(INITIAL_LEDGER);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (ledger.length > 0) {
      localStorage.setItem("krishisathi_ledger", JSON.stringify(ledger));
    }
  }, [ledger]);

  const totalIncome = useMemo(() => ledger.filter((l) => l.type === "income").reduce((s, l) => s + l.amount, 0), [ledger]);
  const totalExpense = useMemo(() => ledger.filter((l) => l.type === "expense").reduce((s, l) => s + l.amount, 0), [ledger]);
  const profit = totalIncome - totalExpense;

  const handleAddEntry = () => {
    if (!newEntry.label || !newEntry.amount) {
      toast.error(t('fillAllDetails'));
      return;
    }

    const entry: LedgerEntry = {
      id: crypto.randomUUID(),
      type: (newEntry.type as "income" | "expense") || "income",
      label: newEntry.label || "",
      amount: Number(newEntry.amount),
      date: newEntry.date || new Date().toISOString().split("T")[0],
      crop: newEntry.crop || "Other",
      emoji: CROP_EMOJIS[newEntry.crop || "Other"] || "🚜",
    };

    setLedger((prev) => [entry, ...prev]);
    setIsDialogOpen(false);
    setNewEntry({
      type: "income",
      crop: "Wheat",
      date: new Date().toISOString().split("T")[0],
    });
    toast.success(t('transactionAdded'));
  };

  const handleDeleteEntry = (id: string) => {
    setLedger((prev) => prev.filter((l) => l.id !== id));
    toast.success(t('transactionDeleted'));
  };

  // Chart data
  const pieData = [
    { name: "Income", value: totalIncome, fill: "#1A7A3C" }, // Success Green
    { name: "Expense", value: totalExpense, fill: "#C0392B" }, // Destructive Red
  ];

  const cropProfitData = useMemo(() => {
    const crops = Array.from(new Set(ledger.map(l => l.crop)));
    return crops.map(crop => {
      const income = ledger.filter(l => l.crop === crop && l.type === "income").reduce((s, l) => s + l.amount, 0);
      const expense = ledger.filter(l => l.crop === crop && l.type === "expense").reduce((s, l) => s + l.amount, 0);
      return {
        name: crop,
        income,
        expense,
        profit: income - expense
      };
    }).sort((a, b) => b.profit - a.profit);
  }, [ledger]);

  return (
    <AppShell>
      <div className="max-w-[1600px] w-full mx-auto space-y-6 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-3xl text-foreground">{t('profitTrackerTitle')}</h1>
            <p className="text-muted-foreground mt-1">{t('profitTrackerSubtitle')}</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-saffron flex items-center gap-2 px-6 h-12 text-base shadow-lg hover:scale-105 transition-transform">
                <Plus className="size-5" /> {t('addNewTransaction')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('newTransactionTitle')}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">{t('typeLabel')}</Label>
                  <Select 
                    value={newEntry.type} 
                    onValueChange={(v) => setNewEntry({...newEntry, type: v as any})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={t('select')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">{t('income')}</SelectItem>
                      <SelectItem value="expense">{t('expense')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="label" className="text-right">{t('descriptionLabel')}</Label>
                  <Input
                    id="label"
                    placeholder={t('egWheatSale')}
                    className="col-span-3"
                    value={newEntry.label || ""}
                    onChange={(e) => setNewEntry({...newEntry, label: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">{t('amountRs')}</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    className="col-span-3"
                    value={newEntry.amount || ""}
                    onChange={(e) => setNewEntry({...newEntry, amount: Number(e.target.value)})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="crop" className="text-right">{t('cropLabel')}</Label>
                  <Select 
                    value={newEntry.crop} 
                    onValueChange={(v) => setNewEntry({...newEntry, crop: v})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={t('selectCrop')} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(CROP_EMOJIS).map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">{t('dateLabel')}</Label>
                  <Input
                    id="date"
                    type="date"
                    className="col-span-3"
                    value={newEntry.date || ""}
                    onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('cancel')}</Button>
                <Button className="btn-saffron" onClick={handleAddEntry}>{t('save')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-farm p-6 border-l-4 border-l-success bg-success/5 flex flex-col justify-center items-center text-center">
            <div className="size-10 rounded-full bg-success/20 flex items-center justify-center mb-3">
              <Wallet className="size-5 text-success" />
            </div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('totalIncome')}</div>
            <div className="font-display font-bold text-2xl text-success">₹{totalIncome.toLocaleString("en-IN")}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{t('totalIncomeEn')}</div>
          </div>
          
          <div className="card-farm p-6 border-l-4 border-l-destructive bg-destructive/5 flex flex-col justify-center items-center text-center">
            <div className="size-10 rounded-full bg-destructive/20 flex items-center justify-center mb-3">
              <TrendingDown className="size-5 text-destructive" />
            </div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('totalExpense')}</div>
            <div className="font-display font-bold text-2xl text-destructive">₹{totalExpense.toLocaleString("en-IN")}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{t('totalExpenseEn')}</div>
          </div>

          <div className="card-farm p-6 border-l-4 border-l-primary bg-primary/5 flex flex-col justify-center items-center text-center shadow-md">
            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
              <TrendingUp className="size-5 text-primary" />
            </div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('netProfit')}</div>
            <div className={cn("font-display font-bold text-2xl", profit >= 0 ? "text-primary" : "text-destructive")}>
              ₹{profit.toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">{t('netProfitEn')}</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-farm p-6">
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <PieChartIcon className="size-5 text-primary" /> {t('incomeVsExpense')}
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-farm p-6">
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <BarChart className="size-5 text-primary" /> {t('profitByCrop')}
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cropProfitData}>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Profit"]}
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                  />
                  <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                    {cropProfitData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? "#1A5C38" : "#C0392B"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Ledger */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
              <CalendarIcon className="size-5 text-primary" /> {t('transactionHistory')}
            </h2>
            <div className="text-sm text-muted-foreground">
              {ledger.length} {t('transactionsFound')}
            </div>
          </div>
          
          <div className="grid gap-3">
            {ledger.length === 0 ? (
              <div className="card-farm p-12 text-center text-muted-foreground italic bg-muted/20">
                {t('noTransactionsFound')}
              </div>
            ) : (
              ledger.map((l) => (
                <div
                  key={l.id}
                  className="card-farm flex items-center gap-4 p-4 hover:shadow-md transition-all group border-2 border-transparent hover:border-primary/10"
                >
                  <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                    {l.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-base text-foreground group-hover:text-primary transition-colors">{l.label}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="bg-primary/5 px-2 py-0.5 rounded-full text-primary font-medium">{l.crop}</span>
                      <span>•</span>
                      <span>{new Date(l.date).toLocaleDateString("hi-IN", { day: 'numeric', month: 'long' })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={cn("font-display font-bold text-lg flex items-center gap-1", l.type === "income" ? "text-success" : "text-destructive")}>
                      {l.type === "income" ? "+" : "-"}₹{l.amount.toLocaleString("en-IN")}
                    </div>
                    <button 
                      onClick={() => handleDeleteEntry(l.id)}
                      className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
