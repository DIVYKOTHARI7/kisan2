import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { resolvePlan, resolveRole } from "@/lib/rbac";
import { incrementFeatureUsage, isQuotaExceeded } from "@/lib/usage";
import { askGemini } from "@/lib/gemini";
import { askGroq } from "@/lib/groq";
import { useTranslation } from "@/hooks/useTranslation";
import { API_BASE, getApiTokens, SHOULD_MOCK } from "@/lib/api";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Kisan Mitra AI — Smart Agriculture Assistant" },
      { name: "description", content: "Kisan Mitra — aapka AI farming sahayak!" },
    ],
  }),
  component: Chat,
});

type Message = { id: string; role: "user" | "assistant"; content: string; hasImage?: boolean };

function Chat() {
  const { user, profile } = useAuth();
  const role = resolveRole(profile, user);
  const plan = resolvePlan(profile, role);
  const { t } = useTranslation();
  
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: "init", role: "assistant", content: t('chatInitBody') || "नमस्ते! मैं आपका किसान मित्र हूँ। मैं आपकी खेती में मदद कर सकता हूँ।" }
  ]);

  const generateId = () => {
    try {
      return crypto.randomUUID();
    } catch (e) {
      return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
  };
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ base64: string; type: string } | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isHindiText = (text: string) => /[\u0900-\u097F]/.test(text);

  useEffect(() => {
    const firstName = profile?.name?.split(" ")[0] ?? "Kisan";
    const initMsg: Message = {
      id: "init",
      role: "assistant",
      content: t('chatInitHello').replace('{name}', firstName) + t('chatInitBody'),
    };

    async function loadHistory() {
      if (!user) return;
      const { data: convos } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (convos && convos.length > 0) {
        const cid = convos[0].id;
        setConversationId(cid);
        const { data: msgs } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("conversation_id", cid)
          .order("created_at", { ascending: true })
          .limit(100);

        if (msgs && msgs.length > 0) {
          const mapped: Message[] = msgs.map(m => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
          }));
          setMessages([initMsg, ...mapped]);
          return;
        }
      }
      setMessages([initMsg]);
    }
    loadHistory();
  }, [profile?.name, user?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  async function ensureConversation(): Promise<string | null> {
    if (conversationId) return conversationId;
    if (!user) return null;
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({ user_id: user.id, title: "Kisan Mitra chat" })
      .select("id")
      .single();
    if (error) { toast.error(t('chatStartError')); return null; }
    setConversationId(data.id);
    return data.id;
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSelectedImage({
        base64: result.split(",")[1],
        type: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  async function sendMessage(textOverride?: string) {
    const text = textOverride || input;
    const trimmed = text.trim();
    if (!trimmed && !selectedImage) return;
    if (streaming) return;

    if (isQuotaExceeded("chatbot", plan)) {
      toast.error(t('chatQuotaExceeded'));
      return;
    }

    const userMsg: Message = { 
      id: generateId(), 
      role: "user", 
      content: trimmed,
      hasImage: !!selectedImage 
    };
    
    // Add user message to UI immediately
    setMessages((m) => [...m, userMsg]);
    
    const assistantId = generateId();
    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "..." }]);
    
    setInput("");
    setStreaming(true);

    const convoId = await ensureConversation();
    if (convoId && user?.id) {
      void supabase.from("chat_messages").insert({ 
        conversation_id: convoId, 
        user_id: user.id, 
        role: "user", 
        content: trimmed + (selectedImage ? t('imageAttachedMsg') : "") 
      });
    }

    try {
      let fullReply = "";

      // Guaranteed response: Race between AI and a 3-second timeout that triggers the mock
      const aiPromise = (async () => {
        try {
          const history = messages.filter(m => m.id !== "init").map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content
          }));
          const reply = await askGroq(trimmed, history);
          return reply;
        } catch (e) {
          return null;
        }
      })();

      const timeoutPromise = new Promise<null>(r => setTimeout(() => r(null), 3000));

      let groqReply = await Promise.race([aiPromise, timeoutPromise]);

      if (!groqReply) {
        // Fallback to high-quality mock answers immediately
        console.warn("AI slow or failed, using fast fallback");
        let mockResponseText = "नमस्ते! मैं आपका कृषि समाधान AI हूँ।";
        
        if (trimmed.includes("फसल सुझाव")) {
          mockResponseText = "**फसल सुझाव:** अभी के मौसम में गेहूं या सरसों की बुवाई फायदेमंद है। सही बीज का चुनाव करें। 🌾";
        } else if (trimmed.includes("बीमारी निदान")) {
          mockResponseText = "**बीमारी निदान:** अपनी फसल की फोटो यहाँ भेजें। नीम के तेल का छिड़काव एक सुरक्षित उपाय है। 🔬";
        } else if (trimmed.includes("खाद")) {
          mockResponseText = "**खाद मार्गदर्शन:** मिट्टी स्वास्थ्य कार्ड के अनुसार संतुलित खाद (DAP/Urea) का प्रयोग करें। 🧪";
        } else if (trimmed.includes("योजना")) {
          mockResponseText = "**सरकारी योजना:** PM-Kisan और फसल बीमा योजना का लाभ लेने के लिए नजदीकी कृषि केंद्र जाएं। 🏛️";
        } else {
          mockResponseText = "क्षमा करें, AI सेवा अभी व्यस्त है। लेकिन मैं आपकी खेती में मदद करने के लिए यहाँ हूँ। क्या आप कुछ और पूछना चाहेंगे?";
        }
        
        groqReply = mockResponseText;
      }

      // Typing animation for the chosen reply
      fullReply = "";
      const words = groqReply.split(" ");
      for (const word of words) {
        await new Promise(r => setTimeout(r, 10));
        fullReply += word + " ";
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullReply } : m));
      }

      if (convoId && user?.id && fullReply) {
        void supabase.from("chat_messages").insert({ 
          conversation_id: convoId, 
          user_id: user.id, 
          role: "assistant", 
          content: fullReply 
        });
      }
      incrementFeatureUsage("chatbot");
    } catch (err) {
      console.error("Critical chat error:", err);
    } finally {
      setStreaming(false);
      clearImage();
    }
  }

  const formatText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const isListItem = line.startsWith('• ') || line.startsWith('- ');
      const content = isListItem ? line.substring(2) : line;
      
      // Basic markdown parsing for **bold** and *italic*
      const parts = content.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={j}>{part.slice(1, -1)}</em>;
        }
        return part;
      });

      if (isListItem) return <li key={i} className="ml-4 list-disc">{parts}</li>;
      return <p key={i} className="min-h-[1.2em]">{parts}</p>;
    });
  };

  const quickChips = [
    { label: t('quickFasalTitle'), text: t('quickFasalText') },
    { label: t('quickBimariTitle'), text: t('quickBimariText') },
    { label: t('quickKhadTitle'), text: t('quickKhadText') },
    { label: t('quickSinchaiTitle'), text: t('quickSinchaiText') },
    { label: t('quickYojanaTitle'), text: t('quickYojanaText') },
    { label: t('quickMausamTitle'), text: t('quickMausamText') },
    { label: t('quickOrganicTitle'), text: t('quickOrganicText') }
  ];

  return (
    <AppShell>
      <style>{`
        :root {
          --green-50:  #f0f9eb;
          --green-100: #d9f0c4;
          --green-200: #b5e08e;
          --green-400: #78c43e;
          --green-600: #4a8f1f;
          --green-800: #2b5510;
          --green-900: #172d07;
          --earth-50:  #fdf6ee;
          --earth-100: #f5e2c4;
          --earth-400: #c98f47;
          --earth-600: #9b6320;
          --sky-50:    #eaf5fb;
          --sky-400:   #3ba3d4;
          --red-50:    #fff0f0;
          --red-400:   #e05252;
          --gray-50:   #f8f8f6;
          --gray-100:  #efefec;
          --gray-200:  #ddddd8;
          --gray-400:  #9a9990;
          --gray-600:  #5e5d58;
          --gray-900:  #1a1a17;
          --radius-sm: 8px;
          --radius-md: 14px;
          --radius-lg: 22px;
          --shadow-card: 0 2px 16px rgba(0,0,0,0.07);
        }

        .kisan-app-wrapper {
          position: relative; z-index: 1;
          width: 100%; max-width: 1600px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: 0 8px 48px rgba(0,0,0,0.13);
          background: #fff;
          height: calc(100vh - 10rem);
        }

        .kisan-header {
          background: linear-gradient(135deg, var(--green-800) 0%, var(--green-600) 60%, #5fa830 100%);
          padding: 1rem 1.4rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          position: relative;
        }
        .kisan-header::after {
          content: '🌾';
          position: absolute; right: 1rem; top: 50%;
          transform: translateY(-50%);
          font-size: 48px;
          opacity: 0.12;
          pointer-events: none;
        }
        .kisan-header-icon {
          width: 48px; height: 48px;
          border-radius: 50%;
          background: rgba(255,255,255,0.18);
          border: 2px solid rgba(255,255,255,0.35);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .kisan-header-text h1 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }
        .kisan-header-text p {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.72);
          margin-top: 1px;
        }
        .kisan-status-dot {
          display: inline-block;
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #7effa0;
          margin-right: 5px;
          animation: kisan-pulse-dot 2s infinite;
        }
        @keyframes kisan-pulse-dot {
          0%,100%{opacity:1} 50%{opacity:0.4}
        }

        .kisan-chips-section {
          background: var(--green-50);
          border-bottom: 1px solid var(--green-100);
          padding: 0.6rem 1rem;
          overflow-x: auto;
        }
        .kisan-chips-label {
          font-size: 0.65rem;
          color: var(--green-600);
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 0.4rem;
        }
        .kisan-chips-row {
          display: flex;
          gap: 7px;
          padding-bottom: 4px;
        }
        .kisan-chip {
          font-size: 0.75rem;
          padding: 6px 12px;
          border-radius: 20px;
          cursor: pointer;
          border: 1.5px solid var(--green-200);
          background: #fff;
          color: var(--green-800);
          font-weight: 600;
          transition: all 0.16s;
          white-space: nowrap;
        }
        .kisan-chip:hover {
          background: var(--green-600);
          color: #fff;
          border-color: var(--green-600);
          transform: translateY(-1px);
        }

        .kisan-chat-area {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #fdfdfc;
        }
        .kisan-msg-row {
          display: flex;
          gap: 10px;
          align-items: flex-end;
          animation: kisan-msg-in 0.25s ease;
        }
        @keyframes kisan-msg-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .kisan-msg-row.kisan-user-row { flex-direction: row-reverse; }

        .kisan-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 600;
          flex-shrink: 0;
        }
        .kisan-bot-avatar { background: var(--green-100); color: var(--green-800); }
        .kisan-user-avatar { background: var(--earth-100); color: var(--earth-600); }

        .kisan-bubble {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          line-height: 1.6;
        }
        .kisan-bot-bubble {
          background: #fff;
          border: 1.5px solid var(--gray-100);
          color: var(--gray-900);
          border-radius: 4px var(--radius-md) var(--radius-md) var(--radius-md);
          box-shadow: var(--shadow-card);
        }
        .kisan-user-bubble {
          background: var(--green-600);
          color: #fff;
          border-radius: var(--radius-md) 4px var(--radius-md) var(--radius-md);
        }
        .kisan-bubble strong { color: var(--green-800); }
        .kisan-user-bubble strong { color: #fff; }

        .kisan-typing-bubble {
          display: flex; gap: 4px; padding: 12px 16px;
        }
        .kisan-typing-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--green-400);
          animation: kisan-typing 1.2s infinite;
        }
        .kisan-typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .kisan-typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes kisan-typing {
          0%,60%,100%{transform:translateY(0);opacity:0.5}
          30%{transform:translateY(-6px);opacity:1}
        }

        .kisan-input-section {
          padding: 1rem;
          background: #fff;
          border-top: 1.5px solid var(--gray-100);
        }
        .kisan-input-row {
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }
        .kisan-input-box {
          flex: 1;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          border: 1.5px solid var(--gray-200);
          background: var(--gray-50);
          font-size: 0.875rem;
          min-height: 44px;
          max-height: 100px;
          resize: none;
          outline: none;
          transition: border-color 0.16s;
        }
        .kisan-input-box:focus { border-color: var(--green-400); background: #fff; }

        .kisan-send-btn {
          width: 44px; height: 44px;
          border-radius: 50%;
          background: var(--green-600);
          border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: white;
          transition: background 0.15s, transform 0.1s;
          box-shadow: 0 2px 8px rgba(74,143,31,0.3);
        }
        .kisan-send-btn:hover { background: var(--green-800); transform: scale(1.05); }

        .kisan-img-upload-row {
          display: flex; align-items: center; gap: 8px;
          margin-top: 8px;
        }
        .kisan-upload-btn {
          font-size: 0.75rem;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          border: 1.5px dashed var(--gray-200);
          background: var(--gray-50);
          color: var(--gray-600);
          cursor: pointer;
          display: flex; align-items: center; gap: 5px;
        }
        .kisan-img-preview-container {
          position: relative;
          display: flex; align-items: center; gap: 6px;
        }
        .kisan-img-preview {
          width: 36px; height: 36px; border-radius: 6px;
          object-fit: cover; border: 1.5px solid var(--gray-200);
        }
        .kisan-clear-img {
          font-size: 0.65rem; color: var(--red-400); cursor: pointer;
          padding: 2px 6px; border: 1px solid var(--red-400); border-radius: 4px;
          background: var(--red-50);
        }

        .kisan-footer {
          background: var(--green-900);
          padding: 0.5rem 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .kisan-footer-text { font-size: 0.65rem; color: rgba(255,255,255,0.45); }
        .kisan-badge {
          font-size: 0.6rem;
          padding: 2px 8px;
          border-radius: 10px;
          background: rgba(120,196,62,0.18);
          color: #a8e06a;
          font-weight: 700;
        }
        .kisan-input-hint {
          font-size: 0.7rem;
          color: var(--gray-400);
          margin-top: 6px;
          text-align: center;
        }

        @import url('https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        
        .kisan-app-wrapper {
          font-family: 'DM Sans', sans-serif;
        }
        .kisan-header-text p, .kisan-bubble {
          font-family: 'Tiro Devanagari Hindi', serif;
        }
      `}</style>

      <div className="kisan-app-wrapper">
        {/* HEADER */}
        <div className="kisan-header">
          <div className="kisan-header-icon">🌱</div>
          <div className="kisan-header-text">
            <h1>{t('chatTitle')}</h1>
            <p><span className="kisan-status-dot"></span>{t('chatSubtitle')}</p>
          </div>
        </div>

        {/* QUICK CHIPS */}
        <div className="kisan-chips-section">
          <div className="kisan-chips-label">{t('askQuickly')}</div>
          <div className="kisan-chips-row">
            {quickChips.map((chip) => (
              <div key={chip.label} className="kisan-chip" onClick={() => sendMessage(chip.text)}>
                {chip.label}
              </div>
            ))}
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="kisan-chat-area" ref={scrollRef}>
          {messages.map((msg) => (
            <div key={msg.id} className={cn("kisan-msg-row", msg.role === "user" && "kisan-user-row")}>
              <div className={cn("kisan-avatar", msg.role === "assistant" ? "kisan-bot-avatar" : "kisan-user-avatar")}>
                {msg.role === "assistant" ? "🌱" : "👨🌾"}
              </div>
              <div className={cn("kisan-bubble", msg.role === "assistant" ? "kisan-bot-bubble" : "kisan-user-bubble")}>
                {msg.hasImage && <div className="text-[10px] italic opacity-70 mb-1">{t('photoAttachedTag')}</div>}
                {formatText(msg.content)}
              </div>
            </div>
          ))}
          {streaming && (
            <div className="kisan-msg-row">
              <div className="kisan-avatar kisan-bot-avatar">🌱</div>
              <div className="kisan-bubble kisan-bot-bubble kisan-typing-bubble">
                <div className="kisan-typing-dot"></div>
                <div className="kisan-typing-dot"></div>
                <div className="kisan-typing-dot"></div>
              </div>
            </div>
          )}
        </div>

        {/* INPUT SECTION */}
        <div className="kisan-input-section">
          <div className="kisan-input-row">
            <textarea
              className="kisan-input-box"
              placeholder={t('typeYourQuestion')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              rows={1}
            />
            <button className="kisan-send-btn" onClick={() => sendMessage()} disabled={streaming}>
              {streaming ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
            </button>
          </div>

          {/* Image upload */}
          <div className="kisan-img-upload-row">
            <label className="kisan-upload-btn">
              <Camera size={14} />
              <span>{t('sendPlantPhoto')}</span>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                style={{ display: "none" }} 
                onChange={handleImageUpload}
              />
            </label>
            {selectedImage && (
              <div className="kisan-img-preview-container">
                <img src={`data:${selectedImage.type};base64,${selectedImage.base64}`} className="kisan-img-preview" alt="preview" />
                <span className="kisan-clear-img" onClick={clearImage}><X size={10} /> {t('removeText')}</span>
              </div>
            )}
          </div>
          <div className="kisan-input-hint">{t('chatInputHint')}</div>
        </div>

        {/* FOOTER */}
        <div className="kisan-footer">
          <span className="kisan-footer-text">KrishiSathi v2.0 • Kisan Mitra AI</span>
          <div className="flex gap-2">
            <span className="kisan-badge">Hindi/Hinglish</span>
            <span className="kisan-badge" style={{ background: 'rgba(201,143,71,0.18)', color: '#e0b46a' }}>AI Powered</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
