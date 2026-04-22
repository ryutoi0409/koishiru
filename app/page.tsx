"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// --- Supabase クライアント初期化 ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Answer = {
  id: number;
  post_id: number;
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
  isSolved?: boolean; // ★解決済み
  tags?: string[];    // ★タグ
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [notice, setNotice] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // 検索・フィルタ
  const [filterTab, setFilterTab] = useState<"NEW" | "盛り上がり">("NEW");
  const [searchQuery, setSearchQuery] = useState("");
  
  // ページネーション
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 4;

  // ★管理者
  const ADMIN_PASSWORD = "koishiru-admin"; 
  const [inputPass, setInputPass] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const TAG_OPTIONS = ["マッチングアプリ", "SNS", "職場恋愛", "既婚者", "復縁", "片思い", "脈なし?", "LINE"];

  const fetchPosts = async () => {
    try {
      const { data: postsData } = await supabase.from("posts").select("*").order("id", { ascending: false });
      const { data: answersData } = await supabase.from("answers").select("*").order("id", { ascending: true });
      const combined = (postsData || []).map((p: any) => ({
        ...p,
        answers: (answersData || []).filter((a: any) => a.post_id === p.id)
      }));
      setPosts(combined);
    } catch (e) { console.error(e); } finally { setIsLoaded(true); }
  };

  useEffect(() => { fetchPosts(); }, []);

  const checkAdmin = (val: string) => {
    setInputPass(val);
    setIsAdmin(val === ADMIN_PASSWORD);
  };

  const getNow = () => {
    const now = new Date();
    return `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const handlePost = async () => {
    if (!detail.trim()) { setNotice("相談内容を入力してください。"); return; }
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
      isSolved: false,
      tags: selectedTags
    };
    const { error } = await supabase.from("posts").insert([newPost]);
    if (error) { setNotice("投稿失敗: " + error.message); return; }
    setNotice("投稿完了しました");
    fetchPosts();
    setPostName(""); setMeet(""); setRelationship(""); setTime(""); setLength("");
    setDateType(""); setReaction(""); setAfterStatus(""); setSelfFeeling(""); setDetail("");
    setSelectedTags([]); setCurrentPage(1);
  };

  const handleToggleSolved = async (postId: number, current: boolean) => {
    await supabase.from("posts").update({ isSolved: !current }).eq("id", postId);
    fetchPosts();
  };

  const handleSetBestAnswer = async (postId: number, answerId: number) => {
    await supabase.from("answers").update({ isBest: false }).eq("post_id", postId);
    await supabase.from("answers").update({ isBest: true }).eq("id", answerId);
    fetchPosts();
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
    const newReactions = { ...post.emojiReactions, [emoji]: (post.emojiReactions[emoji] || 0) + 1 };
    await supabase.from("posts").update({ emojiReactions: newReactions }).eq("id", postId);
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

  const handleAnswer = async (postId: number, name: string, attr: string, text: string) => {
    if (!text.trim()) return;
    await supabase.from("answers").insert([{ id: Date.now(), post_id: postId, name: name || "名無し", attr, text, likes: 0, status: "approved", createdAt: getNow() }]);
    fetchPosts();
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag));
    else if (selectedTags.length < 3) setSelectedTags([...selectedTags, tag]);
  };

  // 検索とソート
  const filteredPosts = posts.filter(p => 
    p.detail.includes(searchQuery) || 
    p.name.includes(searchQuery) || 
    p.tags?.some(t => t.includes(searchQuery))
  );

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (filterTab === "盛り上がり") return (b.ariCount + b.nashiCount) - (a.ariCount + a.nashiCount);
    return b.id - a.id;
  });

  const indexOfLastPost = currentPage * postsPerPage;
  const currentPosts = sortedPosts.slice(indexOfLastPost - postsPerPage, indexOfLastPost);
  const totalPages = Math.ceil(sortedPosts.length / postsPerPage);

  if (!isLoaded) return null;

  return (
    <main style={{ minHeight: "100vh", background: "radial-gradient(circle at top, #1c1c1c 0%, #050505 100%)", color: "#fff", padding: "20px 12px", fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "8px 14px", borderRadius: "999px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "12px" }}>コイシル</div>
          <input type="password" placeholder="Admin" value={inputPass} onChange={(e) => checkAdmin(e.target.value)} style={{ background: "transparent", border: "none", color: "#222", width: "40px", outline: "none" }} />
        </div>

        <div className="layout-grid" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <style jsx>{`
            .layout-grid { flex-direction: column !important; }
            @media (min-width: 1024px) { 
              .layout-grid { flex-direction: row !important; align-items: start; }
              .side { width: 400px !important; flex-shrink: 0; position: sticky; top: 20px; }
            }
            .compact-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
          `}</style>

          {/* Form Side */}
          <section className="side" style={{ background: "rgba(255,255,255,0.02)", padding: "24px", borderRadius: "32px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>相談を投稿する</h2>
            <Field label="ペンネーム"><input value={postName} onChange={e => setPostName(e.target.value)} style={inputStyle} placeholder="匿名可" /></Field>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "14px 0" }}>
              <Field label="出会い方"><select style={selectStyle} value={meet} onChange={e => setMeet(e.target.value)}><option value="">選択</option><option>マッチングアプリ</option><option>SNS</option><option>職場</option><option>学校</option><option>紹介</option><option>その他</option></select></Field>
              <Field label="関係"><select style={selectStyle} value={relationship} onChange={e => setRelationship(e.target.value)}><option value="">選択</option><option>初対面</option><option>いい感じ</option><option>片思い</option><option>付き合いたて</option></select></Field>
            </div>

            <Field label="タグ（最大3つ）">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "5px" }}>
                {TAG_OPTIONS.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)} style={{ 
                    padding: "4px 10px", borderRadius: "8px", fontSize: "11px", border: "1px solid rgba(255,255,255,0.1)",
                    background: selectedTags.includes(tag) ? "#fff" : "transparent",
                    color: selectedTags.includes(tag) ? "#000" : "#888",
                    cursor: "pointer"
                  }}>{tag}</button>
                ))}
              </div>
            </Field>

            <Field label="相談内容" fullWidth><textarea value={detail} onChange={e => setDetail(e.target.value)} style={{...inputStyle, minHeight: "100px"}} /></Field>
            <button onClick={handlePost} style={mainButtonStyle}>投稿する</button>
            {notice && <div style={{ fontSize: "12px", color: "#2ecc71", marginTop: "10px", textAlign: "center" }}>{notice}</div>}
          </section>

          {/* List Side */}
          <section style={{ flex: 1 }}>
            <div style={{ marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <input placeholder="キーワード・タグで検索..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{...inputStyle, flex: 1, minWidth: "200px"}} />
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "10px", padding: "4px", display: "flex" }}>
                <button onClick={() => setFilterTab("NEW")} style={{...tabStyle, background: filterTab === "NEW" ? "rgba(255,255,255,0.1)" : "transparent"}}>NEW</button>
                <button onClick={() => setFilterTab("盛り上がり")} style={{...tabStyle, background: filterTab === "盛り上がり" ? "rgba(255,255,255,0.1)" : "transparent"}}>盛り上がり</button>
              </div>
            </div>

            <div style={{ display: "grid", gap: "20px" }}>
              {currentPosts.map((post, idx) => {
                const total = post.ariCount + post.nashiCount;
                const per = total === 0 ? 50 : Math.round((post.ariCount / total) * 100);
                return (
                  <div key={post.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {idx < 3 && filterTab === "NEW" && <span style={{ background: "#e74c3c", fontSize: "9px", padding: "2px 6px", borderRadius: "4px" }}>NEW</span>}
                        <span style={{ fontSize: "12px", color: "#888" }}>{post.name} · {post.createdAt}</span>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {post.isSolved && <span style={{ background: "#2ecc71", color: "#fff", fontSize: "10px", padding: "2px 8px", borderRadius: "4px" }}>解決済み ✔</span>}
                        <button onClick={() => handleToggleSolved(post.id, !!post.isSolved)} style={{ background: "none", border: "1px solid #333", color: "#666", fontSize: "9px", borderRadius: "4px", cursor: "pointer" }}>
                          {post.isSolved ? "未解決にする" : "解決済みにする"}
                        </button>
                      </div>
                    </div>

                    {/* メタ情報をコンパクトなチップ形式に変更 */}
                    <div className="compact-meta">
                      {post.tags?.map(t => <span key={t} style={{ color: "#3498db", fontSize: "11px", marginRight: "4px" }}>#{t}</span>)}
                      <Meta label="出会い" value={post.meet} />
                      <Meta label="関係" value={post.relationship} />
                      <Meta label="内容" value={post.dateType} />
                      <Meta label="手応え" value={post.selfFeeling} />
                    </div>

                    <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "16px", marginBottom: "15px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "6px" }}>
                        <span style={{ color: "#ff4d94" }}>脈あり {per}%</span>
                        <span style={{ color: "#888" }}>脈なし {100-per}%</span>
                      </div>
                      <div style={{ height: "6px", background: "#111", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${per}%`, height: "100%", background: "#ff4d94", transition: "0.5s" }} />
                      </div>
                      <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                        <button onClick={() => handleVote(post.id, 'ari')} style={voteBtnStyle}>脈あり👍</button>
                        <button onClick={() => handleVote(post.id, 'nashi')} style={voteBtnStyle}>脈なし💀</button>
                      </div>
                    </div>

                    <div style={{ fontSize: "15px", lineHeight: "1.7", color: "#eee", marginBottom: "15px", whiteSpace: "pre-wrap" }}>{post.detail}</div>

                    <div style={{ borderTop: "1px solid #222", paddingTop: "15px" }}>
                      <AnswerList post={post} isAdmin={isAdmin} onSetBest={handleSetBestAnswer} />
                      <AnswerBox postId={post.id} onAnswer={handleAnswer} />
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "15px", marginTop: "30px" }}>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={pageBtnStyle}>前へ</button>
                <span style={{fontSize:"13px"}}>{currentPage} / {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={pageBtnStyle}>次へ</button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function AnswerList({ post, isAdmin, onSetBest }: { post: Post, isAdmin: boolean, onSetBest: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const count = post.answers?.length || 0;
  if (count === 0) return <div style={{ fontSize: "11px", color: "#444", marginBottom: "10px" }}>回答なし</div>;

  return (
    <div style={{ marginBottom: "15px" }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#888", fontSize: "12px", padding: "8px", borderRadius: "8px", cursor: "pointer", width: "100%", textAlign: "left" }}>
        {isOpen ? "▲ 回答を閉じる" : `▼ 回答を見る (${count}件)`}
      </button>
      {isOpen && (
        <div style={{ marginTop: "10px", display: "grid", gap: "8px" }}>
          {post.answers.map(ans => (
            <div key={ans.id} style={{ padding: "12px", borderRadius: "12px", background: ans.isBest ? "rgba(255,215,0,0.05)" : "rgba(255,255,255,0.01)", border: ans.isBest ? "1px solid #ffd700" : "1px solid #222" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "11px", color: "#777" }}>{ans.isBest && "👑 "}{ans.name} ({ans.attr})</span>
                <button onClick={() => onSetBest(post.id, ans.id)} style={{ background: "none", border: "none", color: "#ffd700", fontSize: "10px", cursor: "pointer" }}>ベスト👑</button>
              </div>
              <div style={{ fontSize: "13px", color: "#ddd" }}>{ans.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnswerBox({ postId, onAnswer }: { postId: number; onAnswer: any }) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "16px" }}>
      <input placeholder="名前" value={name} onChange={e => setName(e.target.value)} style={{...inputStyle, padding: "8px", marginBottom: "8px", fontSize: "12px"}} />
      <textarea placeholder="回答する..." value={text} onChange={e => setText(e.target.value)} style={{...inputStyle, minHeight: "60px", padding: "8px", fontSize: "13px"}} />
      <button onClick={() => { onAnswer(postId, name, "回答者", text); setText(""); }} style={{...mainButtonStyle, padding: "10px", fontSize: "12px", marginTop: "8px"}}>回答投稿</button>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div style={{ padding: "3px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "4px", alignItems: "center" }}>
      <span style={{ fontSize: "9px", color: "#666" }}>{label}</span>
      <span style={{ fontSize: "10px", color: "#ccc" }}>{value}</span>
    </div>
  );
}

function Field({ label, children, fullWidth = false }: { label: string; children: React.ReactNode; fullWidth?: boolean }) {
  return <div style={{ gridColumn: fullWidth ? "1 / -1" : undefined, marginBottom: "12px" }}><label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "5px" }}>{label}</label>{children}</div>;
}

const inputStyle = { width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "#000", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" as const };
const selectStyle = { ...inputStyle, appearance: "none" as const };
const mainButtonStyle = { width: "100%", padding: "16px", borderRadius: "14px", border: "none", background: "#fff", color: "#000", fontSize: "15px", fontWeight: "bold", cursor: "pointer" };
const voteBtnStyle = { flex: 1, padding: "8px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid #222", color: "#fff", fontSize: "11px", cursor: "pointer" };
const tabStyle = { padding: "6px 12px", border: "none", color: "#fff", fontSize: "11px", cursor: "pointer", borderRadius: "6px" };
const pageBtnStyle = { padding: "8px 16px", background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", borderRadius: "8px", cursor: "pointer", fontSize: "12px" };
