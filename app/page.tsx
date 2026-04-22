"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Answer = {
  id: number;
  name: string;
  attr: string;
  text: string;
  likes: number;
  createdAt: string;
  status: "pending" | "approved";
  isBest?: boolean;
};

type Post = {
  id: number;
  name: string;
  meet: string;
  relationship: string;
  time: string;
  length: string;
  dateType: string;
  reaction: string;
  afterStatus: string;
  selfFeeling: string;
  detail: string;
  likes: number;
  ariCount: number;
  nashiCount: number;
  emojiReactions: { [key: string]: number };
  updates: { id: number; text: string; createdAt: string }[];
  answers: Answer[];
  createdAt: string;
  status: "pending" | "approved";
};

export default function Home() {
  const [postName, setPostName] = useState("");
  const [meet, setMeet] = useState("");
  const [relationship, setRelationship] = useState("");
  const [time, setTime] = useState("");
  const [length, setLength] = useState("");
  const [dateType, setDateType] = useState("");
  const [reaction, setReaction] = useState("");
  const [afterStatus, setAfterStatus] = useState("");
  const [selfFeeling, setSelfFeeling] = useState("");
  const [detail, setDetail] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [notice, setNotice] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputPass, setInputPass] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .order("id", { ascending: false });
      const { data: answersData, error: answersError } = await supabase
        .from("answers")
        .select("*")
        .order("id", { ascending: true });
      if (postsError || answersError) throw postsError || answersError;
      const combined = (postsData || []).map((p: any) => ({
        ...p,
        answers: (answersData || []).filter((a: any) => a.post_id === p.id)
      }));
      setPosts(combined);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const getNow = () => {
    const now = new Date();
    return `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const handlePost = async () => {
    if (!detail.trim()) { setNotice("相談内容を入力してください。"); return; }
    const newPost = {
      id: Date.now(),
      name: postName.trim() || "名無し",
      meet: meet || "未選択",
      relationship: relationship || "未選択",
      time: time || "未選択",
      length: length || "未選択",
      dateType: dateType || "未選択",
      reaction: reaction || "未選択",
      afterStatus: afterStatus || "未選択",
      selfFeeling: selfFeeling || "未選択",
      detail: detail.trim(),
      status: "approved",
      likes: 0,
      ariCount: 0,
      nashiCount: 0,
      emojiReactions: { "それな": 0, "沼": 0, "尊い": 0, "草": 0 },
      updates: [],
      createdAt: getNow(),
    };
    const { error } = await supabase.from("posts").insert([newPost]);
    if (error) { setNotice("失敗: " + error.message); return; }
    setNotice("投稿が完了しました！");
    fetchPosts();
    setPostName(""); setMeet(""); setRelationship(""); setTime(""); setLength(""); setDateType(""); setReaction(""); setAfterStatus(""); setSelfFeeling(""); setDetail("");
  };

  const handleVote = async (postId: number, type: 'ari' | 'nashi') => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const update = type === 'ari' ? { ariCount: (post.ariCount || 0) + 1 } : { nashiCount: (post.nashiCount || 0) + 1 };
    await supabase.from("posts").update(update).eq("id", postId);
    fetchPosts();
  };

  const handleEmojiReaction = async (postId: number, emoji: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const current = post.emojiReactions || { "それな": 0, "沼": 0, "尊い": 0, "草": 0 };
    await supabase.from("posts").update({ emojiReactions: { ...current, [emoji]: (current[emoji] || 0) + 1 } }).eq("id", postId);
    fetchPosts();
  };

  const handleAnswer = async (postId: number, name: string, attr: string, text: string) => {
    if (!text.trim()) return;
    await supabase.from("answers").insert([{ id: Date.now(), post_id: postId, name: name || "名無し", attr, text, likes: 0, status: "approved", createdAt: getNow() }]);
    fetchPosts();
  };

  const handleAddUpdate = async (postId: number, text: string) => {
    if (!text.trim()) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const newUpdates = [...(post.updates || []), { id: Date.now(), text, createdAt: getNow() }];
    await supabase.from("posts").update({ updates: newUpdates }).eq("id", postId);
    fetchPosts();
  };

  const handlePostLike = async (postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    await supabase.from("posts").update({ likes: (post.likes || 0) + 1 }).eq("id", postId);
    fetchPosts();
  };

  const handleAnswerLike = async (postId: number, answerId: number) => {
    const post = posts.find(p => p.id === postId);
    const answer = post?.answers.find(a => a.id === answerId);
    if (!answer) return;
    await supabase.from("answers").update({ likes: (answer.likes || 0) + 1 }).eq("id", answerId);
    fetchPosts();
  };

  if (!isLoaded) return <div style={{background:"#000", color:"#fff", height:"100vh", display:"flex", alignItems:"center", justifyContent:"center"}}>読み込み中...</div>;

  return (
    <main style={{ minHeight: "100vh", background: "radial-gradient(circle at top, #1c1c1c 0%, #0b0b0b 42%, #050505 100%)", color: "#ffffff", padding: "40px 20px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700 }}>コイシル</h1>
          <input type="password" placeholder="Admin..." onChange={(e) => setIsAdmin(e.target.value === "koishiru-admin")} style={{ background: "transparent", border: "none", color: "#333", width: "80px" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "30px" }}>
          
          {/* Left: Concept */}
          <section style={{ background: "rgba(255,255,255,0.03)", padding: "40px", borderRadius: "30px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 style={{ fontSize: "40px", marginBottom: "20px" }}>恋愛の違和感を投稿して<br/>本音の意見を集める。</h2>
            <p style={{ color: "#aaa", lineHeight: 1.8 }}>恋愛の小さな違和感を投稿し、第3者の視点から率直な意見をもらうことができる恋愛特化型の相談プラットフォームです。</p>
          </section>

          {/* Right: Form */}
          <section style={{ background: "rgba(255,255,255,0.05)", padding: "30px", borderRadius: "30px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h3 style={{ marginBottom: "20px" }}>相談を投稿する</h3>
            <div style={{ display: "grid", gap: "15px" }}>
              <input placeholder="ペンネーム" value={postName} onChange={(e) => setPostName(e.target.value)} style={inputStyle} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <select value={meet} onChange={(e) => setMeet(e.target.value)} style={inputStyle}><option value="">出会い方</option><option>アプリ</option><option>紹介</option><option>職場</option></select>
                <select value={selfFeeling} onChange={(e) => setSelfFeeling(e.target.value)} style={inputStyle}><option value="">手応え</option><option>最高</option><option>ふつう</option><option>微妙</option><option>失敗</option></select>
              </div>
              <textarea placeholder="相談内容を入力..." value={detail} onChange={(e) => setDetail(e.target.value)} style={{ ...inputStyle, height: "150px" }} />
              <button onClick={handlePost} style={{ padding: "15px", borderRadius: "10px", background: "#fff", color: "#000", fontWeight: "bold", cursor: "pointer" }}>投稿する</button>
              {notice && <p style={{ textAlign: "center", fontSize: "14px" }}>{notice}</p>}
            </div>
          </section>
        </div>

        {/* Timeline */}
        <section style={{ marginTop: "50px" }}>
          <h2 style={{ marginBottom: "30px" }}>相談一覧</h2>
          <div style={{ display: "grid", gap: "20px" }}>
            {posts.map(post => {
              const total = post.ariCount + post.nashiCount;
              const per = total === 0 ? 50 : Math.round((post.ariCount / total) * 100);
              return (
                <div key={post.id} style={{ background: "rgba(255,255,255,0.02)", padding: "30px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: "12px", marginBottom: "10px" }}>
                    <span>{post.name} | {post.meet}</span>
                    <span>{post.createdAt}</span>
                  </div>
                  <p style={{ fontSize: "18px", lineHeight: 1.6, marginBottom: "20px" }}>{post.detail}</p>
                  
                  {/* Gauge */}
                  <div style={{ background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "15px", marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "5px" }}>
                      <span style={{ color: "#ff4d94" }}>脈あり {per}%</span>
                      <span>脈なし {100 - per}%</span>
                    </div>
                    <div style={{ height: "6px", background: "#333", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${per}%`, height: "100%", background: "#ff4d94" }} />
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                      <button onClick={() => handleVote(post.id, 'ari')} style={btnStyle}>脈あり👍</button>
                      <button onClick={() => handleVote(post.id, 'nashi')} style={btnStyle}>脈なし💀</button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                    <button onClick={() => handlePostLike(post.id)} style={btnStyle}>❤ {post.likes}</button>
                    {["それな", "沼", "尊い"].map(e => (
                      <button key={e} onClick={() => handleEmojiReaction(post.id, e)} style={btnStyle}>{e} {post.emojiReactions?.[e] || 0}</button>
                    ))}
                  </div>

                  {/* Answers */}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "20px" }}>
                    {post.answers.map(ans => (
                      <div key={ans.id} style={{ background: "rgba(0,0,0,0.2)", padding: "15px", borderRadius: "10px", marginBottom: "10px" }}>
                        <div style={{ fontSize: "11px", color: "#666" }}>{ans.name} ({ans.attr})</div>
                        <div style={{ marginTop: "5px" }}>{ans.text}</div>
                      </div>
                    ))}
                    <AnswerForm onSend={(n, a, t) => handleAnswer(post.id, n, a, t)} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

function AnswerForm({ onSend }: { onSend: (n: string, a: string, t: string) => void }) {
  const [n, setN] = useState(""); const [a, setA] = useState("20代・女性"); const [t, setT] = useState("");
  return (
    <div style={{ marginTop: "15px", display: "grid", gap: "10px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <input placeholder="名前" value={n} onChange={e => setN(e.target.value)} style={inputStyle} />
        <select value={a} onChange={e => setA(e.target.value)} style={inputStyle}><option>20代・女性</option><option>20代・男性</option><option>30代以上</option></select>
      </div>
      <textarea placeholder="回答を入力..." value={t} onChange={e => setT(e.target.value)} style={{ ...inputStyle, height: "60px" }} />
      <button onClick={() => { onSend(n, a, t); setT(""); }} style={{ padding: "10px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}>回答する</button>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff", fontSize: "14px", boxSizing: "border-box" as const };
const btnStyle = { padding: "8px 12px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "12px", cursor: "pointer" };
