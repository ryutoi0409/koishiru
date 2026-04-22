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
  name: string;
  attr: string; // 回答者属性
  text: string;
  likes: number;
  createdAt: string; // 投稿日時
  status: "pending" | "approved";
  isBest?: boolean; // ★ベストアドバイス用
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
  ariCount: number; // ★脈あり投票
  nashiCount: number; // ★脈なし投票
  emojiReactions: { [key: string]: number }; // ★エモリアクション
  updates: { id: number; text: string; createdAt: string }[]; // ★追いLINE風追記
  answers: Answer[];
  createdAt: string; // 投稿日時
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

  // 表示順切り替え用のステート
  const [filterTab, setFilterTab] = useState<"NEW" | "盛り上がり">("NEW");
  
  // ページネーション用ステート
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 4;

  // ★管理者設定
  const ADMIN_PASSWORD = "koishiru-admin"; 
  const [inputPass, setInputPass] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // --- Supabaseからデータを取得する関数 ---
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
    } catch (e: any) {
      console.error("Fetch Error:", e);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

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

  const handlePost = async () => {
    if (!detail.trim()) {
      setNotice("相談内容を入力してください。");
      return;
    }

    const newPost = {
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
      createdAt: getNow(),
    };

    const { error } = await supabase.from("posts").insert([newPost]);
    
    if (error) {
      setNotice("投稿失敗: " + error.message);
      return;
    }

    setNotice("投稿が完了しました");
    fetchPosts();
    setPostName(""); setMeet(""); setRelationship(""); setTime(""); setLength("");
    setDateType(""); setReaction(""); setAfterStatus(""); setSelfFeeling(""); setDetail("");
    setCurrentPage(1); // 投稿後は1ページ目に戻す
  };

  const handleDeletePost = async (postId: number) => {
    if (!isAdmin) return;
    if (confirm("この相談を削除しますか？")) {
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

  const handleAnswer = async (postId: number, name: string, attr: string, text: string) => {
    if (!text.trim()) return;
    const newAnswer = {
      id: Date.now(),
      post_id: postId,
      name: name.trim() || "名無し",
      attr, text: text.trim(), likes: 0, status: "approved", createdAt: getNow(),
      isBest: false
    };
    await supabase.from("answers").insert([newAnswer]);
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
    const currentEmojiData = post.emojiReactions || { "それな": 0, "沼": 0, "尊い": 0, "草": 0 };
    const newReactions = { ...currentEmojiData, [emoji]: (currentEmojiData[emoji] || 0) + 1 };
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

  const handleSetBestAnswer = async (postId: number, answerId: number) => {
    if (!isAdmin) return;
    await supabase.from("answers").update({ isBest: false }).eq("post_id", postId);
    await supabase.from("answers").update({ isBest: true }).eq("id", answerId);
    fetchPosts();
  };

  const handleShareToX = (post: Post) => {
    const text = `【コイシル】投稿者：${post.name}\n${post.detail}\n\n#コイシル #恋愛相談`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // --- 表示用フィルタリングとソート ---
  const sortedPosts = [...posts].sort((a, b) => {
    if (filterTab === "盛り上がり") {
      return (b.ariCount + b.nashiCount) - (a.ariCount + a.nashiCount);
    }
    return b.id - a.id;
  });

  // --- ページネーション計算 ---
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = sortedPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(sortedPosts.length / postsPerPage);

  if (!isLoaded) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #1c1c1c 0%, #0b0b0b 42%, #050505 100%)",
        color: "#ffffff",
        padding: "clamp(16px, 4vw, 48px) clamp(10px, 3vw, 20px)",
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
                /* メタ情報のグリッドをスマホで2列、PCで4列に自動調整 */
                .meta-grid { 
                  display: grid; 
                  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important; 
                  gap: 8px; 
                  margin-bottom: 16px; 
                }
            `}</style>

          {/* Concept Card */}
          <section style={{ position: "relative", overflow: "hidden", borderRadius: "32px", padding: "clamp(24px, 6vw, 48px)", background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 90px rgba(0,0,0,0.45)", flex: 1 }}>
            <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "220px", height: "220px", borderRadius: "999px", background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 45%, rgba(255,255,255,0) 70%)", pointerEvents: "none" }} />
            <div style={{ marginBottom: "18px", color: "#9a9a9a", fontSize: "13px", letterSpacing: "0.12em" }}>コイシル</div>
            <h1 style={{ margin: "0 0 18px 0", fontSize: "clamp(28px, 6vw, 44px)", lineHeight: "1.2", fontWeight: 700 }}>恋愛の違和感を投稿して<br />本音の意見を集める。</h1>
            <p style={{ margin: "0 0 34px 0", color: "#c8c8c8", fontSize: "16px", lineHeight: "1.95", maxWidth: "640px" }}>コイシルは、恋愛の失敗談や、相手への小さな違和感を投稿し、第3者の視点から率直な意見をもらうことができる恋愛特化型の相談プラットフォームです。</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "28px" }}>
              {[["01", "恋愛の違和感を投稿"], ["02", "運営が内容を確認"], ["03", "回答を集める"], ["04", "役立つ相談を広げる"]].map(([num, title]) => (
                <div key={num} style={{ padding: "16px", borderRadius: "20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ fontSize: "10px", color: "#8f8f8f", marginBottom: "8px" }}>POINT {num}</div>
                  <div style={{ fontSize: "15px", fontWeight: 700 }}>{title}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px" }}>
              <div style={infoCardStyle}><div style={infoLabelStyle}>このページでできること</div><div style={infoTextStyle}>恋愛の違和感や失敗を整理して投稿し、他の人の視点から「何が問題だったのか」を知ることができます。</div></div>
              <div style={infoCardStyle}><div style={infoLabelStyle}>公開ルール</div><div style={infoTextStyle}>投稿や回答は運営が確認後に修正・削除する場合があります。個人が特定される内容は公開しません。</div></div>
            </div>
          </section>

          {/* Post Form Section */}
          <section className="side-section" style={{ borderRadius: "32px", padding: "clamp(20px, 5vw, 32px)", background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.025) 100%)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 90px rgba(0,0,0,0.45)" }}>
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "12px", letterSpacing: "0.12em", color: "#8f8f8f", marginBottom: "10px" }}>START POST</div>
              <h2 style={{ margin: 0, fontSize: "26px", lineHeight: "1.15" }}>恋愛相談を投稿する</h2>
            </div>
            <Field label="投稿者ペンネーム" fullWidth>
              <input placeholder="例：恋する会社員" value={postName} onChange={(e) => setPostName(e.target.value)} style={inputStyle} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "14px", marginBottom: "14px" }}>
              <Field label="出会い方"><select style={selectStyle} value={meet} onChange={(e) => setMeet(e.target.value)}><option value="">選択</option><option>マッチングアプリ</option><option>SNS</option><option>紹介</option><option>職場</option><option>学校</option><option>その他</option></select></Field>
              <Field label="関係"><select style={selectStyle} value={relationship} onChange={(e) => setRelationship(e.target.value)}><option value="">選択</option><option>初対面</option><option>少しやり取り</option><option>知り合い</option></select></Field>
              <Field label="時間帯"><select style={selectStyle} value={time} onChange={(e) => setTime(e.target.value)}><option value="">選択</option><option>昼</option><option>夜</option><option>深夜</option></select></Field>
              <Field label="長さ"><select style={selectStyle} value={length} onChange={(e) => setLength(e.target.value)}><option value="">選択</option><option>1h前後</option><option>2h前後</option><option>4h以上</option></select></Field>
              <Field label="何をしたか"><select style={selectStyle} value={dateType} onChange={(e) => setDateType(e.target.value)}><option value="">選択</option><option>カフェ</option><option>ご飯</option><option>飲み</option><option>映画</option><option>ドライブ</option><option>その他</option></select></Field>
              <Field label="反応"><select style={selectStyle} value={reaction} onChange={(e) => setReaction(e.target.value)}><option value="">選択</option><option>盛り上がった</option><option>普通</option><option>微妙</option></select></Field>
              <Field label="その後"><select style={selectStyle} value={afterStatus} onChange={(e) => setAfterStatus(e.target.value)}><option value="">選択</option><option>返信遅い</option><option>無視</option><option>継続中</option></select></Field>
              <Field label="手応え">
                <select style={selectStyle} value={selfFeeling} onChange={(e) => setSelfFeeling(e.target.value)}>
                  <option value="">選択</option>
                  <option>最高（脈あり確信）</option><option>好感触（また会えそう）</option><option>普通（可もなく不可もなし）</option>
                  <option>微妙（会話が盛り上がらず）</option><option>空回り（やらかしたかも）</option><option>脈なし（フェードアウト確定）</option>
                </select>
              </Field>
            </div>
            <Field label="相談内容" fullWidth>
              <textarea placeholder="例：マッチングアプリで知り合い..." value={detail} onChange={(e) => setDetail(e.target.value)} style={textareaStyle} />
            </Field>
            <button onClick={handlePost} style={mainButtonStyle}>相談を投稿する</button>
            {notice && <div style={{...noticeBoxStyle, color: notice.includes("完了") ? "#2ecc71" : "#e74c3c", marginTop: "10px"}}>{notice}</div>}
          </section>
        </div>

        {/* Timeline Section */}
        <section style={{ marginTop: "40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px", gap: "10px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "12px", color: "#8f8f8f", marginBottom: "8px" }}>RECENT POSTS</div>
              <h2 style={{ margin: 0, fontSize: "24px" }}>恋愛相談一覧</h2>
            </div>
            <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", padding: "4px", borderRadius: "10px" }}>
              <button onClick={() => {setFilterTab("NEW"); setCurrentPage(1);}} style={{ ...tabBtnStyle, background: filterTab === "NEW" ? "rgba(255,255,255,0.1)" : "transparent" }}>NEW</button>
              <button onClick={() => {setFilterTab("盛り上がり"); setCurrentPage(1);}} style={{ ...tabBtnStyle, background: filterTab === "盛り上がり" ? "rgba(255,255,255,0.1)" : "transparent" }}>盛り上がり</button>
            </div>
          </div>

          <div style={{ display: "grid", gap: "20px" }}>
            {currentPosts.length === 0 ? (
              <div style={emptyTextStyle}>まだ投稿はありません。</div>
            ) : (
              currentPosts.map((post, index) => {
                const totalVotes = post.ariCount + post.nashiCount;
                const ariPer = totalVotes === 0 ? 50 : Math.round((post.ariCount / totalVotes) * 100);
                const isGlobalIndex = indexOfFirstPost + index;
                const showNewBadge = filterTab === "NEW" && isGlobalIndex < 3;

                return (
                  <div key={post.id} style={postCardStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                      {showNewBadge && <span style={newBadgeStyle}>NEW</span>}
                      <div style={{ color: "#cfcfcf", fontSize: "12px", fontWeight: "bold" }}>{post.name}</div>
                      <div style={{ color: "#666", fontSize: "10px" }}>{post.createdAt}</div>
                    </div>
                    
                    <div className="meta-grid">
                      <Meta label="出会い" value={post.meet} />
                      <Meta label="関係" value={post.relationship} />
                      <Meta label="時間" value={post.time} />
                      <Meta label="長さ" value={post.length} />
                      <Meta label="内容" value={post.dateType} />
                      <Meta label="反応" value={post.reaction} />
                      <Meta label="その後" value={post.afterStatus} />
                      <Meta label="手応え" value={post.selfFeeling} />
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

                    <div style={postDetailStyle}>{post.detail}</div>

                    {post.updates?.map(up => (
                      <div key={up.id} style={updateBubbleStyle}>
                        <div style={{ fontSize: "10px", color: "#8aa", marginBottom: "4px", fontWeight: "bold" }}>追記 {up.createdAt}</div>
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
                      {isAdmin && <button onClick={() => handleDeletePost(post.id)} style={{ color: "#ff4d4d", fontSize: "10px", background: "none", border: "none", cursor: "pointer", marginLeft: "auto" }}>削除</button>}
                    </div>

                    <div style={answerContainerStyle}>
                      <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "12px", color: "#fff" }}>回答</div>
                      <div style={{ display: "grid", gap: "12px", marginBottom: "16px" }}>
                        {post.answers.map((ans) => (
                          <div key={ans.id} style={{ ...answerItemStyle, border: ans.isBest ? "1px solid #ffd700" : "1px solid rgba(255,255,255,0.06)", background: ans.isBest ? "rgba(255,215,0,0.05)" : "rgba(0,0,0,0.2)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                              <div style={{ fontSize: "11px", color: "#888" }}>{ans.isBest && "👑 "}{ans.name} ({ans.attr}) <span style={{fontSize: "9px"}}>{ans.createdAt}</span></div>
                              <div style={{display:"flex", gap:"8px"}}>
                                {isAdmin && <button onClick={() => handleSetBestAnswer(post.id, ans.id)} style={{ color: "#ffd700", fontSize: "9px", background: "none", border: "none" }}>ベスト</button>}
                                {isAdmin && <button onClick={() => handleDeleteAnswer(post.id, ans.id)} style={{ color: "#ff4d4d", fontSize: "9px", background: "none", border: "none" }}>削除</button>}
                              </div>
                            </div>
                            <div style={{fontSize: "14px", lineHeight: "1.6"}}>{ans.text}</div>
                            <button onClick={() => handleAnswerLike(post.id, ans.id)} style={{...subButtonStyle, padding: "4px 8px", marginTop: "8px"}}>❤ {ans.likes}</button>
                          </div>
                        ))}
                      </div>
                      <AnswerBox postId={post.id} onAnswer={handleAnswer} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ページネーション操作ボタン */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "32px", marginBottom: "40px" }}>
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} style={{ ...paginationBtnStyle, opacity: currentPage === 1 ? 0.3 : 1 }}>← 前へ</button>
              <div style={{ fontSize: "14px", color: "#888" }}>{currentPage} / {totalPages}</div>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} style={{ ...paginationBtnStyle, opacity: currentPage === totalPages ? 0.3 : 1 }}>次へ →</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// --- サブコンポーネント（省略なし） ---

function UpdateInput({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState("");
  const [show, setShow] = useState(false);
  if (!show) return <button onClick={() => setShow(true)} style={{ marginTop: "12px", background: "none", border: "none", color: "#3498db", fontSize: "11px", cursor: "pointer", textDecoration: "underline" }}>+ 追いコイシルを追記する</button>;
  return (
    <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
      <input placeholder="追記..." value={text} onChange={e => setText(e.target.value)} style={answerInputStyle} />
      <button onClick={() => { onAdd(text); setText(""); setShow(false); }} style={{...subButtonStyle, background: "#3498db", color: "#fff"}}>追加</button>
    </div>
  );
}

function Field({ label, children, fullWidth = false }: { label: string; children: React.ReactNode; fullWidth?: boolean }) {
  return <div style={{ gridColumn: fullWidth ? "1 / -1" : undefined }}><label style={{ display: "block", marginBottom: "6px", fontSize: "12px", color: "#8f8f8f", fontWeight: "bold" }}>{label}</label>{children}</div>;
}

function AnswerBox({ postId, onAnswer }: { postId: number; onAnswer: any }) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [marriage, setMarriage] = useState("未婚");
  const [age, setAge] = useState("20代");
  const [gender, setGender] = useState("女性");
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = () => {
    const finalAttr = isPrivate ? "非公開" : `${marriage}・${age}・${gender}`;
    onAnswer(postId, name, finalAttr, text);
    setName(""); setText("");
  };

  return (
    <div style={{ marginTop: "16px", padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ display: "grid", gap: "10px", marginBottom: "10px" }}>
        <input placeholder="お名前（匿名可）" value={name} onChange={(e) => setName(e.target.value)} style={answerInputStyle} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          {!isPrivate ? (
            <>
              <select value={marriage} onChange={e => setMarriage(e.target.value)} style={smallSelectStyle}><option>未婚</option><option>既婚</option><option>バツイチ</option></select>
              <select value={age} onChange={e => setAge(e.target.value)} style={smallSelectStyle}><option>10代</option><option>20代</option><option>30代</option><option>40代</option><option>50代以上</option></select>
              <select value={gender} onChange={e => setGender(e.target.value)} style={smallSelectStyle}><option>女性</option><option>男性</option><option>回答なし</option></select>
            </>
          ) : <span style={{fontSize: "12px", color: "#666"}}>属性は非公開になります</span>}
          <label style={{ fontSize: "11px", color: "#888", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
            <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} /> 非公開にする
          </label>
        </div>
      </div>
      <textarea placeholder="アドバイスを投稿..." value={text} onChange={(e) => setText(e.target.value)} style={{...answerInputStyle, minHeight: "80px"}} />
      <button onClick={handleSubmit} style={{...mainButtonStyle, padding: "12px", fontSize: "14px", marginTop: "10px"}}>回答を投稿する</button>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ fontSize: "10px", color: "#555", marginBottom: "2px", fontWeight: "bold" }}>{label}</div>
      <div style={{ fontSize: "12px", color: "#ddd" }}>{value || "-"}</div>
    </div>
  );
}

// --- スタイル定義 ---

const inputStyle = { width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" as const };
const selectStyle = { ...inputStyle, appearance: "none" as const };
const smallSelectStyle = { ...inputStyle, width: "auto", padding: "6px 10px", fontSize: "12px" };
const textareaStyle = { ...inputStyle, minHeight: "120px", lineHeight: "1.6", resize: "vertical" as const };
const mainButtonStyle = { width: "100%", padding: "16px", borderRadius: "14px", border: "none", background: "#fff", color: "#000", fontSize: "16px", fontWeight: 800, cursor: "pointer" };
const subButtonStyle = { padding: "8px 12px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: "11px", cursor: "pointer" };
const infoCardStyle = { padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" };
const infoLabelStyle = { fontSize: "11px", color: "#666", marginBottom: "4px" };
const infoTextStyle = { fontSize: "13px", lineHeight: "1.6", color: "#ccc" };
const emptyTextStyle = { padding: "40px", color: "#555", fontSize: "14px", textAlign: "center" as const };
const postCardStyle = { borderRadius: "24px", padding: "clamp(16px, 4vw, 24px)", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" };
const postDetailStyle = { color: "#eee", fontSize: "15px", lineHeight: "1.7", whiteSpace: "pre-wrap" as const, margin: "14px 0" };
const answerContainerStyle = { marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.05)" };
const answerItemStyle = { padding: "12px", borderRadius: "16px", color: "#eee", marginBottom: "10px" };
const answerInputStyle = { width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "#000", color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box" as const };
const voteContainerStyle = { marginBottom: "16px", padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "16px" };
const gaugeBarStyle = { height: "6px", background: "#222", borderRadius: "3px", overflow: "hidden", display: "flex" as const };
const ariGaugeStyle = { background: "#ff4d94", transition: "0.8s" };
const voteButtonStyle = { flex: 1, padding: "10px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "12px" };
const updateBubbleStyle = { marginTop: "12px", padding: "12px", background: "rgba(52,152,219,0.1)", borderRadius: "14px", fontSize: "14px", border: "1px solid rgba(52,152,219,0.2)" };
const emojiButtonStyle = { padding: "5px 12px", borderRadius: "15px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "12px" };
const noticeBoxStyle = { marginTop: "10px", fontSize: "12px" };
const tabBtnStyle = { padding: "8px 16px", border: "none", color: "#fff", fontSize: "12px", cursor: "pointer", borderRadius: "8px", transition: "0.2s" };
const newBadgeStyle = { background: "#e74c3c", color: "#fff", fontSize: "9px", fontWeight: "bold", padding: "2px 6px", borderRadius: "4px" };
const paginationBtnStyle = { padding: "8px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "10px", cursor: "pointer", fontSize: "12px" };
