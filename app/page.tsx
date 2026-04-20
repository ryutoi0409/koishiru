ログを確認しました！原因が判明しました。

エラーメッセージ：`Cannot find name 'noticeBoxStyle'`

これは、コードの最後の方で `noticeBoxStyle` というデザイン設定（変数）を定義し忘れていたために発生したエラーです。私のミスです、失礼いたしました！

**修正して、さらに確実に動くようにした「完全復活版」**を用意しました。
今度こそ、これをそのままコピーしてGitHubの `page.tsx` に貼り付けてください。

```tsx
"use client";
import { useState, useEffect } from "react";

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

  // ★運営用：管理者設定
  const ADMIN_PASSWORD = "koishiru-admin"; 
  const [inputPass, setInputPass] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("koishiru_final_master");
    if (saved) setPosts(JSON.parse(saved));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("koishiru_final_master", JSON.stringify(posts));
    }
  }, [posts, isLoaded]);

  const checkAdmin = (val: string) => {
    setInputPass(val);
    if (val === ADMIN_PASSWORD) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  const getNow = () => {
    const now = new Date();
    return `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const handlePost = () => {
    if (!detail.trim()) {
      setNotice("相談内容を入力してください。");
      return;
    }

    const newPost: Post = {
      id: Date.now(),
      name: postName.trim() || "名無し",
      meet, relationship, time, length, dateType, reaction, afterStatus, selfFeeling,
      detail: detail.trim(),
      status: "approved",
      likes: 0,
      ariCount: 0,
      nashiCount: 0,
      emojiReactions: { "それな": 0, "沼": 0, "尊い": 0, "草": 0 },
      updates: [],
      answers: [],
      createdAt: getNow(),
    };

    setPosts([newPost, ...posts]);
    setPostName(""); setMeet(""); setRelationship(""); setTime(""); setLength("");
    setDateType(""); setReaction(""); setAfterStatus(""); setSelfFeeling(""); setDetail("");
    setNotice("投稿が完了しました！");
  };

  const handleDeletePost = (postId: number) => {
    if (!isAdmin) return;
    if (confirm("この相談を削除しますか？")) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    }
  };

  const handleDeleteAnswer = (postId: number, answerId: number) => {
    if (!isAdmin) return;
    if (confirm("この回答を削除しますか？")) {
      setPosts((prev) => prev.map((p) => p.id === postId ? {
        ...p,
        answers: p.answers.filter((a) => a.id !== answerId)
      } : p));
    }
  };

  const handleAnswer = (postId: number, name: string, attr: string, text: string) => {
    if (!text.trim()) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? {
          ...p,
          answers: [...p.answers, {
            id: Date.now(),
            name: name.trim() || "名無し",
            attr, text: text.trim(), likes: 0, status: "approved", createdAt: getNow(),
          }],
        } : p
      )
    );
  };

  const handlePostLike = (postId: number) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
  };

  const handleAnswerLike = (postId: number, answerId: number) => {
    setPosts((prev) =>
      prev.map((p) => p.id === postId ? {
        ...p,
        answers: p.answers.map((a) => a.id === answerId ? { ...a, likes: a.likes + 1 } : a),
      } : p)
    );
  };

  const handleVote = (postId: number, type: 'ari' | 'nashi') => {
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      ariCount: type === 'ari' ? p.ariCount + 1 : p.ariCount,
      nashiCount: type === 'nashi' ? p.nashiCount + 1 : p.nashiCount
    } : p));
  };

  const handleEmojiReaction = (postId: number, emoji: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      emojiReactions: { ...p.emojiReactions, [emoji]: (p.emojiReactions[emoji] || 0) + 1 }
    } : p));
  };

  const handleAddUpdate = (postId: number, text: string) => {
    if (!text.trim()) return;
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      updates: [...p.updates, { id: Date.now(), text, createdAt: getNow() }]
    } : p));
  };

  const handleShareToX = (post: Post) => {
    const text = `【コイシル】投稿者：${post.name}\n${post.detail}\n\n#コイシル #恋愛相談`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleSetBestAnswer = (postId: number, answerId: number) => {
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      answers: p.answers.map(a => a.id === answerId ? { ...a, isBest: !a.isBest } : { ...a, isBest: false })
    } : p));
  };

  if (!isLoaded) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #1c1c1c 0%, #0b0b0b 42%, #050505 100%)",
        color: "#ffffff",
        padding: "clamp(20px, 5vw, 48px) clamp(12px, 3vw, 20px)",
        fontFamily: 'Arial, "Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif',
      }}
    >
      <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "8px 14px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.03)", color: "#d1d1d1", fontSize: "12px", letterSpacing: "0.14em" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "linear-gradient(135deg, #f0f0f0 0%, #8a8a8a 100%)", display: "inline-block" }} />
            コイシル {isAdmin && <span style={{color: "#ffd700", marginLeft: "8px"}}>● 管理者</span>}
          </div>
          <input 
            type="password" 
            placeholder="Admin..." 
            value={inputPass} 
            onChange={(e) => checkAdmin(e.target.value)} 
            style={{ background: "transparent", border: "none", color: "#222", fontSize: "10px", width: "50px", outline: "none" }} 
          />
        </div>

        <div className="main-grid" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <style jsx>{`
                .main-grid { flex-direction: column !important; }
                @media (min-width: 1024px) {
                    .main-grid { flex-direction: row !important; align-items: start; }
                    .side-section { width: 450px !important; flex-shrink: 0; position: sticky; top: 20px; }
                }
                .meta-grid { grid-template-columns: repeat(2, 1fr) !important; }
                @media (min-width: 640px) {
                    .meta-grid { grid-template-columns: repeat(4, 1fr) !important; }
                }
            `}</style>

          {/* Concept Card */}
          <section style={{ position: "relative", overflow: "hidden", borderRadius: "32px", padding: "clamp(24px, 6vw, 48px)", background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 90px rgba(0,0,0,0.45)", flex: 1 }}>
            <h1 style={{ margin: "0 0 18px 0", fontSize: "clamp(28px, 6vw, 44px)", lineHeight: "1.2", fontWeight: 700 }}>恋愛の違和感を投稿して<br />本音の意見を集める。</h1>
            <p style={{ margin: "0 0 34px 0", color: "#c8c8c8", fontSize: "16px", lineHeight: "1.95", maxWidth: "640px" }}>コイシルは、第3者の視点から率直な意見をもらうことができる恋愛特化型の相談プラットフォームです。</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "28px" }}>
              {[["01", "恋愛の違和感"], ["02", "運営が確認"], ["03", "回答を集める"], ["04", "相談を広げる"]].map(([num, title]) => (
                <div key={num} style={{ padding: "16px", borderRadius: "20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ fontSize: "10px", color: "#8f8f8f", marginBottom: "4px" }}>POINT {num}</div>
                  <div style={{ fontSize: "15px", fontWeight: 700 }}>{title}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px" }}>
              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>このページでできること</div>
                <div style={infoTextStyle}>恋愛の違和感や失敗を整理して投稿し、他の人の視点から「何が問題だったのか」を知ることができます。</div>
              </div>
            </div>
          </section>

          {/* Post Form */}
          <section className="side-section" style={{ borderRadius: "32px", padding: "clamp(20px, 5vw, 32px)", background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.025) 100%)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 90px rgba(0,0,0,0.45)" }}>
            <h2 style={{ margin: "0 0 20px 0", fontSize: "26px" }}>恋愛相談を投稿する</h2>
            <Field label="ペンネーム" fullWidth>
              <input placeholder="例：恋する会社員" value={postName} onChange={(e) => setPostName(e.target.value)} style={inputStyle} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "14px", marginBottom: "14px" }}>
              <Field label="出会い方"><select style={selectStyle} value={meet} onChange={(e) => setMeet(e.target.value)}><option value="">選択</option><option>アプリ</option><option>SNS</option><option>紹介</option><option>職場</option><option>学校</option><option>その他</option></select></Field>
              <Field label="関係"><select style={selectStyle} value={relationship} onChange={(e) => setRelationship(e.target.value)}><option value="">選択</option><option>初対面</option><option>やり取り</option><option>知り合い</option></select></Field>
              <Field label="時間帯"><select style={selectStyle} value={time} onChange={(e) => setTime(e.target.value)}><option value="">選択</option><option>昼</option><option>夜</option><option>深夜</option></select></Field>
              <Field label="長さ"><select style={selectStyle} value={length} onChange={(e) => setLength(e.target.value)}><option value="">選択</option><option>1h前後</option><option>2h前後</option><option>4h以上</option></select></Field>
              <Field label="内容"><select style={selectStyle} value={dateType} onChange={(e) => setDateType(e.target.value)}><option value="">選択</option><option>カフェ</option><option>ご飯</option><option>飲み</option><option>その他</option></select></Field>
              <Field label="反応"><select style={selectStyle} value={reaction} onChange={(e) => setReaction(e.target.value)}><option value="">選択</option><option>良</option><option>普</option><option>微</option></select></Field>
              <Field label="その後"><select style={selectStyle} value={afterStatus} onChange={(e) => setAfterStatus(e.target.value)}><option value="">選択</option><option>遅い</option><option>無視</option><option>継続中</option></select></Field>
              <Field label="手応え"><select style={selectStyle} value={selfFeeling} onChange={(e) => setSelfFeeling(e.target.value)}><option value="">選択</option><option>優勝</option><option>空回り</option><option>失敗</option></select></Field>
            </div>
            <Field label="相談内容" fullWidth>
              <textarea placeholder="相談内容を入力..." value={detail} onChange={(e) => setDetail(e.target.value)} style={textareaStyle} />
            </Field>
            <button onClick={handlePost} style={mainButtonStyle}>相談を投稿する</button>
            {notice && <div style={noticeBoxStyle}>{notice}</div>}
          </section>
        </div>

        {/* Timeline */}
        <section style={{ marginTop: "24px", display: "grid", gap: "20px" }}>
          {posts.map((post) => {
            const totalVotes = post.ariCount + post.nashiCount;
            const ariPer = totalVotes === 0 ? 50 : Math.round((post.ariCount / totalVotes) * 100);
            return (
              <div key={post.id} style={postCardStyle}>
                <div className="meta-grid" style={{display: "grid", gap: "8px", marginBottom: "16px"}}>
                  <Meta label="出会い" value={post.meet} />
                  <Meta label="関係" value={post.relationship} />
                  <Meta label="時間" value={post.time} />
                  <Meta label="内容" value={post.dateType} />
                </div>

                <div style={voteContainerStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "8px" }}>
                    <span style={{ color: "#ff4d94", fontWeight: "bold" }}>脈あり {ariPer}%</span>
                    <span style={{ color: "#888" }}>脈なし {100 - ariPer}%</span>
                  </div>
                  <div style={gaugeBarStyle}><div style={{ ...ariGaugeStyle, width: `${ariPer}%` }} /></div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                    <button onClick={() => handleVote(post.id, 'ari')} style={voteButtonStyle}>脈あり👍</button>
                    <button onClick={() => handleVote(post.id, 'nashi')} style={voteButtonStyle}>脈なし💀</button>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", gap: "10px", alignItems: "flex-start" }}>
                  <div style={{ color: "#cfcfcf", fontSize: "12px" }}>{post.name} <span style={{ color: "#666", fontSize: "10px" }}>{post.createdAt}</span></div>
                  {isAdmin && <button onClick={() => handleDeletePost(post.id)} style={{ color: "#ff4d4d", fontSize: "10px", background: "none", border: "none", cursor: "pointer" }}>削除</button>}
                </div>
                
                <div style={postDetailStyle}>{post.detail}</div>

                {post.updates?.map(up => (
                  <div key={up.id} style={updateBubbleStyle}>
                    <div style={{ fontSize: "10px", color: "#8aa", marginBottom: "4px" }}>追記 {up.createdAt}</div>
                    {up.text}
                  </div>
                ))}
                <UpdateInput onAdd={(text) => handleAddUpdate(post.id, text)} />

                <div style={{ marginTop: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button onClick={() => handlePostLike(post.id)} style={subButtonStyle}>❤ {post.likes}</button>
                  <button onClick={() => handleShareToX(post)} style={subButtonStyle}>X</button>
                  {Object.entries(post.emojiReactions || {}).map(([emoji, count]) => (
                    <button key={emoji} onClick={() => handleEmojiReaction(post.id, emoji)} style={emojiButtonStyle}>{emoji} {count || ""}</button>
                  ))}
                </div>

                <div style={answerContainerStyle}>
                  {post.answers.map((ans) => (
                    <div key={ans.id} style={{ ...answerItemStyle, border: ans.isBest ? "1px solid #ffd700" : "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <div style={{ fontSize: "11px", color: "#888" }}>{ans.isBest && "👑 "}{ans.name} ({ans.attr})</div>
                        <div style={{display:"flex", gap:"8px"}}>
                          {isAdmin && <button onClick={() => handleSetBestAnswer(post.id, ans.id)} style={{ color: "#ffd700", fontSize: "9px", background: "none", border: "none" }}>ベスト</button>}
                          {isAdmin && <button onClick={() => handleDeleteAnswer(post.id, ans.id)} style={{ color: "#ff4d4d", fontSize: "9px", background: "none", border: "none" }}>削除</button>}
                        </div>
                      </div>
                      <div style={{fontSize: "14px"}}>{ans.text}</div>
                      <button onClick={() => handleAnswerLike(post.id, ans.id)} style={{...subButtonStyle, padding: "4px 8px", marginTop: "8px"}}>❤ {ans.likes}</button>
                    </div>
                  ))}
                  <AnswerBox postId={post.id} onAnswer={handleAnswer} />
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function UpdateInput({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState("");
  const [show, setShow] = useState(false);
  if (!show) return <button onClick={() => setShow(true)} style={{ marginTop: "12px", background: "none", border: "none", color: "#3498db", fontSize: "11px", cursor: "pointer" }}>+ 追記する</button>;
  return (
    <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
      <input placeholder="追記..." value={text} onChange={e => setText(e.target.value)} style={answerInputStyle} />
      <button onClick={() => { onAdd(text); setText(""); setShow(false); }} style={subButtonStyle}>追加</button>
    </div>
  );
}

function Field({ label, children, fullWidth = false }: { label: string; children: React.ReactNode; fullWidth?: boolean }) {
  return <div style={{ gridColumn: fullWidth ? "1 / -1" : undefined }}><label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "#8f8f8f" }}>{label}</label>{children}</div>;
}

function AnswerBox({ postId, onAnswer }: { postId: number; onAnswer: any }) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [attr, setAttr] = useState("20代・女性");
  return (
    <div style={{ marginTop: "14px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
        <input placeholder="名前" value={name} onChange={(e) => setName(e.target.value)} style={answerInputStyle} />
        <select value={attr} onChange={(e) => setAttr(e.target.value)} style={selectStyle}>
          <option>20代・女性</option><option>20代・男性</option><option>30代以上</option>
        </select>
      </div>
      <textarea placeholder="アドバイスを投稿..." value={text} onChange={(e) => setText(e.target.value)} style={{...answerInputStyle, minHeight: "60px"}} />
      <button onClick={() => { onAnswer(postId, name, attr, text); setName(""); setText(""); }} style={{...mainButtonStyle, padding: "10px", fontSize: "13px", marginTop: "8px"}}>回答する</button>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}><div style={{ fontSize: "10px", color: "#666", marginBottom: "2px" }}>{label}</div><div style={{ fontSize: "12px", color: "#ddd" }}>{value || "-"}</div></div>;
}

const inputStyle = { width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" as const };
const selectStyle = { ...inputStyle, appearance: "none" as const };
const textareaStyle = { ...inputStyle, minHeight: "120px", lineHeight: "1.6", resize: "vertical" as const };
const mainButtonStyle = { width: "100%", padding: "16px", borderRadius: "14px", border: "none", background: "#fff", color: "#000", fontSize: "16px", fontWeight: 800, cursor: "pointer" };
const subButtonStyle = { padding: "8px 12px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: "11px", cursor: "pointer" };
const infoCardStyle = { padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" };
const infoLabelStyle = { fontSize: "11px", color: "#666", marginBottom: "4px" };
const infoTextStyle = { fontSize: "13px", lineHeight: "1.6", color: "#ccc" };
const postCardStyle = { borderRadius: "20px", padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" };
const postDetailStyle = { color: "#eee", fontSize: "14px", lineHeight: "1.7", whiteSpace: "pre-wrap" as const };
const answerContainerStyle = { marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.05)" };
const answerItemStyle = { padding: "12px", borderRadius: "12px", background: "rgba(0,0,0,0.2)", color: "#eee", marginBottom: "8px" };
const answerInputStyle = { width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "#000", color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box" as const };
const voteContainerStyle = { marginBottom: "16px", padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" };
const gaugeBarStyle = { height: "6px", background: "#222", borderRadius: "3px", overflow: "hidden", display: "flex" as const };
const ariGaugeStyle = { background: "#ff4d94", transition: "0.5s" };
const voteButtonStyle = { flex: 1, padding: "8px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "11px" };
const updateBubbleStyle = { marginTop: "12px", padding: "10px", background: "rgba(52,152,219,0.1)", borderRadius: "12px", fontSize: "13px", border: "1px solid rgba(52,152,219,0.2)" };
const emojiButtonStyle = { padding: "5px 10px", borderRadius: "15px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "11px" };
const noticeBoxStyle = { marginTop: "10px", color: "#2ecc71", fontSize: "12px" };
```