import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { Settings, MapPin, Calendar, Award, Phone, Mail, Edit3, ChevronRight, LogOut, Camera, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [{ title: "मेरा प्रोफाइल — KrishiSathi" }],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, signOut, updateProfile } = useAuth();
  const { t, lang } = useTranslation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    try {
      if (typeof window === "undefined") return null;
      return localStorage.getItem("krishisathi_profile_avatar");
    } catch {
      return null;
    }
  });
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(() => {
    try {
      if (typeof window === "undefined") return null;
      return localStorage.getItem("krishisathi_profile_cover");
    } catch {
      return null;
    }
  });

  const handleEditOpen = () => {
    setEditData({
      name: profile?.name || "",
      village: profile?.village || "",
      district: profile?.district || "",
      land_acres: profile?.land_acres || 0,
      soil_type: profile?.soil_type || "",
      primary_crops: profile?.primary_crops?.join(", ") || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const payload: any = { ...editData };
      
      // Clean up empty strings to avoid Pydantic min_length=1 validation errors
      Object.keys(payload).forEach(key => {
        if (typeof payload[key] === 'string' && payload[key].trim() === '') {
          delete payload[key];
        }
      });

      if (editData.land_acres !== undefined) {
        const land = Number(editData.land_acres);
        if (land > 0) {
          payload.land_acres = land;
        } else {
          delete payload.land_acres;
        }
      }

      if (editData.primary_crops) {
        payload.primary_crops = editData.primary_crops.split(",").map((c: string) => c.trim()).filter(Boolean);
        if (payload.primary_crops.length === 0) delete payload.primary_crops;
      }

      await updateProfile(payload);
      setIsEditDialogOpen(false);
      toast.success(t("save") + " successfully!");
    } catch (e) {
      toast.error(t('profileUpdateFail'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    try {
      const nextValue = !profile?.notifications_enabled;
      await updateProfile({ notifications_enabled: nextValue });
      toast.success(t("notifications") + (nextValue ? " enabled" : " disabled"));
    } catch (e) {
      toast.error(t('notificationsUpdateFail'));
    }
  };

  const handleChangeLanguage = async (lang: string) => {
    try {
      await updateProfile({ preferred_language: lang });
      toast.success(`${t("language")} changed`);
    } catch (e) {
      toast.error(t('langUpdateFail'));
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleCoverClick = () => {
    coverInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        if (type === 'avatar') {
          setAvatarUrl(url);
          try {
            localStorage.setItem("krishisathi_profile_avatar", url);
            toast.success(t('photoUpdateSuccess'));
          } catch (err) {
            toast.error(t('imageTooLarge'));
          }
        } else {
          setCoverUrl(url);
          try {
            localStorage.setItem("krishisathi_profile_cover", url);
            toast.success(t('coverUpdateSuccess'));
          } catch (err) {
            toast.error(t('imageTooLarge'));
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AppShell>
      <div className="max-w-[1600px] w-full mx-auto space-y-6 pb-20">
        {/* Profile Header */}
        <div className="card-farm p-6 relative overflow-hidden shadow-xl border-t-4 border-t-primary">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary to-primary-dark overflow-hidden group">
            {coverUrl ? (
              <img src={coverUrl} alt="Cover" className="w-full h-full object-cover opacity-80" />
            ) : (
              <div className="w-full h-full opacity-90" />
            )}
            <button 
              onClick={handleCoverClick}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/30 text-white backdrop-blur-sm border border-white/20 shadow-lg hover:bg-black/50 transition-colors opacity-80 hover:opacity-100"
              title={t('changeBackground')}
            >
              <Camera className="size-4" />
            </button>
            <input 
              type="file" 
              ref={coverInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => handleFileChange(e, 'cover')}
            />
          </div>
          <div className="relative pt-16 flex flex-col items-center">
            <div className="size-28 rounded-full bg-white p-1 border-4 border-white shadow-2xl relative group">
              <div className="w-full h-full rounded-full bg-accent flex items-center justify-center text-5xl overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile?.name?.[0]?.toUpperCase() ?? "K"
                )}
              </div>
              <button 
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 size-8 rounded-full bg-primary text-white flex items-center justify-center border-2 border-white shadow-lg hover:scale-110 transition-transform"
                title={t('changePhoto')}
              >
                <Camera className="size-4" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => handleFileChange(e, 'avatar')}
              />
            </div>
            <div className="mt-4 text-center">
              <h1 className="font-display font-bold text-3xl text-foreground leading-tight">{profile?.name || t("welcome")}</h1>
              <p className="text-muted-foreground flex items-center justify-center gap-1.5 mt-1 font-medium">
                <MapPin className="size-4 text-primary" /> {profile?.village || t("village")}, {profile?.district || t("district")}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6 w-full mt-8 border-t border-border pt-6">
              <div className="text-center group cursor-default border-r border-border">
                <div className="font-display font-bold text-2xl text-primary group-hover:scale-110 transition-transform">{profile?.land_acres || 0}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("landAcres")}</div>
              </div>
              <div className="text-center group cursor-default">
                <div className="font-display font-bold text-2xl text-primary group-hover:scale-110 transition-transform">1.2k</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("followers")}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handleEditOpen}
            className="flex-1 btn-primary-farm flex items-center justify-center gap-2 h-12 text-base shadow-md hover:shadow-lg transition-all"
          >
            <Edit3 className="size-5" /> {t("editProfile")}
          </Button>
          <Button 
            variant="outline"
            onClick={() => setIsSettingsOpen(true)}
            className="px-4 py-3 h-12 rounded-xl border-2 border-border hover:bg-muted/50 transition-all shadow-sm"
          >
            <Settings className="size-6 text-muted-foreground" />
          </Button>
        </div>

        {/* Farm Details */}
        <div className="space-y-4">
          <h2 className="font-display font-bold text-xl text-foreground px-1 flex items-center gap-2">
            <Award className="size-5 text-primary" /> {t("farmDetails")}
          </h2>
          <div className="card-farm divide-y divide-border overflow-hidden">
            {[
              { icon: MapPin, label: `${t("village")} / ${t("district")}`, value: `${profile?.village || "N/A"}, ${profile?.district || "N/A"}` },
              { icon: Award, label: t("crops"), value: profile?.primary_crops?.join(", ") || "N/A" },
              { icon: Calendar, label: t("soilType"), value: profile?.soil_type || "N/A" },
              { icon: Phone, label: t("mobile"), value: profile?.phone || "N/A" },
            ].map((item) => (
              <div key={item.label} className="p-5 flex items-center justify-between group cursor-pointer hover:bg-primary/5 transition-all">
                <div className="flex items-center gap-5">
                  <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                    <item.icon className="size-6" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{item.label}</div>
                    <div className="font-bold text-lg text-foreground">{item.value}</div>
                  </div>
                </div>
                <ChevronRight className="size-5 text-muted-foreground group-hover:translate-x-2 transition-transform" />
              </div>
            ))}
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display font-bold">{t("editProfile")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t("name")}</Label>
                <Input 
                  id="name" 
                  value={editData.name} 
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="village">{t("village")}</Label>
                  <Input 
                    id="village" 
                    value={editData.village} 
                    onChange={(e) => setEditData({...editData, village: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="district">{t("district")}</Label>
                  <Input 
                    id="district" 
                    value={editData.district} 
                    onChange={(e) => setEditData({...editData, district: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="land">{t("landAcres")}</Label>
                  <Input 
                    id="land" 
                    type="number"
                    value={editData.land_acres} 
                    onChange={(e) => setEditData({...editData, land_acres: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="soil">{t("soilType")}</Label>
                  <Input 
                    id="soil" 
                    value={editData.soil_type} 
                    onChange={(e) => setEditData({...editData, soil_type: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="crops">{t("crops")}</Label>
                <Input 
                  id="crops" 
                  value={editData.primary_crops} 
                  onChange={(e) => setEditData({...editData, primary_crops: e.target.value})}
                  placeholder={t('cropsPlaceholder')}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl">{t("cancel")}</Button>
              <Button onClick={handleSaveProfile} disabled={loading} className="btn-saffron rounded-xl px-8 shadow-md">
                {loading ? "..." : t("save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display font-bold">{t("settings")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div 
                onClick={handleToggleNotifications}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                    <Mail className="size-5" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{t("notifications")}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {t('notificationsDescProfile')}
                    </div>
                  </div>
                </div>
                <div className={cn(
                  "w-12 h-6 rounded-full relative transition-colors duration-200",
                  profile?.notifications_enabled ? "bg-primary" : "bg-muted"
                )}>
                  <div className={cn(
                    "absolute top-1 size-4 bg-white rounded-full shadow-sm transition-all duration-200",
                    profile?.notifications_enabled ? "right-1" : "left-1"
                  )} />
                </div>
              </div>
              
              <div className="p-3 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <Settings className="size-5" />
                  </div>
                  <div className="font-bold text-foreground">{t("language")}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 pl-13">
                  <Button 
                    variant={lang === "hi" ? "default" : "outline"}
                    onClick={() => handleChangeLanguage("hi")}
                    className={cn("rounded-xl h-9", lang === "hi" && "bg-primary")}
                  >
                    हिन्दी
                  </Button>
                  <Button 
                    variant={lang === "en" ? "default" : "outline"}
                    onClick={() => handleChangeLanguage("en")}
                    className={cn("rounded-xl h-9", lang === "en" && "bg-primary")}
                  >
                    English
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)} className="w-full rounded-xl">{t("cancel")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Logout */}
        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-3 font-bold text-destructive py-4 rounded-xl border-2 border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-all mt-4 shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          <LogOut className="size-5" /> {t("logout")}
        </button>
      </div>
    </AppShell>
  );
}
