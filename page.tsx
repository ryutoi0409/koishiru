"use client";
import { useState, useEffect } from "react";

type Answer = {
  id: number;
  name: string;
  attr: string; // 回答者属性
  text: string;
  likes: number;
  createdAt: string; // 投稿日時
  status: "pending" | "approved";
  isBest?: boolean; // ★追加：ベストアドバイス用
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
  ariCount: number; // ★追加：脈あり投票
  nashiCount: number; // ★追加：脈なし投票
  emojiReactions: { [key: string]: number }; // ★追加：エモリアクション
  updates: { id: number; text: string; createdAt: string }[]; // ★追加：追いLINE風追記
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

  // --- 永続化ロジック ---
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

  // --- 日時取得関数 ---
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

  // ★追加機能用ハンドラー
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
        padding: "32px 20px 48px",
        fontFamily: 'Arial, "Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif',
      }}
    >
      <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "8px 14px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.03)", color: "#d1d1d1", fontSize: "12px", letterSpacing: "0.14em" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "linear-gradient(135deg, #f0f0f0 0%, #8a8a8a 100%)", display: "inline-block" }} />
            コイシル
          </div>
          <div style={{ color: "#8d8d8d", fontSize: "12px", letterSpacing: "0.08em" }}>LOVE CONSULT PLATFORM</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "22px" }}>
          {/* Concept Card */}
          <section style={{ position: "relative", overflow: "hidden", borderRadius: "32px", padding: "48px", background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 90px rgba(0,0,0,0.45)" }}>
            <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "220px", height: "220px", borderRadius: "999px", background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 45%, rgba(255,255,255,0) 70%)", pointerEvents: "none" }} />
            <div style={{ marginBottom: "18px", color: "#9a9a9a", fontSize: "13px", letterSpacing: "0.12em" }}>コイシル</div>
            <h1 style={{ margin: "0 0 18px 0", fontSize: "44px", lineHeight: "1.2", fontWeight: 700 }}>恋愛の違和感を投稿して<br />本音の意見を集める。</h1>
            <p style={{ margin: "0 0 34px 0", color: "#c8c8c8", fontSize: "16px", lineHeight: "1.95", maxWidth: "640px" }}>コイシルは、恋愛の失敗談や、相手への小さな違和感を投稿し、第3者の視点から率直な意見をもらうことができる恋愛特化型の相談プラットフォームです。</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "28px" }}>
              {[["01", "恋愛の違和感を投稿"], ["02", "運営が内容を確認"], ["03", "回答を集める"], ["04", "役立つ相談を広げる"]].map(([num, title]) => (
                <div key={num} style={{ padding: "20px", borderRadius: "20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ fontSize: "12px", color: "#8f8f8f", marginBottom: "8px" }}>POINT {num}</div>
                  <div style={{ fontSize: "20px", fontWeight: 700 }}>{title}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
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
          <section style={{ borderRadius: "32px", padding: "32px", background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.025) 100%)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 90px rgba(0,0,0,0.45)" }}>
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "12px", letterSpacing: "0.12em", color: "#8f8f8f", marginBottom: "10px" }}>START POST</div>
              <h2 style={{ margin: 0, fontSize: "30px", lineHeight: "1.15" }}>恋愛相談を投稿する</h2>
            </div>
            <Field label="投稿者ペンネーム" fullWidth>
              <input placeholder="例：恋する会社員" value={postName} onChange={(e) => setPostName(e.target.value)} style={inputStyle} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "14px", marginBottom: "14px" }}>
              <Field label="出会い方">
                <select style={selectStyle} value={meet} onChange={(e) => setMeet(e.target.value)}>
                  <option value="">選択してください</option><option>マッチングアプリ</option><option>SNS</option><option>紹介</option><option>職場</option><option>学校</option><option>ナンパ</option><option>イベント</option><option>趣味</option><option>その他</option>
                </select>
              </Field>
              <Field label="相手との関係">
                <select style={selectStyle} value={relationship} onChange={(e) => setRelationship(e.target.value)}>
                  <option value="">選択してください</option><option>初対面</option><option>少しやり取り</option><option>知り合い</option><option>再会</option>
                </select>
              </Field>
              <Field label="時間帯">
                <select style={selectStyle} value={time} onChange={(e) => setTime(e.target.value)}>
                  <option value="">選択してください</option><option>昼</option><option>夕方</option><option>夜</option><option>深夜</option>
                </select>
              </Field>
              <Field label="デートの長さ">
                <select style={selectStyle} value={length} onChange={(e) => setLength(e.target.value)}>
                  <option value="">選択してください</option><option>30分以内</option><option>1時間前後</option><option>2時間前後</option><option>3時間前後</option><option>4時間以上</option>
                </select>
              </Field>
              <Field label="何をしたか">
                <select style={selectStyle} value={dateType} onChange={(e) => setDateType(e.target.value)}>
                  <option value="">選択してください</option><option>カフェ</option><option>ご飯</option><option>飲み</option><option>映画</option><option>ドライブ</option><option>その他</option>
                </select>
              </Field>
              <Field label="相手の反応">
                <select style={selectStyle} value={reaction} onChange={(e) => setReaction(e.target.value)}>
                  <option value="">選択してください</option><option>盛り上がった</option><option>普通</option><option>微妙</option><option>反応薄い</option>
                </select>
              </Field>
              <Field label="解散後の状況">
                <select style={selectStyle} value={afterStatus} onChange={(e) => setAfterStatus(e.target.value)}>
                  <option value="">選択してください</option><option>返信遅い</option><option>既読無視</option><option>継続中</option><option>終了</option>
                </select>
              </Field>
              <Field label="自分の手応え">
                <select style={selectStyle} value={selfFeeling} onChange={(e) => setSelfFeeling(e.target.value)}>
                  <option value="">選択してください</option><option>優勝</option><option>ふつう</option><option>空回り</option><option>失敗</option>
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
            <h2 style={{ margin: 0, fontSize: "28px" }}>恋愛相談一覧</h2>
          </div>

          {posts.filter(p => p.status === "approved").length === 0 ? (
            <div style={emptyTextStyle}>まだ投稿はありません。最初の恋愛相談を投稿してください。</div>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {posts.filter(p => p.status === "approved").map((post) => {
                const totalVotes = post.ariCount + post.nashiCount;
                const ariPer = totalVotes === 0 ? 50 : Math.round((post.ariCount / totalVotes) * 100);
                return (
                  <div key={post.id} style={postCardStyle}>
                    <div style={metaGridStyle}>
                      <Meta label="出会い方" value={post.meet} />
                      <Meta label="関係" value={post.relationship} />
                      <Meta label="時間帯" value={post.time} />
                      <Meta label="長さ" value={post.length} />
                      <Meta label="内容" value={post.dateType} />
                      <Meta label="反応" value={post.reaction} />
                      <Meta label="その後" value={post.afterStatus} />
                      <Meta label="手応え" value={post.selfFeeling} />
                    </div>

                    {/* ★1. 脈あり判定ゲージ */}
                    <div style={voteContainerStyle}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "8px" }}>
                        <span style={{ color: "#ff4d94" }}>脈あり {ariPer}%</span>
                        <span style={{ color: "#888" }}>脈なし {100 - ariPer}%</span>
                      </div>
                      <div style={gaugeBarStyle}><div style={{ ...ariGaugeStyle, width: `${ariPer}%` }} /></div>
                      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                        <button onClick={() => handleVote(post.id, 'ari')} style={voteButtonStyle}>脈あり👍</button>
                        <button onClick={() => handleVote(post.id, 'nashi')} style={voteButtonStyle}>脈なし💀</button>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <div style={{ color: "#cfcfcf", fontSize: "12px" }}>投稿者：{post.name} <span style={{ color: "#777", marginLeft: "10px" }}>{post.createdAt}</span></div>
                      <button onClick={() => handleDeletePost(post.id)} style={deleteLinkStyle}>[運営削除]</button>
                    </div>
                    
                    <div style={postDetailStyle}>{post.detail}</div>

                    {/* ★2. 追いコイシル追記表示 */}
                    {post.updates?.map(up => (
                      <div key={up.id} style={updateBubbleStyle}>
                        <div style={{ fontSize: "10px", color: "#8aa", marginBottom: "4px" }}>追記 - {up.createdAt}</div>
                        {up.text}
                      </div>
                    ))}
                    <UpdateInput onAdd={(text) => handleAddUpdate(post.id, text)} />

                    <div style={{ marginTop: "12px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                      <button onClick={() => handlePostLike(post.id)} style={subButtonStyle}>いいね {post.likes}</button>
                      <button onClick={() => handleShareToX(post)} style={subButtonStyle}>Xでシェア</button>
                      {/* ★3. エモいリアクション */}
                      <div style={{ display: "flex", gap: "6px" }}>
                        {Object.entries(post.emojiReactions || {}).map(([emoji, count]) => (
                          <button key={emoji} onClick={() => handleEmojiReaction(post.id, emoji)} style={emojiButtonStyle}>{emoji} {count || ""}</button>
                        ))}
                      </div>
                    </div>

                    <div style={answerContainerStyle}>
                      <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "12px" }}>回答</div>
                      {post.answers.length === 0 ? (
                        <div style={{ color: "#8f8f8f", fontSize: "13px", marginBottom: "12px" }}>まだ回答はありません。</div>
                      ) : (
                        <div style={{ display: "grid", gap: "10px", marginBottom: "12px" }}>
                          {post.answers.map((answer) => (
                            <div key={answer.id} style={{ ...answerItemStyle, border: answer.isBest ? "1px solid #ffd700" : "1px solid rgba(255,255,255,0.06)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                <div style={{ color: "#cfcfcf", fontSize: "12px" }}>
                                  {answer.isBest && <span style={{ color: "#ffd700", marginRight: "8px" }}>👑 Best</span>}
                                  回答者：{answer.name} ({answer.attr}) <span style={{ color: "#666", marginLeft: "8px" }}>{answer.createdAt}</span>
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                  {/* ★4. ベストアドバイス選定ボタン */}
                                  <button onClick={() => handleSetBestAnswer(post.id, answer.id)} style={{ ...deleteLinkStyle, color: "#ffd700" }}>{answer.isBest ? "解除" : "ベストに選ぶ"}</button>
                                  <button onClick={() => handleDeleteAnswer(post.id, answer.id)} style={deleteLinkStyle}>削除</button>
                                </div>
                              </div>
                              <div>{answer.text}</div>
                              <div style={{ marginTop: "10px" }}>
                                <button onClick={() => handleAnswerLike(post.id, answer.id)} style={subButtonStyle}>いいね {answer.likes}</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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

// --- 若者向け追加コンポーネント ---

function UpdateInput({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState("");
  const [show, setShow] = useState(false);
  if (!show) return <button onClick={() => setShow(true)} style={{ marginTop: "10px", background: "none", border: "none", color: "#3498db", fontSize: "12px", cursor: "pointer" }}>+ 追いコイシルを追記する</button>;
  return (
    <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
      <input placeholder="追いコイシルの追記..." value={text} onChange={e => setText(e.target.value)} style={answerInputStyle} />
      <button onClick={() => { onAdd(text); setText(""); setShow(false); }} style={subButtonStyle}>追記</button>
    </div>
  );
}

// --- マスターコンポーネント ---

function Field({ label, children, fullWidth = false }: { label: string; children: React.ReactNode; fullWidth?: boolean }) {
  return <div style={{ gridColumn: fullWidth ? "1 / -1" : undefined }}><label style={{ display: "block", marginBottom: "8px", fontSize: "13px", color: "#e6e6e6" }}>{label}</label>{children}</div>;
}

function AnswerBox({ postId, onAnswer }: { postId: number; onAnswer: any }) {
  const [name, setName] = useState("");
  const [attr, setAttr] = useState("20代・女性");
  const [text, setText] = useState("");
  return (
    <div style={{ marginTop: "14px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
        <input placeholder="名前" value={name} onChange={(e) => setName(e.target.value)} style={answerInputStyle} />
        <select value={attr} onChange={(e) => setAttr(e.target.value)} style={selectStyle}>
          <option>20代・女性</option><option>20代・男性</option><option>30代・女性</option><option>30代・男性</option><option>既婚・女性</option><option>既婚・男性</option>
        </select>
      </div>
      <textarea placeholder="意見を書く..." value={text} onChange={(e) => setText(e.target.value)} style={answerTextareaStyle} />
      <button onClick={() => { onAnswer(postId, name, attr, text); setName(""); setText(""); }} style={answerButtonStyle}>回答を投稿する</button>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div style={{ padding: "10px 12px", borderRadius: "14px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}><div style={{ fontSize: "11px", color: "#8f8f8f", marginBottom: "6px" }}>{label}</div><div style={{ fontSize: "13px", color: "#f2f2f2" }}>{value || "未入力"}</div></div>;
}

// --- スタイル定義 (マスターを完全維持) ---
const inputStyle = { width: "100%", padding: "14px 16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.28)", color: "#ffffff", fontSize: "14px", outline: "none", boxSizing: "border-box" as const };
const selectStyle = { ...inputStyle, appearance: "none" as const };
const textareaStyle = { ...inputStyle, minHeight: "170px", lineHeight: "1.8", resize: "vertical" as const };
const mainButtonStyle = { width: "100%", padding: "17px 20px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.20)", background: "linear-gradient(135deg, #f4f4f4 0%, #d8d8d8 48%, #b5b5b5 100%)", color: "#111111", fontSize: "16px", fontWeight: 700, cursor: "pointer", boxShadow: "0 16px 36px rgba(255,255,255,0.12)" };
const subButtonStyle = { padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.16)", background: "rgba(255,255,255,0.92)", color: "#111111", fontSize: "13px", fontWeight: 700, cursor: "pointer" };
const infoCardStyle = { padding: "22px", borderRadius: "22px", background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(255,255,255,0.08)" };
const infoLabelStyle = { fontSize: "13px", color: "#8e8e8e", marginBottom: "8px" };
const infoTextStyle = { fontSize: "15px", lineHeight: "1.85", color: "#f2f2f2" };
const timelineSectionStyle = { marginTop: "28px", borderRadius: "32px", padding: "32px", background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.025) 100%)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 90px rgba(0,0,0,0.45)" };
const emptyTextStyle = { borderRadius: "20px", padding: "24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#9d9d9d", fontSize: "14px" };
const postCardStyle = { borderRadius: "22px", padding: "22px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" };
const metaGridStyle = { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px", marginBottom: "16px" };
const postDetailStyle = { color: "#ffffff", fontSize: "15px", lineHeight: "1.9", whiteSpace: "pre-wrap" as const };
const answerContainerStyle = { marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" };
const answerItemStyle = { padding: "12px 14px", borderRadius: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#f2f2f2", fontSize: "14px", lineHeight: "1.8", whiteSpace: "pre-wrap" as const };
const deleteLinkStyle = { background: "none", border: "none", color: "#ff4d4d", fontSize: "11px", cursor: "pointer", padding: 0 };
const answerInputStyle = { width: "100%", padding: "12px 14px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.25)", color: "#ffffff", fontSize: "14px", outline: "none", boxSizing: "border-box" as const };
const answerTextareaStyle = { width: "100%", minHeight: "80px", padding: "14px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.25)", color: "#ffffff", fontSize: "14px", lineHeight: "1.8", boxSizing: "border-box" as const, outline: "none", resize: "vertical" as const, marginBottom: "10px" };
const answerButtonStyle = { padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.16)", background: "rgba(255,255,255,0.92)", color: "#111111", fontSize: "14px", fontWeight: 700, cursor: "pointer" };
const noticeBoxStyle = { borderRadius: "16px", padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#8f8f8f", fontSize: "12px", lineHeight: "1.8" };

// ★新機能用追加スタイル
const voteContainerStyle = { marginBottom: "20px", padding: "15px", background: "rgba(0,0,0,0.2)", borderRadius: "16px" };
const gaugeBarStyle = { height: "8px", background: "#333", borderRadius: "4px", overflow: "hidden", display: "flex" as const };
const ariGaugeStyle = { background: "linear-gradient(90deg, #ff4d94, #ff944d)", transition: "0.5s" };
const voteButtonStyle = { flex: 1, padding: "8px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "12px", cursor: "pointer" };
const updateBubbleStyle = { marginTop: "10px", padding: "10px 15px", background: "rgba(52, 152, 219, 0.15)", borderRadius: "15px 15px 15px 2px", alignSelf: "flex-start", fontSize: "14px", border: "1px solid rgba(52, 152, 219, 0.2)" };
const emojiButtonStyle = { padding: "6px 12px", borderRadius: "20px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "12px", cursor: "pointer" };