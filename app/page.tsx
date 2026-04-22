"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Answer = {
  id: number;
  name: string;
  attr: string;
  text: string;
  likes: number;
  createdAt: string;
  status: string;
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
  status: string;
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
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: pErr } = await supabase.from("posts").select("*").order("id", { ascending: false });
      const { data: ansData, error: aErr } = await supabase.from("answers").select("*").order("id", { ascending: true });
      if (pErr || aErr) throw pErr || aErr;

      const combined = (postsData || []).map((p: any) => ({
        ...p,
        answers: (ansData || []).filter((a: any) => a.post_id === p.id)
      }));
      setPosts(combined);
    } catch (e: any) {
      setNotice("データ取得エラー: " + e.message);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      setNotice("設定エラー: Vercelの環境変数が読み込めていません。Redeployしてください。");
      setIsLoaded(true);
      return;
    }
    fetchPosts();
  }, []);

  const getNow = () => {
    const n = new Date();
    return `${n.getFullYear()}/${n.getMonth()+1}/${n.getDate()} ${n.getHours()}:${n.getMinutes()}`;
  };

  const handlePost = async () => {
    if (!detail.trim()) return setNotice("相談内容を入力してください。");
    setNotice("送信中...");

    const newPost = {
      id: Date.now(),
      name: postName.trim() || "名無し",
      meet, relationship, time, length, dateType, reaction, afterStatus, selfFeeling,
      detail: detail.trim(),
      status: "approved",
      likes: 0, ariCount: 0, nashiCount: 0,
      emojiReactions: { "それな": 0, "沼": 0, "尊い": 0, "草": 0 },
      updates: [],
      createdAt: getNow(),
    };

    const { error } = await supabase.from("posts").insert([newPost]);
    if (error) return setNotice("投稿失敗: " + error.message);

    setNotice("投稿が完了しました！");
    setPostName(""); setDetail("");
    fetchPosts();
  };

  const handleVote = async (id: number, type: 'ari' | 'nashi') => {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    const val = type === 'ari' ? { ariCount: (post.ariCount || 0) + 1 } : { nashiCount: (post.nashiCount || 0) + 1 };
    await supabase.from("posts").update(val).eq("id", id);
    fetchPosts();
  };

  const handleAnswer = async (postId: number, n: string, a: string, t: string) => {
    if (!t.trim()) return;
    await supabase.from("answers").insert([{ id: Date.now(), post_id: postId, name: n || "名無し", attr: a, text: t, createdAt: getNow() }]);
    fetchPosts();
  };

  if (!isLoaded) return <div style={{ background: "#000", color: "#fff", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>読み込み中...</div>;

  return (
    <main style={{ minHeight: "100vh", background: "#050505", color: "#fff", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ textAlign: "center", fontSize: "24px" }}>コイシル</h1>
        
        {/* Form */}
        <div style={{ background: "#111", padding: "20px", borderRadius: "15px", margin: "20px 0" }}>
          <input placeholder="ペンネーム" value={postName} onChange={e => setPostName(e.target.value)} style={inputStyle} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "10px 0" }}>
            <select value={meet} onChange={e => setMeet(e.target.value)} style={inputStyle}><option value="">出会い</option><option>アプリ</option><option>紹介</option></select>
            <select value={selfFeeling} onChange={e => setSelfFeeling(e.target.value)} style={inputStyle}><option value="">手応え</option><option>最高</option><option>ふつう</option><option>微妙</option></select>
          </div>
          <textarea placeholder="相談内容..." value={detail} onChange={e => setDetail(e.target.value)} style={{ ...inputStyle, height: "100px" }} />
          <button onClick={handlePost} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "#fff", color: "#000", fontWeight: "bold" }}>投稿する</button>
          {notice && <p style={{ color: "#ff4d94", fontSize: "14px", textAlign: "center" }}>{notice}</p>}
        </div>

        {/* List */}
        {posts.map(post => (
          <div key={post.id} style={{ background: "#111", padding: "20px", borderRadius: "15px", marginBottom: "20px", border: "1px solid #222" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#666" }}>
              <span>{post.name} | {post.meet}</span>
              <span>{post.createdAt}</span>
            </div>
            <p style={{ margin: "15px 0", lineHeight: "1.6" }}>{post.detail}</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => handleVote(post.id, 'ari')} style={btnStyle}>脈あり👍 {post.ariCount}</button>
              <button onClick={() => handleVote(post.id, 'nashi')} style={btnStyle}>脈なし💀 {post.nashiCount}</button>
            </div>
            <div style={{ marginTop: "20px", borderTop: "1px solid #222", paddingTop: "15px" }}>
              {post.answers.map(ans => (
                <div key={ans.id} style={{ fontSize: "14px", marginBottom: "10px", background: "#1a1a1a", padding: "10px", borderRadius: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#888" }}>{ans.name} ({ans.attr}): </span>{ans.text}
                </div>
              ))}
              <input id={`ans-${post.id}`} placeholder="回答を書く..." style={inputStyle} onKeyDown={e => { if(e.key === 'Enter') { handleAnswer(post.id, "匿名", "20代", e.currentTarget.value); e.currentTarget.value = ""; } }} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

const inputStyle = { width: "100%", padding: "10px", background: "#000", border: "1px solid #333", color: "#fff", borderRadius: "8px", marginBottom: "5px", boxSizing: "border-box" as const };
const btnStyle = { padding: "8px 12px", background: "#222", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" };
