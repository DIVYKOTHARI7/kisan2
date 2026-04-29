import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Heart, MessageCircle, Share2, Camera, Video, Plus, MoreHorizontal, Image, Send, X, Bookmark, BookmarkCheck, Users, TrendingUp, Search } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "कृषि चर्चा — KrishiSathi" },
      { name: "description", content: "किसानों का अपना समुदाय। फोटो और वीडियो साझा करें।" },
    ],
  }),
  component: CommunityPage,
});

type Comment = { id: number; author: string; avatar: string; text: string; time: string };
type Post = {
  id: number; author: string; avatar: string; location: string; time: string;
  content: string; image?: string; video?: string; tag: string; tagColor: string;
  likes: number; liked: boolean; saved: boolean;
  comments: Comment[]; showComments: boolean;
};

const AVATARS = ["👨‍🌾", "👩‍🌾", "🧑‍🌾", "👴", "👵", "🧑"];
const TAGS: Record<string, string> = {
  "सफलता": "bg-green-100 text-green-700",
  "सलाह": "bg-blue-100 text-blue-700",
  "प्रश्न": "bg-orange-100 text-orange-700",
  "मौसम": "bg-sky-100 text-sky-700",
  "तकनीक": "bg-purple-100 text-purple-700",
  "बाज़ार": "bg-yellow-100 text-yellow-700",
};

const INITIAL_POSTS: Post[] = [
  {
    id: 1, author: "रमेश कुमार", avatar: "👨‍🌾", location: "पुणे, महाराष्ट्र", time: "2 घंटे पहले",
    content: "इस साल गेहूं की फसल बहुत अच्छी रही! 🌾 DAP और यूरिया की सही मात्रा और समय पर सिंचाई की वजह से प्रति बीघे 18 क्विंटल तक उपज मिली। सभी किसान भाइयों को बधाई!",
    image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80",
    tag: "सफलता", tagColor: TAGS["सफलता"], likes: 142, liked: false, saved: false,
    showComments: false,
    comments: [
      { id: 1, author: "सुनीता देवी", avatar: "👩‍🌾", text: "बहुत बढ़िया! कौन सी किस्म का गेहूं बोया था?", time: "1 घंटे पहले" },
      { id: 2, author: "मोहन लाल", avatar: "👴", text: "शाबाश भाई! हमारे इलाके में भी 15 क्विंटल आई।", time: "45 मिनट पहले" },
    ],
  },
  {
    id: 2, author: "सुनीता देवी", avatar: "👩‍🌾", location: "नासिक, महाराष्ट्र", time: "5 घंटे पहले",
    content: "प्याज की फसल में पत्तियां पीली हो रही हैं। क्या कोई बता सकता है इसकी क्या वजह हो सकती है? मैंने पानी भी समय पर दिया है। किसी ने ऐसा अनुभव किया है? 🙏",
    tag: "प्रश्न", tagColor: TAGS["प्रश्न"], likes: 38, liked: false, saved: false,
    showComments: false,
    comments: [
      { id: 3, author: "अग्रोनोमिस्ट सिंह", avatar: "🧑‍🌾", text: "यह Thrips का असर हो सकता है। Spinosad 45% SC का स्प्रे करें।", time: "4 घंटे पहले" },
      { id: 4, author: "रमेश कुमार", avatar: "👨‍🌾", text: "पोटाश की कमी भी हो सकती है। मिट्टी परीक्षण कराएं।", time: "3 घंटे पहले" },
    ],
  },
  {
    id: 3, author: "मोहन लाल", avatar: "👴", location: "इंदौर, मध्य प्रदेश", time: "1 दिन पहले",
    content: "सोयाबीन की जैविक खेती शुरू की है इस साल। वर्मीकम्पोस्ट और जीवामृत का उपयोग कर रहा हूँ। उम्मीद है बढ़िया उपज मिलेगी! 🌱 कोई और जैविक किसान है यहाँ?",
    image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80",
    tag: "तकनीक", tagColor: TAGS["तकनीक"], likes: 95, liked: false, saved: false,
    showComments: false,
    comments: [
      { id: 5, author: "गीता बाई", avatar: "👵", text: "जैविक खेती सही दिशा है! हम भी कर रहे हैं। 👍", time: "20 घंटे पहले" },
    ],
  },
  {
    id: 4, author: "किसान कृष्णा", avatar: "🧑‍🌾", location: "जयपुर, राजस्थान", time: "2 दिन पहले",
    content: "आज मंडी में सरसों का भाव ₹5,400/क्विंटल था जो पिछले हफ्ते से ₹200 ज़्यादा है। बेचने का सही समय है किसान भाइयों! 📈",
    tag: "बाज़ार", tagColor: TAGS["बाज़ार"], likes: 210, liked: false, saved: true,
    showComments: false,
    comments: [
      { id: 6, author: "विनोद शर्मा", avatar: "👨‍🌾", text: "धन्यवाद भाई! हम भी कल मंडी जाएंगे।", time: "1 दिन पहले" },
      { id: 7, author: "सुनीता देवी", avatar: "👩‍🌾", text: "हमारे यहाँ ₹5,200 ही मिला।", time: "1 दिन पहले" },
    ],
  },
  {
    id: 5, author: "गीता बाई", avatar: "👵", location: "अकोला, महाराष्ट्र", time: "3 दिन पहले",
    content: "ड्रिप इरिगेशन लगवाने के बाद पानी की खपत 40% कम हो गई और कपास की उपज 20% बढ़ गई! PM-KUSUM योजना की मदद से सोलर पंप भी लगाया। सरकारी योजनाओं का जरूर फायदा उठाएं।",
    image: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80",
    tag: "सफलता", tagColor: TAGS["सफलता"], likes: 178, liked: false, saved: false,
    showComments: false,
    comments: [],
  },
  {
    id: 6, author: "विशेषज्ञ सुनील", avatar: "🧑", location: "कृषि विज्ञान केंद्र", time: "4 दिन पहले",
    content: "ड्रोन की मदद से कीटनाशक छिड़काव का आधुनिक तरीका। समय और दवा दोनों की बचत! 🚁✨ #AgriTech",
    video: "https://assets.mixkit.co/videos/preview/mixkit-spraying-crops-with-a-drone-41444-large.mp4",
    tag: "तकनीक", tagColor: TAGS["तकनीक"], likes: 320, liked: false, saved: false,
    showComments: false,
    comments: [
      { id: 8, author: "रमेश कुमार", avatar: "👨‍🌾", text: "क्या इसके लिए लाइसेंस की जरूरत होती है?", time: "2 दिन पहले" },
    ],
  },
];

const TRENDING = [
  { tag: "#गेहूंकिसान", posts: 1240 },
  { tag: "#जैविकखेती", posts: 890 },
  { tag: "#मंडीभाव", posts: 650 },
  { tag: "#कपास2024", posts: 430 },
];

function relTime(t: string) { return t; }

function CommunityPage() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [newPost, setNewPost] = useState("");
  const [newTag, setNewTag] = useState("सफलता");
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; file: File; type: 'image' | 'video' } | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"feed" | "trending" | "saved">("feed");
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const handleMedia = (file?: File | null, type: 'image' | 'video' = 'image') => {
    if (!file) return;
    setSelectedMedia({ url: URL.createObjectURL(file), file, type });
  };

  const handlePost = () => {
    if (!newPost.trim() && !selectedMedia) return;
    const post: Post = {
      id: Date.now(), author: "आप", avatar: "👨‍🌾", location: "भारत",
      time: t('justNow'), content: newPost.trim() || t('mediaShared'),
      image: selectedMedia?.type === 'image' ? selectedMedia.url : undefined,
      video: selectedMedia?.type === 'video' ? selectedMedia.url : undefined,
      tag: newTag, tagColor: TAGS[newTag] ?? TAGS["सफलता"],
      likes: 0, liked: false, saved: false, showComments: false, comments: [],
    };
    setPosts(p => [post, ...p]);
    setNewPost(""); setSelectedMedia(null);
    toast.success(t('postSharedSuccess'));
  };

  const toggleLike = (id: number) => {
    setPosts(p => p.map(post => post.id === id
      ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
      : post));
  };

  const toggleSave = (id: number) => {
    setPosts(p => p.map(post => {
      if (post.id !== id) return post;
      toast.success(post.saved ? t('removed') : t('postSaved'));
      return { ...post, saved: !post.saved };
    }));
  };

  const toggleComments = (id: number) => {
    setPosts(p => p.map(post => post.id === id ? { ...post, showComments: !post.showComments } : post));
  };

  const addComment = (id: number, text: string) => {
    if (!text.trim()) return;
    const comment: Comment = { id: Date.now(), author: "आप", avatar: "👨‍🌾", text: text.trim(), time: t('justNow') };
    setPosts(p => p.map(post => post.id === id
      ? { ...post, comments: [...post.comments, comment], showComments: true }
      : post));
  };

  const handleShare = (post: Post) => {
    if (navigator.share) {
      navigator.share({ title: post.author, text: post.content, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(t('linkCopied'));
    }
  };

  const filtered = posts.filter(p => {
    if (activeTab === "saved") return p.saved;
    if (search) return p.content.includes(search) || p.author.includes(search) || p.tag.includes(search);
    return true;
  });

  return (
    <AppShell>
      <div className="max-w-[1600px] w-full mx-auto pb-24 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-3xl text-foreground">{t('communityTitle')}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{posts.length} {t('postsCount')} · {posts.reduce((a, p) => a + p.likes, 0)} {t('likesCount')}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
              <Users className="size-3" /> {1240 + posts.length} {t('farmers')}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchPosts')} className="w-full h-11 bg-white border-2 border-border rounded-xl pl-9 pr-4 text-sm focus:outline-none focus:border-primary shadow-sm" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { id: "feed", label: t('feedTab') },
            { id: "trending", label: t('trendingTab') },
            { id: "saved", label: `${t('savedTab')} (${posts.filter(p=>p.saved).length})` },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={cn("flex-1 py-2 px-3 rounded-full text-sm font-bold transition-all border-2",
                activeTab === tab.id ? "bg-primary text-white border-primary" : "bg-white border-border text-muted-foreground hover:border-primary/40")}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Trending Tags */}
        {activeTab === "trending" && (
          <div className="bg-white border-2 border-border rounded-2xl p-4 shadow-sm">
            <h2 className="font-bold text-base mb-3 flex items-center gap-2"><TrendingUp className="size-4 text-orange-500" /> {t('trendingTopics')}</h2>
            <div className="space-y-3">
              {TRENDING.map((t, i) => (
                <div key={t.tag} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground">{i + 1}</span>
                    <div>
                      <p className="font-bold text-sm text-primary">{t.tag}</p>
                      <p className="text-xs text-muted-foreground">{t.posts.toLocaleString()} {t('postsCount')}</p>
                    </div>
                  </div>
                  <button onClick={() => setSearch(t.tag.replace("#", ""))} className="text-xs font-bold text-primary border border-primary/30 px-3 py-1 rounded-full hover:bg-primary/5">{t('view')}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Post */}
        <div className="bg-white border-2 border-border rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-xl shrink-0">👨‍🌾</div>
            <textarea value={newPost} onChange={e => setNewPost(e.target.value)}
              placeholder={t('shareSomething')}
              className="flex-1 bg-muted/30 rounded-xl border border-border px-4 py-3 text-sm resize-none outline-none focus:border-primary transition-colors min-h-[80px]" />
          </div>

          {selectedMedia && (
            <div className="relative rounded-xl overflow-hidden bg-black/5 min-h-[100px] flex items-center justify-center">
              {selectedMedia.type === 'image' ? (
                <img src={selectedMedia.url} alt="preview" className="w-full max-h-64 object-contain" />
              ) : (
                <video src={selectedMedia.url} className="w-full max-h-64 object-contain" controls muted />
              )}
              <button onClick={() => setSelectedMedia(null)} className="absolute top-2 right-2 size-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors z-10">
                <X className="size-4" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-2">
              <button onClick={() => galleryRef.current?.click()} className="flex items-center gap-1.5 text-xs font-bold py-2 px-3 border-2 border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                <Image className="size-4" /> {t('photo')}
              </button>
              <button onClick={() => videoRef.current?.click()} className="flex items-center gap-1.5 text-xs font-bold py-2 px-3 border-2 border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                <Video className="size-4" /> {t('video')}
              </button>
              <button onClick={() => cameraRef.current?.click()} className="flex items-center gap-1.5 text-xs font-bold py-2 px-3 border-2 border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                <Camera className="size-4" /> {t('camera')}
              </button>
              <select value={newTag} onChange={e => setNewTag(e.target.value)} className="text-xs font-bold py-2 px-3 border-2 border-border rounded-xl bg-white outline-none focus:border-primary">
                {Object.keys(TAGS).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <button onClick={handlePost} disabled={!newPost.trim() && !selectedMedia}
              className="btn-saffron px-5 py-2 flex items-center gap-2 text-sm rounded-xl disabled:opacity-50">
              <Plus className="size-4" /> {t('postBtn')}
            </button>
          </div>
        </div>

        <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={e => handleMedia(e.target.files?.[0], 'image')} />
        <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => handleMedia(e.target.files?.[0], 'video')} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleMedia(e.target.files?.[0], 'image')} />

        {/* Posts Feed */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-2xl border-2 border-dashed border-border">
            <div className="text-5xl mb-3">📭</div>
            <p className="font-bold">{t('noPostsFound')}</p>
            <button onClick={() => { setSearch(""); setActiveTab("feed"); }} className="text-primary font-bold mt-2 text-sm hover:underline">{t('showAll')}</button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(post => <PostCard key={post.id} post={post} onLike={toggleLike} onSave={toggleSave} onComment={toggleComments} onAddComment={addComment} onShare={handleShare} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function PostCard({ post, onLike, onSave, onComment, onAddComment, onShare }: {
  post: Post;
  onLike: (id: number) => void;
  onSave: (id: number) => void;
  onComment: (id: number) => void;
  onAddComment: (id: number, text: string) => void;
  onShare: (p: Post) => void;
}) {
  const { t } = useTranslation();
  const [commentText, setCommentText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const submit = () => {
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText);
    setCommentText("");
  };

  return (
    <div className="bg-white border-2 border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center text-2xl border-2 border-primary/20">{post.avatar}</div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm text-foreground">{post.author}</p>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", post.tagColor)}>{post.tag}</span>
            </div>
            <p className="text-xs text-muted-foreground">📍 {post.location} · {post.time}</p>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground">
            <MoreHorizontal className="size-5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 bg-white border-2 border-border rounded-xl shadow-xl z-10 py-1 w-36">
              <button onClick={() => { onSave(post.id); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-muted/50 flex items-center gap-2">
                {post.saved ? <BookmarkCheck className="size-4 text-primary" /> : <Bookmark className="size-4" />} {post.saved ? t('removePost') : t('savePost')}
              </button>
              <button onClick={() => { onShare(post); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-muted/50 flex items-center gap-2">
                <Share2 className="size-4" /> {t('sharePost')}
              </button>
              <button onClick={() => { toast.success(t('reportSent')); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-muted/50 text-red-600">
                {t('report')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-foreground/90 leading-relaxed">{post.content}</p>
      </div>

      {/* Image */}
      {post.image && (
        <div className="relative overflow-hidden bg-muted">
          <img src={post.image} alt="post" className="w-full object-cover max-h-[500px]"
            onError={e => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80"; }} />
        </div>
      )}

      {/* Video */}
      {post.video && (
        <div className="relative overflow-hidden bg-black group/video">
          <video 
            src={post.video} 
            className="w-full max-h-[600px] object-contain" 
            controls 
            loop 
            muted 
            playsInline
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-border/60">
        <div className="flex items-center gap-5">
          <button onClick={() => onLike(post.id)} className={cn("flex items-center gap-1.5 text-sm font-bold transition-colors", post.liked ? "text-red-500" : "text-muted-foreground hover:text-red-500")}>
            <Heart className={cn("size-5 transition-transform hover:scale-110", post.liked && "fill-red-500")} /> {post.likes}
          </button>
          <button onClick={() => onComment(post.id)} className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
            <MessageCircle className="size-5 hover:scale-110 transition-transform" /> {post.comments.length}
          </button>
          <button onClick={() => onShare(post)} className="text-muted-foreground hover:text-primary transition-colors">
            <Share2 className="size-5 hover:scale-110 transition-transform" />
          </button>
        </div>
        <button onClick={() => onSave(post.id)} className={cn("transition-colors", post.saved ? "text-primary" : "text-muted-foreground hover:text-primary")}>
          {post.saved ? <BookmarkCheck className="size-5" /> : <Bookmark className="size-5" />}
        </button>
      </div>

      {/* Comments */}
      {post.showComments && (
        <div className="px-4 pb-4 border-t border-border/60 space-y-3 pt-3">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {post.comments.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">{t('commentFirst')}</p>}
            {post.comments.map(c => (
              <div key={c.id} className="flex items-start gap-2">
                <div className="size-7 rounded-full bg-muted flex items-center justify-center text-sm shrink-0">{c.avatar}</div>
                <div className="bg-muted/40 rounded-xl px-3 py-2 flex-1">
                  <p className="text-xs font-bold text-foreground">{c.author} <span className="font-normal text-muted-foreground">{c.time}</span></p>
                  <p className="text-xs text-foreground/90 mt-0.5">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-sm shrink-0">👨‍🌾</div>
            <input value={commentText} onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder={t('writeComment')} className="flex-1 bg-muted/30 rounded-xl px-3 py-2 text-sm border border-border outline-none focus:border-primary" />
            <button onClick={submit} disabled={!commentText.trim()} className="p-2 rounded-xl bg-primary text-white disabled:opacity-50 hover:bg-primary/90 transition-colors">
              <Send className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
