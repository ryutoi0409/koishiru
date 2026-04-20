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
  };

  const handleDeletePost = (postId: number) => {
    if (confirm("この相談を削除しますか？")) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    }
  };

  const handleDeleteAnswer = (postId: number, answerId: number) => {
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

  const handleSetBestAnswer = (postId: number, answerId: number) => {
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      answers: p.answers.map(a => a.id === answerId ? { ...a, isBest: !a.isBest } : { ...a, isBest: false })
    } : p));
  };

  const handleShareToX = (post: Post) => {
    const text = `【コイシル】投稿者：${post.name}\n${post.detail}\n\n#コイシル #恋愛相談`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
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
            コイシル
          </div>
          <div style={{ color: "#8d8d8d", fontSize: "10px", letterSpacing: "0.08em" }}>LOVE CONSULT PLATFORM</div>
        </div>

        {/* Responsive Grid System */}
        <div className="main-grid" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <style jsx>{`
                .main-grid { flex-direction: column !important; }
                @media (min-width: 1024px) {
                    .main-grid { flex-direction: row !important; align-items: start; }
                    .side-section { width: 450px !important; flex-shrink: 0; position: sticky; top: 20px; }
                }
                .concept-card h1 { font-size: clamp(28px, 6vw, 44px) !important; }
                .meta-grid { grid-template-columns: repeat(2, 1fr) !important; }
                @media (min-width: 640px) {
                    .meta-grid { grid-template-columns: repeat(4, 1fr) !important; }
                }
            `}</style>

          {/* Concept Card */}
          <section className="concept-card" style={{ position: "relative", overflow: "hidden", borderRadius: "32px", padding: "clamp(24px, 6vw, 48px)", background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 90px rgba(0,0,0,0.45)", flex: 1 }}>
            <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "220px", height: "220px", borderRadius: "999px", background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 45%, rgba(255,255,255,0) 70%)", pointerEvents: "none" }} />
            <div style={{ marginBottom: "18px", color: "#9a9a9a", fontSize: "13px", letterSpacing: "0.12em" }}>コイシル</div>
            <h1 style={{ margin: "0 0 18px 0", fontSize: "44px", lineHeight: "1.2", fontWeight: 700 }}>恋愛の違和感を投稿して<br />本音の意見を集める。</h1>
            <p style={{ margin: "0 0 34px 0", color: "#c8c8c8", fontSize: "16px", lineHeight: "1.95", maxWidth: "640px" }}>コイシルは、恋愛の失敗談や、相手への小さな違和感を投稿し、第3者の視点から率直な意見をもらうことができる恋愛特化型の相談プラットフォームです。</p>
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
              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>公開ルール</div>
                <div style={infoTextStyle}>投稿や回答は運営が確認後に修正・削除する場合があります。個人が特定される内容は公開しません。</div>
              </div>
            </div>
          </section>

          {/* Post Form */}
          <section className="side-section" style={{ borderRadius: "32px", padding: "clamp(20px, 5vw, 32px)", background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.025) 100%)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 90px rgba(0,0,0,0.45)" }}>
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "12px", letterSpacing: "0.12em", color: "#8f8f8f", marginBottom: "10px" }}>START POST</div>
              <h2 style={{ margin: 0, fontSize: "26px", lineHeight: "1.15" }}>恋愛相談を投稿する</h2>
            </div>
            <Field label="投稿者ペンネーム" fullWidth>
              <input placeholder="例：恋する会社員" value={postName} onChange={(e) => setPostName(e.target.value)} style={inputStyle} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "14px", marginBottom: "14px" }}>
              <Field label="出会い方">
                <select style={selectStyle} value={meet} onChange={(e) => setMeet(e.target.value)}>
                  <option value="">選択してください</option><option>アプリ</option><option>SNS</option><option>紹介</option><option>職場</option><option>学校</option><option>その他</option>
                </select>
              </Field>
              <Field label="相手との関係">
                <select style={selectStyle} value={relationship} onChange={(e) => setRelationship(e.target.value)}>
                  <option value="">選択</option><option>初対面</option><option>やり取り</option><option>知り合い</option>
                </select>
              </Field>
              <Field label="時間帯">
                <select style={selectStyle} value={time} onChange={(e) => setTime(e.target.value)}>
                  <option value="">選択</option><option>昼</option><option>夜</option><option>深夜</option>
                </select>
              </Field>
              <Field label="デートの長さ">
                <select style={selectStyle} value={length} onChange={(e) => setLength(e.target.value)}>
                  <option value="">選択</option><option>1h前後</option><option>2h前後</option><option>4h以上</option>
                </select>
              </Field>
              <Field label="何をしたか">
                <select style={selectStyle} value={dateType} onChange={(e) => setDateType(e.target.value)}>
                  <option value="">選択</option><option>カフェ</option><option>ご飯</option><option>飲み</option><option>その他</option>
                </select>
              </Field>
              <Field label="相手の反応">
                <select style={selectStyle} value={reaction} onChange={(e) => setReaction(e.target.value)}>
                  <option value="">選択</option><option>良</option><option>普</option><option>微</option>
                </select>
              </Field>
              <Field label="解散後の状況">
                <select style={selectStyle} value={afterStatus} onChange={(e) => setAfterStatus(e.target.value)}>
                  <option value="">選択</option><option>遅い</option><option>無視</option><option>継続中</option>
                </select>
              </Field>
              <Field label="手応え">
                <select style={selectStyle} value={selfFeeling} onChange={(e) => setSelfFeeling(e.target.value)}>
                  <option value="">選択</option><option>優勝</option><option>空回り</option><option>失敗</option>
                </select>
              </Field>
            </div>
            <Field label="相談内容" fullWidth>
              <textarea placeholder="例：マッチングアプリで知り合い..." value={detail} onChange={(e) => setDetail(e.target.value)} style={textareaStyle} />
            </Field>
            <div style={{ marginTop: "22px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <button onClick={handlePost} style={mainButtonStyle}>相談を投稿する</button>
              {notice && <div style={noticeBoxStyle}>{notice}</div>}
            </div>
          </section>
        </div>

        {/* Recent Posts Area */}
        <section style={timelineSectionStyle}>
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "12px", color: "#8f8f8f", marginBottom: "8px" }}>RECENT POSTS</div>
            <h2 style={{ margin: 0, fontSize: "24px" }}>恋愛相談一覧</h2>
          </div>

          {posts.filter(p => p.status === "approved").length === 0 ? (
            <div style={emptyTextStyle}>まだ投稿はありません。</div>
          ) : (
            <div style={{ display: "grid", gap: "20px" }}>
              {posts.filter(p => p.status === "approved").map((post) => {
                const totalVotes = post.ariCount + post.nashiCount;
                const ariPer = totalVotes === 0 ? 50 : Math.round((post.ariCount / totalVotes) * 100);
                return (
                  <div key={post.id} style={postCardStyle}>
                    <div className="meta-grid" style={metaGridStyle}>
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
                      <div style={{ color: "#cfcfcf", fontSize: "12px", lineHeight: "1.5" }}>{post.name} <br/><span style={{ color: "#666", fontSize: "10px" }}>{post.createdAt}</span></div>
                      <button onClick={() => handleDeletePost(post.id)} style={deleteLinkStyle}>削除</button>
                    </div>
                    
                    <div style={postDetailStyle}>{post.detail}</div>

                    {post.updates?.map(up => (
                      <div key={up.id} style={updateBubbleStyle}>
                        <div style={{ fontSize: "10px", color: "#8aa", marginBottom: "4px" }}>追記 {up.createdAt}</div>
                        {up.text}
                      </div>
                    ))}
                    <UpdateInput onAdd={(text) => handleAddUpdate(post.id, text)} />

                    <div style={{ marginTop: "16px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                      <button onClick={() => handlePostLike(post.id)} style={subButtonStyle}>❤ {post.likes}</button>
                      <button onClick={() => handleShareToX(post)} style={subButtonStyle}>X</button>
                      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                        {Object.entries(post.emojiReactions || {}).map(([emoji, count]) => (
                          <button key={emoji} onClick={() => handleEmojiReaction(post.id, emoji)} style={emojiButtonStyle}>{emoji} {count || ""}</button>
                        ))}
                      </div>
                    </div>

                    <div style={answerContainerStyle}>
                      <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "12px" }}>回答</div>
                      <div style={{ display: "grid", gap: "12px", marginBottom: "16px" }}>
                        {post.answers.map((answer) => (
                          <div key={answer.id} style={{ ...answerItemStyle, border: answer.isBest ? "1px solid #ffd700" : "1px solid rgba(255,255,255,0.06)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                              <div style={{ color: "#cfcfcf", fontSize: "11px" }}>
                                {answer.isBest && <span style={{ color: "#ffd700" }}>👑 Best</span>} {answer.name}
                              </div>
                              <button onClick={() => handleDeleteAnswer(post.id, answer.id)} style={deleteLinkStyle}>削除</button>
                            </div>
                            <div style={{fontSize: "14px"}}>{answer.text}</div>
                            <div style={{ marginTop: "8px" }}>
                              <button onClick={() => handleAnswerLike(post.id, answer.id)} style={{...subButtonStyle, padding: "5px 10px"}}>❤ {answer.likes}</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <AnswerBox postId={post.id} onAnswer={handleAnswer} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function UpdateInput({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState("");
  const [show, setShow] = useState(false);
  if (!show) return <button onClick={() => setShow(true)} style={{ marginTop: "12px", background: "none", border: "none", color: "#3498db", fontSize: "12px", cursor: "pointer" }}>+ 追記する</button>;
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
  const [attr, setAttr] = useState("20代・女性");
  const [text, setText] = useState("");
  return (
    <div style={{ marginTop: "14px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
        <input placeholder="名前" value={name} onChange={(e) => setName(e.target.value)} style={answerInputStyle} />
        <select value={attr} onChange={(e) => setAttr(e.target.value)} style={selectStyle}>
          <option>20代・女性</option><option>20代・男性</option><option>30代以上</option>
        </select>
      </div>
      <textarea placeholder="アドバイス..." value={text} onChange={(e) => setText(e.target.value)} style={answerTextareaStyle} />
      <button onClick={() => { onAnswer(postId, name, attr, text); setName(""); setText(""); }} style={answerButtonStyle}>送信</button>
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
const subButtonStyle = { padding: "8px 12px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: "12px", cursor: "pointer" };
const infoCardStyle = { padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" };
const infoLabelStyle = { fontSize: "11px", color: "#666", marginBottom: "4px" };
const infoTextStyle = { fontSize: "13px", lineHeight: "1.6", color: "#ccc" };
const timelineSectionStyle = { marginTop: "24px", borderRadius: "24px", padding: "clamp(16px, 4vw, 24px)", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" };
const emptyTextStyle = { padding: "20px", color: "#555", fontSize: "13px" };
const postCardStyle = { borderRadius: "20px", padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" };
const metaGridStyle = { display: "grid", gap: "8px", marginBottom: "16px" };
const postDetailStyle = { color: "#eee", fontSize: "14px", lineHeight: "1.7", whiteSpace: "pre-wrap" as const };
const answerContainerStyle = { marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.05)" };
const answerItemStyle = { padding: "12px", borderRadius: "12px", background: "rgba(0,0,0,0.2)", color: "#eee" };
const deleteLinkStyle = { background: "none", border: "none", color: "#555", fontSize: "10px", cursor: "pointer" };
const answerInputStyle = { width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "#000", color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box" as const };
const answerTextareaStyle = { ...answerInputStyle, minHeight: "60px", marginBottom: "8px" };
const answerButtonStyle = { padding: "10px 20px", borderRadius: "10px", border: "none", background: "#fff", color: "#000", fontSize: "13px", fontWeight: 700 };
const noticeBoxStyle = { marginTop: "10px", color: "#e74c3c", fontSize: "12px" };
const voteContainerStyle = { marginBottom: "16px", padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" };
const gaugeBarStyle = { height: "6px", background: "#222", borderRadius: "3px", overflow: "hidden", display: "flex" as const };
const ariGaugeStyle = { background: "#ff4d94", transition: "0.5s" };
const voteButtonStyle = { flex: 1, padding: "8px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "11px" };
const updateBubbleStyle = { marginTop: "12px", padding: "10px", background: "rgba(52,152,219,0.1)", borderRadius: "12px", fontSize: "13px", border: "1px solid rgba(52,152,219,0.2)" };
const emojiButtonStyle = { padding: "5px 10px", borderRadius: "15px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "11px" };