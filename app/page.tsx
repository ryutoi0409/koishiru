"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// --- Supabase クライアント初期化 ---
// Vercel の Environment Variables に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されている前提です
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- 型定義 ---
type Answer = {
  id: number;
  name: string;
  attr: string;
  text: string;
  likes: number;
  createdat: string;
  status: string;
  isbest: boolean;
};

type Post = {
  id: number;
  name: string;
  meet: string;
  relationship: string;
  time: string;
  length: string;
  datetype: string;
  reaction: string;
  afterstatus: string;
  selffeeling: string;
  detail: string;
  likes: number;
  aricount: number;
  nashicount: number;
  emojireactions: { [key: string]: number };
  updates: { id: number; text: string; createdat: string }[];
  answers: Answer[];
  createdat: string;
  status: string;
};

export default function Home() {
  // --- フォーム用のステート ---
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

  // --- 表示データ・通知用のステート ---
  const [posts, setPosts] = useState<Post[]>([]);
  const [notice, setNotice] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputPass, setInputPass] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // --- Supabaseから全データを取得する関数 ---
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

      if (postsError || answersError) {
        throw postsError || answersError;
      }

      // 投稿データに回答データを紐付ける
      const combined = (postsData || []).map((p: any) => ({
        ...p,
        answers: (answersData || []).filter((a: any) => a.post_id === p.id)
      }));

      setPosts(combined);
    } catch (e: any) {
      console.error("Fetch Error:", e);
      setNotice("データ取得失敗: " + e.message);
    } finally {
      setIsLoaded(true);
    }
  };

  // --- 起動時に一度だけ取得 ---
  useEffect(() => {
    fetchPosts();
  }, []);

  // --- 管理者パスワードチェック ---
  const checkAdmin = (val: string) => {
    setInputPass(val);
    if (val === "koishiru-admin") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  // --- 日時取得 ---
  const getNow = () => {
    const now = new Date();
    const Y = now.getFullYear();
    const M = (now.getMonth() + 1).toString().padStart(2, '0');
    const D = now.getDate().toString().padStart(2, '0');
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    return `${Y}/${M}/${D} ${h}:${m}`;
  };

  // --- 相談を新規投稿する ---
  const handlePost = async () => {
    if (!detail.trim()) {
      setNotice("相談内容を入力してください。");
      return;
    }

    setNotice("送信中...");

    const newPostObject = {
      id: Date.now(),
      name: postName.trim() || "名無し",
      meet: meet || "未選択",
      relationship: relationship || "未選択",
      time: time || "未選択",
      length: length || "未選択",
      datetype: dateType || "未選択",
      reaction: reaction || "未選択",
      afterstatus: afterStatus || "未選択",
      selffeeling: selfFeeling || "未選択",
      detail: detail.trim(),
      status: "approved",
      likes: 0,
      aricount: 0,
      nashicount: 0,
      emojireactions: { "それな": 0, "沼": 0, "尊い": 0, "草": 0 },
      updates: [],
      createdat: getNow(),
    };

    const { error } = await supabase.from("posts").insert([newPostObject]);
    
    if (error) {
      console.error("Insert Error:", error);
      setNotice("投稿失敗: " + error.message);
      return;
    }

    setNotice("投稿が完了しました！");
    // フォームを空にする
    setPostName("");
    setMeet("");
    setRelationship("");
    setTime("");
    setLength("");
    setDateType("");
    setReaction("");
    setAfterStatus("");
    setSelfFeeling("");
    setDetail("");
    
    // データを再読み込み
    fetchPosts();
  };

  // --- 脈あり/なし 投票 ---
  const handleVote = async (postId: number, type: 'ari' | 'nashi') => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const updateData = type === 'ari' 
      ? { aricount: (post.aricount || 0) + 1 } 
      : { nashicount: (post.nashicount || 0) + 1 };
      
    await supabase.from("posts").update(updateData).eq("id", postId);
    fetchPosts();
  };

  // --- いいね（投稿） ---
  const handlePostLike = async (postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    await supabase.from("posts").update({ likes: (post.likes || 0) + 1 }).eq("id", postId);
    fetchPosts();
  };

  // --- エモリアクション ---
  const handleEmojiReaction = async (postId: number, emoji: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const currentEmojiData = post.emojireactions || { "それな": 0, "沼": 0, "尊い": 0, "草": 0 };
    const newReactions = { ...currentEmojiData, [emoji]: (currentEmojiData[emoji] || 0) + 1 };
    await supabase.from("posts").update({ emojireactions: newReactions }).eq("id", postId);
    fetchPosts();
  };

  // --- 追記（追いコイシル） ---
  const handleAddUpdate = async (postId: number, text: string) => {
    if (!text.trim()) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const newUpdates = [...(post.updates || []), { id: Date.now(), text, createdat: getNow() }];
    await supabase.from("posts").update({ updates: newUpdates }).eq("id", postId);
    fetchPosts();
  };

  // --- 回答投稿 ---
  const handleAnswer = async (postId: number, name: string, attr: string, text: string) => {
    if (!text.trim()) return;
    const newAnswerObject = {
      id: Date.now(),
      post_id: postId,
      name: name.trim() || "名無し",
      attr,
      text: text.trim(),
      likes: 0,
      status: "approved",
      createdat: getNow(),
      isbest: false
    };
    await supabase.from("answers").insert([newAnswerObject]);
    fetchPosts();
  };

  // --- いいね（回答） ---
  const handleAnswerLike = async (postId: number, answerId: number) => {
    const post = posts.find(p => p.id === postId);
    const answer = post?.answers.find(a => a.id === answerId);
    if (!answer) return;
    await supabase.from("answers").update({ likes: (answer.likes || 0) + 1 }).eq("id", answerId);
    fetchPosts();
  };

  // --- 削除機能（管理者用） ---
  const handleDeletePost = async (postId: number) => {
    if (!isAdmin) return;
    if (confirm("この相談を完全に削除しますか？")) {
      await supabase.from("posts").delete().eq("id", postId);
      fetchPosts();
    }
  };

  const handleDeleteAnswer = async (postId: number, answerId: number) => {
    if (!isAdmin) return;
    if (confirm("この回答を削除しますか？")) {
      await supabase.from("answers").delete().eq("id", answerId);
      fetchPosts();
    }
  };

  const handleSetBestAnswer = async (postId: number, answerId: number) => {
    if (!isAdmin) return;
    await supabase.from("answers").update({ isbest: false }).eq("post_id", postId);
    await supabase.from("answers").update({ isbest: true }).eq("id", answerId);
    fetchPosts();
  };

  // --- X共有 ---
  const handleShareToX = (post: Post) => {
    const text = `【コイシル】投稿者：${post.name}\n${post.detail.substring(0, 60)}...\n#コイシル #恋愛相談`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // --- ローディング画面 ---
  if (!isLoaded) {
    return (
      <div style={{ background: "#000", color: "#fff", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
        読み込み中...
      </div>
    );
  }

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
        {/* Header / Admin Login */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "8px 14px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.03)", color: "#d1d1d1", fontSize: "12px", letterSpacing: "0.14em" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "linear-gradient(135deg, #f0f0f0 0%, #8a8a8a 100%)", display: "inline-block" }} />
            コイシル {isAdmin && <span style={{ color: "#ffd700", marginLeft: "8px" }}>● 管理者モード</span>}
          </div>
          <input 
            type="password" 
            placeholder="Admin..." 
            value={inputPass} 
            onChange={(e) => checkAdmin(e.target.value)} 
            style={{ background: "transparent", border: "none", color: "#222", fontSize: "10px", width: "60px", outline: "none" }} 
          />
        </div>

        <div className="main-grid" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          {/* CSS inside Component */}
          <style jsx>{`
            .main-grid { flex-direction: column !important; }
            @media (min-width: 1024px) {
              .main-grid { flex-direction: row !important; align-items: start; }
              .side-section { width: 450px !important; flex-shrink: 0; position: sticky; top: 20px; }
            }
            .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr) !important; gap: 8px; margin-bottom: 16px; }
            @media (min-width: 640px) {
              .meta-grid { grid-template-columns: repeat(4, 1fr) !important; }
            }
          `}</style>

          {/* Left Side: Concept Section */}
          <section style={{ position: "relative", overflow: "hidden", borderRadius: "32px", padding: "clamp(24px, 6vw, 48px)", background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 90px rgba(0,0,0,0.45)", flex: 1 }}>
            <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "220px", height: "220px", borderRadius: "999px", background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 45%, rgba(255,255,255,0) 70%)", pointerEvents: "none" }} />
            <h1 style={{ margin: "0 0 18px 0", fontSize: "clamp(28px, 6vw, 44px)", lineHeight: "1.2", fontWeight: 700 }}>恋愛の違和感を投稿して<br />本音の意見を集める。</h1>
            <p style={{ margin: "0 0 34px 0", color: "#c8c8c8", fontSize: "16px", lineHeight: "1.95", maxWidth: "640px" }}>恋愛の小さな違和感を投稿し、第3者の視点から率直な意見をもらうことができる恋愛特化型の相談プラットフォームです。</p>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "28px" }}>
              {[["01", "恋愛の違和感投稿"], ["02", "内容の確認"], ["03", "回答の収集"], ["04", "意見の共有"]].map(([num, title]) => (
                <div key={num} style={{ padding: "16px", borderRadius: "20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ fontSize: "10px", color: "#8f8f8f", marginBottom: "8px" }}>STEP {num}</div>
                  <div style={{ fontSize: "15px", fontWeight: 700 }}>{title}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px" }}>
              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>このページでできること</div>
                <div style={infoTextStyle}>恋愛の違和感や失敗を整理して投稿し、他の人の視点から「何が問題だったのか」を客観的に知ることができます。</div>
              </div>
              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>公開ルール</div>
                <div style={infoTextStyle}>投稿や回答は運営が確認後に修正・削除する場合があります。個人が特定される情報は入力しないでください。</div>
              </div>
            </div>
          </section>

          {/* Right Side: Post Form Section */}
          <section className="side-section" style={{ borderRadius: "32px", padding: "clamp(20px, 5vw, 32px)", background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.025) 100%)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 90px rgba(0,0,0,0.45)" }}>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ margin: 0, fontSize: "26px", lineHeight: "1.15" }}>恋愛相談を投稿する</h2>
            </div>
            
            <Field label="ペンネーム" fullWidth>
              <input placeholder="例：恋する会社員" value={postName} onChange={(e) => setPostName(e.target.value)} style={inputStyle} />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "14px", marginBottom: "14px" }}>
              <Field label="出会い方">
                <select style={selectStyle} value={meet} onChange={(e) => setMeet(e.target.value)}>
                  <option value="">選択</option>
                  <option>マッチングアプリ</option>
                  <option>SNS</option>
                  <option>紹介</option>
                  <option>職場</option>
                  <option>学校</option>
                  <option>その他</option>
                </select>
              </Field>
              <Field label="関係">
                <select style={selectStyle} value={relationship} onChange={(e) => setRelationship(e.target.value)}>
                  <option value="">選択</option>
                  <option>初対面</option>
                  <option>やり取りあり</option>
                  <option>知り合い</option>
                </select>
              </Field>
              <Field label="時間帯">
                <select style={selectStyle} value={time} onChange={(e) => setTime(e.target.value)}>
                  <option value="">選択</option>
                  <option>昼</option>
                  <option>夜</option>
                  <option>深夜</option>
                </select>
              </Field>
              <Field label="長さ">
                <select style={selectStyle} value={length} onChange={(e) => setLength(e.target.value)}>
                  <option value="">選択</option>
                  <option>1h前後</option>
                  <option>2h前後</option>
                  <option>4h以上</option>
                </select>
              </Field>
              <Field label="内容">
                <select style={selectStyle} value={dateType} onChange={(e) => setDateType(e.target.value)}>
                  <option value="">選択</option>
                  <option>カフェ</option>
                  <option>ご飯</option>
                  <option>飲み</option>
                  <option>その他</option>
                </select>
              </Field>
              <Field label="反応">
                <select style={selectStyle} value={reaction} onChange={(e) => setReaction(e.target.value)}>
                  <option value="">選択</option>
                  <option>良好</option>
                  <option>普通</option>
                  <option>微妙</option>
                </select>
              </Field>
              <Field label="その後">
                <select style={selectStyle} value={afterStatus} onChange={(e) => setAfterStatus(e.target.value)}>
                  <option value="">選択</option>
                  <option>返信遅い</option>
                  <option>無視</option>
                  <option>継続中</option>
                </select>
              </Field>
              <Field label="手応え">
                <select style={selectStyle} value={selfFeeling} onChange={(e) => setSelfFeeling(e.target.value)}>
                  <option value="">選択</option>
                  <option>脈あり</option>
                  <option>ふつう</option>
                  <option>空回り</option>
                  <option>失敗</option>
                </select>
              </Field>
            </div>

            <Field label="相談内容" fullWidth>
              <textarea placeholder="例：マッチングアプリで知り合った人と..." value={detail} onChange={(e) => setDetail(e.target.value)} style={textareaStyle} />
            </Field>

            <button onClick={handlePost} style={mainButtonStyle}>相談を投稿する</button>
            {notice && <div style={{ ...noticeBoxStyle, color: notice.includes("完了") ? "#2ecc71" : "#ff4d4d" }}>{notice}</div>}
          </section>
        </div>

        {/* Timeline / Posts List */}
        <section style={{ marginTop: "40px", display: "grid", gap: "20px" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "10px" }}>相談一覧</h2>

          {posts.length === 0 ? (
            <div style={emptyTextStyle}>まだ投稿はありません。</div>
          ) : (
            posts.map((post) => {
              const totalVotes = (post.aricount || 0) + (post.nashicount || 0);
              const ariPer = totalVotes === 0 ? 50 : Math.round((post.aricount / totalVotes) * 100);
              return (
                <div key={post.id} style={postCardStyle}>
                  {/* Post Metadata */}
                  <div className="meta-grid">
                    <Meta label="出会い" value={post.meet} />
                    <Meta label="関係" value={post.relationship} />
                    <Meta label="時間" value={post.time} />
                    <Meta label="内容" value={post.datetype} />
                  </div>

                  {/* Voting Gauge */}
                  <div style={voteContainerStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "8px" }}>
                      <span style={{ color: "#ff4d94", fontWeight: "bold" }}>脈あり {ariPer}%</span>
                      <span style={{ color: "#888" }}>脈なし {100 - ariPer}%</span>
                    </div>
                    <div style={gaugeBarStyle}>
                      <div style={{ ...ariGaugeStyle, width: `${ariPer}%` }} />
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                      <button onClick={() => handleVote(post.id, 'ari')} style={voteButtonStyle}>脈あり👍</button>
                      <button onClick={() => handleVote(post.id, 'nashi')} style={voteButtonStyle}>脈なし💀</button>
                    </div>
                  </div>

                  {/* Name and Date */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "12px" }}>
                    <div>
                      <span style={{ color: "#fff" }}>{post.name}</span>
                      <span style={{ color: "#666", marginLeft: "10px" }}>{post.createdat}</span>
                    </div>
                    {isAdmin && (
                      <button onClick={() => handleDeletePost(post.id)} style={{ color: "#ff4d4d", background: "none", border: "none", cursor: "pointer", fontSize: "11px" }}>削除</button>
                    )}
                  </div>
                  
                  {/* Main Detail Text */}
                  <div style={postDetailStyle}>{post.detail}</div>

                  {/* Updates (追いLINE風) */}
                  {post.updates && post.updates.length > 0 && (
                    <div style={{ display: "grid", gap: "8px", marginTop: "16px" }}>
                      {post.updates.map(up => (
                        <div key={up.id} style={updateBubbleStyle}>
                          <div style={{ fontSize: "10px", color: "#8aa", marginBottom: "4px" }}>追記 {up.createdat}</div>
                          {up.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Update Input Component */}
                  <UpdateInput onAdd={(text: string) => handleAddUpdate(post.id, text)} />

                  {/* Like & Share & Emojis */}
                  <div style={{ marginTop: "20px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    <button onClick={() => handlePostLike(post.id)} style={subButtonStyle}>❤ {post.likes || 0}</button>
                    <button onClick={() => handleShareToX(post)} style={subButtonStyle}>Xで共有</button>
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                      {Object.entries(post.emojireactions || { "それな": 0, "沼": 0, "尊い": 0, "草": 0 }).map(([emoji, count]) => (
                        <button key={emoji} onClick={() => handleEmojiReaction(post.id, emoji)} style={emojiButtonStyle}>
                          {emoji} {count || 0}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Answers Section */}
                  <div style={answerContainerStyle}>
                    <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "12px", color: "#ddd" }}>回答一覧</div>
                    <div style={{ display: "grid", gap: "12px", marginBottom: "16px" }}>
                      {(post.answers || []).map((ans) => (
                        <div key={ans.id} style={{ ...answerItemStyle, border: ans.isbest ? "1px solid #ffd700" : "1px solid rgba(255,255,255,0.06)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                            <div>
                              {ans.isbest && <span style={{ color: "#ffd700", marginRight: "5px" }}>👑 ベスト</span>}
                              <span style={{ color: "#888" }}>{ans.name} ({ans.attr})</span>
                              <span style={{ color: "#555", marginLeft: "10px" }}>{ans.createdat}</span>
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              {isAdmin && (
                                <>
                                  <button onClick={() => handleSetBestAnswer(post.id, ans.id)} style={{ color: "#ffd700", background: "none", border: "none", fontSize: "10px", cursor: "pointer" }}>ベストに設定</button>
                                  <button onClick={() => handleDeleteAnswer(post.id, ans.id)} style={{ color: "#ff4d4d", background: "none", border: "none", fontSize: "10px", cursor: "pointer" }}>削除</button>
                                </>
                              )}
                            </div>
                          </div>
                          <div style={{ fontSize: "14px", color: "#eee", lineHeight: "1.6" }}>{ans.text}</div>
                          <button onClick={() => handleAnswerLike(post.id, ans.id)} style={{ ...subButtonStyle, padding: "4px 8px", marginTop: "10px", fontSize: "10px" }}>❤ {ans.likes || 0}</button>
                        </div>
                      ))}
                    </div>

                    {/* Answer Input Component */}
                    <AnswerBox postId={post.id} onAnswer={handleAnswer} />
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}

// --- Sub Components (Everything here is NOT OMITTED) ---

function UpdateInput({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState("");
  const [show, setShow] = useState(false);

  if (!show) {
    return (
      <button onClick={() => setShow(true)} style={{ marginTop: "14px", background: "none", border: "none", color: "#3498db", fontSize: "11px", cursor: "pointer", textDecoration: "underline" }}>
        + 追記を投稿する（追いコイシル）
      </button>
    );
  }

  return (
    <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
      <input 
        placeholder="今の状況を追記..." 
        value={text} 
        onChange={e => setText(e.target.value)} 
        style={answerInputStyle} 
      />
      <button 
        onClick={() => { onAdd(text); setText(""); setShow(false); }} 
        style={{ ...subButtonStyle, background: "#3498db", color: "#fff" }}
      >
        追加
      </button>
    </div>
  );
}

function Field({ label, children, fullWidth = false }: { label: string; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div style={{ gridColumn: fullWidth ? "1 / -1" : undefined }}>
      <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "#8f8f8f" }}>{label}</label>
      {children}
    </div>
  );
}

function AnswerBox({ postId, onAnswer }: { postId: number; onAnswer: any }) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [attr, setAttr] = useState("20代・女性");

  return (
    <div style={{ marginTop: "18px", padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
        <input 
          placeholder="お名前" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          style={answerInputStyle} 
        />
        <select value={attr} onChange={(e) => setAttr(e.target.value)} style={selectStyle}>
          <option>20代・女性</option>
          <option>20代・男性</option>
          <option>30代以上</option>
          <option>既婚者</option>
        </select>
      </div>
      <textarea 
        placeholder="客観的なアドバイスを投稿..." 
        value={text} 
        onChange={(e) => setText(e.target.value)} 
        style={{ ...answerInputStyle, minHeight: "80px" }} 
      />
      <button 
        onClick={() => { onAnswer(postId, name, attr, text); setName(""); setText(""); }} 
        style={{ ...mainButtonStyle, padding: "12px", fontSize: "14px", marginTop: "10px" }}
      >
        回答を投稿する
      </button>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ fontSize: "10px", color: "#666", marginBottom: "2px" }}>{label}</div>
      <div style={{ fontSize: "13px", color: "#ddd" }}>{value || "-"}</div>
    </div>
  );
}

// --- Style Definitions (All here) ---

const inputStyle = { 
  width: "100%", 
  padding: "12px", 
  borderRadius: "12px", 
  border: "1px solid rgba(255,255,255,0.1)", 
  background: "rgba(0,0,0,0.3)", 
  color: "#fff", 
  fontSize: "14px", 
  outline: "none", 
  boxSizing: "border-box" as const 
};

const selectStyle = { 
  ...inputStyle, 
  appearance: "none" as const,
  cursor: "pointer"
};

const textareaStyle = { 
  ...inputStyle, 
  minHeight: "130px", 
  lineHeight: "1.6", 
  resize: "vertical" as const 
};

const mainButtonStyle = { 
  width: "100%", 
  padding: "16px", 
  borderRadius: "14px", 
  border: "none", 
  background: "#ffffff", 
  color: "#000000", 
  fontSize: "16px", 
  fontWeight: 800, 
  cursor: "pointer",
  transition: "opacity 0.2s"
};

const subButtonStyle = { 
  padding: "8px 14px", 
  borderRadius: "10px", 
  border: "none", 
  background: "rgba(255,255,255,0.08)", 
  color: "#ffffff", 
  fontSize: "12px", 
  cursor: "pointer" 
};

const infoCardStyle = { 
  padding: "18px", 
  borderRadius: "20px", 
  background: "rgba(255,255,255,0.03)", 
  border: "1px solid rgba(255,255,255,0.06)" 
};

const infoLabelStyle = { 
  fontSize: "11px", 
  color: "#666", 
  marginBottom: "6px",
  letterSpacing: "0.05em"
};

const infoTextStyle = { 
  fontSize: "13px", 
  lineHeight: "1.7", 
  color: "#bbbbbb" 
};

const emptyTextStyle = { 
  padding: "40px", 
  color: "#444", 
  fontSize: "14px", 
  textAlign: "center" as const,
  background: "rgba(255,255,255,0.01)",
  borderRadius: "20px",
  border: "1px dashed rgba(255,255,255,0.05)"
};

const postCardStyle = { 
  borderRadius: "28px", 
  padding: "clamp(20px, 4vw, 32px)", 
  background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)", 
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
};

const postDetailStyle = { 
  color: "#f0f0f0", 
  fontSize: "15px", 
  lineHeight: "1.8", 
  whiteSpace: "pre-wrap" as const,
  marginBottom: "10px"
};

const answerContainerStyle = { 
  marginTop: "24px", 
  paddingTop: "24px", 
  borderTop: "1px solid rgba(255,255,255,0.05)" 
};

const answerItemStyle = { 
  padding: "16px", 
  borderRadius: "16px", 
  background: "rgba(0,0,0,0.25)", 
  color: "#eee" 
};

const answerInputStyle = { 
  width: "100%", 
  padding: "12px", 
  borderRadius: "10px", 
  border: "1px solid rgba(255,255,255,0.1)", 
  background: "#000000", 
  color: "#ffffff", 
  fontSize: "13px", 
  outline: "none", 
  boxSizing: "border-box" as const 
};

const voteContainerStyle = { 
  marginBottom: "20px", 
  padding: "16px", 
  background: "rgba(0,0,0,0.2)", 
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.03)"
};

const gaugeBarStyle = { 
  height: "8px", 
  background: "#111", 
  borderRadius: "4px", 
  overflow: "hidden", 
  display: "flex" as const 
};

const ariGaugeStyle = { 
  background: "linear-gradient(90deg, #ff4d94 0%, #ff80b3 100%)", 
  transition: "width 0.6s cubic-bezier(0.23, 1, 0.32, 1)" 
};

const voteButtonStyle = { 
  flex: 1, 
  padding: "10px", 
  borderRadius: "10px", 
  background: "rgba(255,255,255,0.04)", 
  border: "1px solid rgba(255,255,255,0.08)", 
  color: "#ffffff", 
  fontSize: "12px",
  cursor: "pointer"
};

const updateBubbleStyle = { 
  padding: "12px 16px", 
  background: "rgba(52,152,219,0.08)", 
  borderRadius: "16px", 
  fontSize: "13px", 
  border: "1px solid rgba(52,152,219,0.15)",
  color: "#d0e8f8"
};

const emojiButtonStyle = { 
  padding: "6px 12px", 
  borderRadius: "20px", 
  background: "rgba(255,255,255,0.03)", 
  border: "1px solid rgba(255,255,255,0.06)", 
  color: "#ffffff", 
  fontSize: "12px",
  cursor: "pointer"
};

const noticeBoxStyle = { 
  marginTop: "16px", 
  fontSize: "13px", 
  textAlign: "center" as const,
  fontWeight: "bold"
};
