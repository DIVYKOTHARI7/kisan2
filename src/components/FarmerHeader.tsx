import { Bell, Globe, Mic, Search, Moon, Sun, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "@/lib/auth";
import { clearOtpSession } from "@/lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@tanstack/react-router";

export function FarmerHeader() {
  const { theme, setTheme } = useTheme();
  const { profile, signOut, updateProfile } = useAuth();
  const { t, lang } = useTranslation();
  
  const displayName = profile?.name ?? t("farmer");
  const initials = (displayName.match(/\b\w/g) ?? ["K"]).slice(0, 2).join("").toUpperCase();

  const handleSignOut = () => {
    clearOtpSession();
    void signOut();
  };

  const { setLanguage } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = lang === "hi" ? "en" : lang === "en" ? "mr" : "hi";
    setLanguage(nextLang);
  };

  const getLangDisplay = () => {
    if (lang === "hi") return "हिन्दी";
    if (lang === "mr") return "मराठी";
    return "English";
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-background/70 border-b border-border shadow-sm">
      <div className="flex items-center gap-4 px-6 lg:px-10 h-16">
        <div className="lg:hidden flex items-center gap-2">
          <div className="size-8 rounded-xl bg-gradient-to-br from-primary to-leaf text-primary-foreground grid place-items-center font-serif font-bold shadow-md">
            K
          </div>
          <span className="font-serif font-bold text-primary">Krishi Samadhan</span>
        </div>

        <div className="hidden md:flex items-center flex-1 max-w-md ml-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              className="w-full pl-10 pr-4 h-10 rounded-full border border-input bg-card/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-sm transition-all"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-medium border border-border hover:bg-muted transition-colors shadow-sm"
            aria-label="Toggle language"
          >
            <Globe className="size-3.5" /> {getLangDisplay()}
          </button>

          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="size-9 grid place-items-center rounded-full border border-border hover:bg-muted transition-colors shadow-sm"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          <button
            className="size-9 grid place-items-center rounded-full bg-accent text-accent-foreground hover:scale-105 transition-transform shadow-md"
            aria-label="Voice assistant"
          >
            <Mic className="size-4" />
          </button>

          <button
            className="size-9 grid place-items-center rounded-full border border-border hover:bg-muted transition-colors relative shadow-sm"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            <span className="absolute top-1 right-1 size-2.5 rounded-full bg-destructive ring-2 ring-background border border-destructive" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-2 size-9 rounded-full bg-secondary text-secondary-foreground grid place-items-center font-bold text-xs shadow-sm hover:ring-2 hover:ring-primary/50 transition-all outline-none">
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-xl border-border rounded-xl shadow-lg">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-foreground">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{profile?.phone || t("farmerAccount")}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer hover:bg-muted/50 focus:bg-muted rounded-lg transition-colors flex items-center px-2 py-1.5">
                  <User className="mr-2 size-4" />
                  <span>{t("profile")}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10 rounded-lg transition-colors">
                <LogOut className="mr-2 size-4" />
                <span>{t("logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
