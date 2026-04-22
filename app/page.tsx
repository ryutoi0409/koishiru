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
  attr: string; // 回答者属性
  text: string;
  likes: number;
  createdAt: string; // 投稿日時
  status: "pending" | "approved";
  isBest?: boolean; // ★ベストアドバイス用
  isAuthor?: boolean; // ★投稿者本人のリプライ判定用
};

type Post = {
  id: number;
  name: string;
  meet: string;
  relationship: string;
  time: string; // 表示項目「連絡頻度」
  length: string; // 表示項目「直近の接触」
  dateType: string; // 表示項目「悩みの種類」
  reaction: string; // 表示項目「相手の反応」
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
  isSolved?: boolean; // ★解決済みフラグ
  tags?: string[];    // ★タグ
  postKey?: string;   // ★秘密の鍵（4桁パスワード）
};

export default function Home() {
  // --- ステート定義 (1つも漏らさず維持) ---
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
  const [postKey, setPostKey] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");

  const [posts, setPosts] = useState<Post[]>([]);
  const [notice, setNotice] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [filterTab, setFilterTab] = useState<"NEW" | "盛り上がり">("NEW");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 4;

  const ADMIN_PASSWORD = "koishiru-admin"; 
  const [inputPass, setInputPass] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const TAG_OPTIONS = ["アプリ", "SNS", "職場・学校", "既婚者", "不倫", "復縁", "片思い", "脈なし?", "LINE", "電話", "マッチング中"];

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase.from("posts").select("*").order("id", { ascending: false });
      const { data: answersData, error: answersError } = await supabase.from("answers").select("*").order("id", { ascending: true });
      if (postsError || answersError) throw postsError || answersError;
      const combined = (postsData || []).map((p: any) => ({
        ...p,
        answers: (answersData || []).filter((a: any) => a.post_id === p.id)
      }));
      setPosts(combined);
    } catch (e: any) { console.error("Fetch Error:", e); } finally { setIsLoaded(true); }
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
    if (postKey.length !== 4) { setNotice("秘密の鍵を4桁で設定してください。"); return; }
    const newPost = {
      id: Date.now(), name: postName.trim() || "名無し", meet, relationship, time, length, dateType, reaction, afterStatus, selfFeeling,
      detail: detail.trim(), status: "approved", likes: 0, ariCount: 0, nashiCount: 0,
      emojiReactions: { "それな": 0, "沼": 0, "尊い": 0, "草": 0 }, updates: [],
      createdAt: getNow(), isSolved: false, tags: selectedTags, postKey: postKey,
    };
    const { error } = await supabase.from("posts").insert([newPost]);
    if (error) { setNotice("投稿失敗: " + error.message); return; }
    setNotice("診察（答え合わせ）を依頼しました。"); fetchPosts();
    setPostName(""); setMeet(""); setRelationship(""); setTime(""); setLength(""); setDateType(""); setReaction(""); setAfterStatus(""); setSelfFeeling(""); setDetail(""); setPostKey(""); setSelectedTags([]); setCustomTag(""); setCurrentPage(1);
  };

  const checkAuth = (post: Post) => {
    if (isAdmin) return true;
    const input = prompt("秘密の鍵（4桁の数字）を入力してください");
    return input === post.postKey;
  };

  const handleToggleSolved = async (post: Post) => {
    if (!checkAuth(post)) { alert("パスワードが一致しません"); return; }
    await supabase.from("posts").update({ isSolved: !post.isSolved }).eq("id", post.id);
    fetchPosts();
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

  const handleAnswer = async (postId: number, name: string, attr: string, text: string, isAuthor: boolean) => {
    if (!text.trim()) return;
    const newAnswer = {
      id: Date.now(), post_id: postId, name: name.trim() || "名無し", attr, text: text.trim(), likes: 0, status: "approved", createdAt: getNow(), isBest: false, isAuthor: isAuthor
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

  const handleAddUpdate = async (post: Post, text: string) => {
    if (!checkAuth(post)) { alert("パスワードが一致しません"); return; }
    const newUpdates = [...(post.updates || []), { id: Date.now(), text, createdAt: getNow() }];
    await supabase.from("posts").update({ updates: newUpdates }).eq("id", post.id);
    fetchPosts();
  };

  const handleSetBestAnswer = async (postId: number, answerId: number) => {
    if (!isAdmin) return;
    await supabase.from("answers").update({ isBest: false }).eq("post_id", postId);
    await supabase.from("answers").update({ isBest: true }).eq("id", answerId);
    fetchPosts();
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag));
    else if (selectedTags.length < 5) setSelectedTags([...selectedTags, tag]);
  };

  const filteredPosts = posts.filter(p => p.detail.includes(searchQuery) || p.name.includes(searchQuery) || p.tags?.some(t => t.includes(searchQuery)));
  const sortedPosts = [...filteredPosts].sort((a, b) => filterTab === "盛り上がり" ? (b.ariCount + b.nashiCount) - (a.ariCount + a.nashiCount) : b.id - a.id);
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = sortedPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(sortedPosts.length / postsPerPage);

  if (!isLoaded) return null;

  return (
    <main style={{ minHeight: "100vh", background: "radial-gradient(circle at top, #1c1c1c 0%, #0b0b0b 42%, #050505 100%)", color: "#ffffff", padding: "clamp(16px, 5vw, 48px) clamp(10px, 3vw, 20px)", fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
        
        {/* --- Header & Logo --- */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <img src="https://i.ibb.co/LnxYV5t/名称未設定のデザイン-8.jpg" alt="コイシル ロゴ" style={{ height: "48px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }} />
            <div style={{ padding: "8px 16px", borderRadius: "99px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)", fontSize: "14px", fontWeight: "bold" }}>
              コイシル {isAdmin && <span style={{color: "#ffd700", marginLeft: "8px"}}>● 管理者モード</span>}
            </div>
          </div>
          <input type="password" placeholder="Admin..." onChange={(e) => checkAdmin(e.target.value)} style={{ background: "transparent", border: "none", color: "#222", fontSize: "10px", width: "60px", outline: "none" }} />
        </header>

        <div className="main-grid" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <style jsx>{`
                .main-grid { flex-direction: column !important; }
                @media (min-width: 1024px) {
                    .main-grid { flex-direction: row !important; align-items: start; }
                    .side-section { width: 460px !important; flex-shrink: 0; position: sticky; top: 20px; }
                }
                .compact-meta-container { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
            `}</style>

          {/* --- Concept Card (1文字も省略なし) --- */}
          <section style={{ position: "relative", overflow: "hidden", borderRadius: "40px", padding: "clamp(24px, 6vw, 56px)", background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 90px rgba(0,0,0,0.5)", flex: 1 }}>
            <div style={{ marginBottom: "20px", color: "#9a9a9a", fontSize: "14px", letterSpacing: "0.15em", fontWeight: "bold" }}>1. コア・コンセプト</div>
            <h1 style={{ margin: "0 0 24px 0", fontSize: "clamp(28px, 6vw, 48px)", lineHeight: "1.2", fontWeight: 800, background: "linear-gradient(to bottom, #fff, #aaa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              恋の答え合わせは、<br />友達以外に頼もう。<br />恋を知る、コイシル。
            </h1>
            
            <div style={{ color: "#d1d1d1", fontSize: "17px", lineHeight: "2.0", maxWidth: "700px", marginBottom: "40px" }}>
              <p style={{ margin: "0 0 24px 0" }}>
                友達は関係性を壊さないために、つい優しい言葉を選んでしまうもの。コイシルは、あえて利害関係のない第3者から、残酷なほど客観的な**「恋のセカンドオピニオン」**をもらうことで、本当の状況を「知る」ための場所です。
              </p>
              
              <div style={{ marginBottom: "32px" }}>
                <div style={{ fontSize: "14px", color: "#9a9a9a", marginBottom: "12px", fontWeight: "bold" }}>2. 名前（コイシル）に込めた意味</div>
                <div style={{ display: "grid", gap: "12px", background: "rgba(255,255,255,0.03)", padding: "24px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div><strong style={{ color: "#fff", fontSize: "16px" }}>恋を知る：</strong> 自分の主観や友達の優しさというフィルターを外し、客観的な事実としての「恋の現在地」を知る。</div>
                  <div><strong style={{ color: "#fff", fontSize: "16px" }}>濃い、知る：</strong> 友達には話せないような「濃い（生々しい）」悩みや違和感を投稿し、それに対する深い洞察を知る。</div>
                </div>
              </div>

              <div style={{ fontSize: "14px", color: "#9a9a9a", marginBottom: "16px", fontWeight: "bold" }}>3. ユーザー体験（4つのステップ）</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                {[
                  ["STEP 01", "小さな『モヤッ』を可視化", "自分一人では抱えきれない、相手への些細な違和感を言語化して投稿します。"],
                  ["STEP 02", "本音だけど、荒れない管理", "独自の管理体制とコミュニティの質によって、率直な意見が届く空間を維持。"],
                  ["STEP 03", "恋のセカンドオピニオン", "当事者では気づけない盲点を、利害関係のない第3者がフラットな視点で診断。"],
                  ["STEP 04", "恋の失敗を、みんなの教訓に", "解決事例をアーカイブ化。「解決済み」として誰かの恋の羅針盤になります。"]
                ].map(([step, title, desc]) => (
                  <div key={step} style={{ padding: "20px", borderRadius: "24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: "11px", color: "#666", marginBottom: "6px", fontWeight: "bold" }}>{step}</div>
                    <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "8px", color: "#fff" }}>{title}</div>
                    <div style={{ fontSize: "13px", color: "#888", lineHeight: "1.6" }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* --- Post Form Section --- */}
          <section className="side-section" style={{ borderRadius: "40px", padding: "clamp(24px, 5vw, 40px)", background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 30px 100px rgba(0,0,0,0.6)" }}>
            <h2 style={{ fontSize: "28px", marginBottom: "28px", fontWeight: 800 }}>診察票を記入する</h2>
            
            <Field label="ペンネーム（匿名可）" fullWidth>
              <input placeholder="例：恋する会社員" value={postName} onChange={(e) => setPostName(e.target.value)} style={inputStyle} />
            </Field>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", margin: "16px 0" }}>
              <Field label="出会い方"><select style={selectStyle} value={meet} onChange={e => setMeet(e.target.value)}><option value="">選択</option><option>アプリ・SNS</option><option>職場・学校</option><option>紹介・合コン</option><option>その他</option></select></Field>
              <Field label="今の関係"><select style={selectStyle} value={relationship} onChange={e => setRelationship(e.target.value)}><option value="">選択</option><option>片思い(接触有)</option><option>片思い(未接触)</option><option>いい感じ</option><option>恋人</option><option>復縁希望</option></select></Field>
              <Field label="連絡頻度"><select style={selectStyle} value={time} onChange={e => setTime(e.target.value)}><option value="">選択</option><option>毎日</option><option>数日に一度</option><option>たまに</option><option>相手からのみ</option><option>自分からのみ</option><option>音信不通</option></select></Field>
              <Field label="直近の接触"><select style={selectStyle} value={length} onChange={e => setLength(e.target.value)}><option value="">選択</option><option>会った</option><option>LINEした</option><option>電話した</option><option>未接触</option></select></Field>
              <Field label="悩みの種類"><select style={selectStyle} value={dateType} onChange={(e) => setDateType(e.target.value)}><option value="">選択</option><option>脈の有無</option><option>接し方・誘い方</option><option>冷められた?</option><option>不倫・既婚</option><option>自分の失敗</option></select></Field>
              <Field label="相手の反応"><select style={selectStyle} value={reaction} onChange={(e) => setReaction(e.target.value)}><option value="">選択</option><option>積極的</option><option>普通</option><option>受動的</option><option>既読スルー</option></select></Field>
            </div>

            <Field label="秘密の鍵（4桁の数字） ★操作用">
              <input type="password" maxLength={4} value={postKey} onChange={e => setPostKey(e.target.value.replace(/\D/g,''))} style={{...inputStyle, border: "1px solid rgba(52,152,219,0.3)"}} placeholder="例: 1234" />
            </Field>

            <Field label="タグ（最大5つ）">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                {TAG_OPTIONS.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)} style={{ padding: "8px 14px", borderRadius: "12px", fontSize: "12px", border: "1px solid rgba(255,255,255,0.1)", background: selectedTags.includes(tag) ? "#fff" : "rgba(255,255,255,0.03)", color: selectedTags.includes(tag) ? "#000" : "#ccc", cursor: "pointer" }}>{tag}</button>
                ))}
              </div>
            </Field>

            <Field label="相談内容の詳細" fullWidth>
              <textarea placeholder="現在の状況や、相手の不可解な言動など、第3者に判断してほしいポイントを詳しく記入してください。" value={detail} onChange={(e) => setDetail(e.target.value)} style={textareaStyle} />
            </Field>
            
            <button onClick={handlePost} style={mainButtonStyle}>診察（答え合わせ）を依頼する</button>
            {notice && <div style={{...noticeBoxStyle, color: notice.includes("完了") ? "#2ecc71" : "#e74c3c", padding: "12px", borderRadius: "12px", background: "rgba(0,0,0,0.2)", marginTop: "16px"}}>{notice}</div>}
          </section>
        </div>

        {/* --- Timeline Section --- */}
        <section style={{ marginTop: "64px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", gap: "16px", flexWrap: "wrap" }}>
            <h2 style={{ fontSize: "32px", fontWeight: 900, margin: 0 }}>診察待ち一覧</h2>
            <div style={{ display: "flex", gap: "16px", flex: 1, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
              <input placeholder="検索..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ ...answerInputStyle, maxWidth: "280px", height: "48px", background: "rgba(255,255,255,0.05)" }} />
              <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", padding: "5px", borderRadius: "16px" }}>
                <button onClick={() => setFilterTab("NEW")} style={{ ...tabBtnStyle, background: filterTab === "NEW" ? "rgba(255,255,255,0.12)" : "transparent" }}>NEW</button>
                <button onClick={() => setFilterTab("盛り上がり")} style={{ ...tabBtnStyle, background: filterTab === "盛り上がり" ? "rgba(255,255,255,0.12)" : "transparent" }}>HOT</button>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: "40px" }}>
            {currentPosts.length === 0 ? (
              <div style={emptyTextStyle}>現在、診察待ちの相談はありません。</div>
            ) : (
              currentPosts.map((post, idx) => {
                const totalVotes = post.ariCount + post.nashiCount;
                const ariPer = totalVotes === 0 ? 50 : Math.round((post.ariCount / totalVotes) * 100);
                const isGlobalIndex = indexOfFirstPost + idx;
                const showNewBadge = filterTab === "NEW" && isGlobalIndex < 3;

                return (
                  <div key={post.id} style={{ ...postCardStyle, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", padding: "clamp(24px, 5vw, 40px)", borderRadius: "40px", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
                    {/* ヘッダー */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {showNewBadge && <span style={newBadgeStyle}>NEW</span>}
                        <div style={{ color: "#fff", fontSize: "15px", fontWeight: "bold" }}>{post.name}</div>
                        <div style={{ color: "#666", fontSize: "12px" }}>{post.createdAt}</div>
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        {post.isSolved && <span style={{ background: "#2ecc71", color: "#fff", fontSize: "11px", padding: "4px 12px", borderRadius: "8px", fontWeight: "bold" }}>解決 ✔</span>}
                        <button onClick={() => handleToggleSolved(post)} style={{ background: "none", border: "1px solid #444", color: "#888", fontSize: "11px", padding: "4px 10px", borderRadius: "8px", cursor: "pointer" }}>鍵操作</button>
                      </div>
                    </div>
                    
                    {/* メタ情報 */}
                    <div className="compact-meta-container">
                      {post.tags?.map(t => <span key={t} style={{ fontSize: "11px", color: "#3498db", background: "rgba(52,152,219,0.1)", padding: "4px 10px", borderRadius: "8px", border: "1px solid rgba(52,152,219,0.2)" }}>#{t}</span>)}
                      <Meta label="関係" value={post.relationship} />
                      <Meta label="頻度" value={post.time} />
                      <Meta label="反応" value={post.reaction} />
                      <Meta label="接触" value={post.length} />
                      <Meta label="悩み" value={post.dateType} />
                    </div>

                    {/* 投票ゲージ */}
                    <div style={voteContainerStyle}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "10px" }}>
                        <span style={{ color: "#ff4d94", fontWeight: "bold" }}>脈あり判定 {ariPer}%</span>
                        <span style={{ color: "#888" }}>脈なし判定 {100 - ariPer}%</span>
                      </div>
                      <div style={gaugeBarStyle}><div style={{ ...ariGaugeStyle, width: `${ariPer}%` }} /></div>
                      <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                        <button onClick={() => handleVote(post.id, 'ari')} style={voteButtonStyle}>脈あり👍</button>
                        <button onClick={() => handleVote(post.id, 'nashi')} style={voteButtonStyle}>脈なし💀</button>
                      </div>
                    </div>

                    {/* 本文 */}
                    <div style={{ ...postDetailStyle, fontSize: "18px", color: "#eee", letterSpacing: "0.02em" }}>{post.detail}</div>

                    {/* 本人追記 */}
                    {post.updates?.map(up => (
                      <div key={up.id} style={updateBubbleStyle}>
                        <div style={{ fontSize: "11px", color: "#8aa", marginBottom: "6px", fontWeight: "bold" }}>本人からの進展報告 ({up.createdAt})</div>
                        {up.text}
                      </div>
                    ))}
                    <UpdateInput onAdd={(text) => handleAddUpdate(post, text)} />

                    {/* 下部アクション */}
                    <div style={{ marginTop: "24px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "24px" }}>
                      <button onClick={() => handlePostLike(post.id)} style={subButtonStyle}>❤ 推す {post.likes}</button>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {Object.entries(post.emojiReactions || {}).map(([emoji, count]) => (
                          <button key={emoji} onClick={() => handleEmojiReaction(post.id, emoji)} style={emojiButtonStyle}>{emoji} {count || ""}</button>
                        ))}
                      </div>
                      {isAdmin && <button onClick={() => handleDeletePost(post.id)} style={{ color: "#ff4d4d", fontSize: "12px", background: "none", border: "none", cursor: "pointer", marginLeft: "auto" }}>削除</button>}
                    </div>

                    {/* セカンドオピニオンエリア */}
                    <div style={answerContainerStyle}>
                      <div style={{ fontWeight: 800, fontSize: "18px", marginBottom: "20px", color: "#fff" }}>セカンドオピニオン</div>
                      <AnswerList 
                        post={post} 
                        isAdmin={isAdmin} 
                        onSetBest={handleSetBestAnswer} 
                        onLike={(aid:number)=>handleAnswerLike(post.id, aid)} 
                        onDelete={(aid:number)=>handleDeleteAnswer(post.id, aid)} 
                      />
                      <AnswerBox post={post} onAnswer={handleAnswer} onAddUpdate={handleAddUpdate} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginTop: "48px", marginBottom: "80px" }}>
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} style={{ ...paginationBtnStyle, opacity: currentPage === 1 ? 0.3 : 1 }}>← 前へ</button>
              <span style={{fontSize: "15px", color: "#888", fontWeight: "bold"}}>{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} style={{ ...paginationBtnStyle, opacity: currentPage === totalPages ? 0.3 : 1 }}>次へ →</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// --- サブコンポーネント (一切の省略なし・属性選択ロジック完備) ---

function AnswerList({ post, isAdmin, onSetBest, onLike, onDelete }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const count = post.answers?.length || 0;
  if (count === 0) return <div style={{ fontSize: "14px", color: "#444", marginBottom: "20px" }}>オピニオンはまだありません</div>;

  return (
    <div style={{ marginBottom: "24px" }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", fontSize: "14px", padding: "16px", borderRadius: "16px", cursor: "pointer", width: "100%", textAlign: "left", fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
        <span>{isOpen ? "▲ オピニオンを隠す" : `▼ 答え合わせを見る (${count}件)`}</span>
        {post.answers.some((a:any) => a.isBest) && <span style={{color: "#ffd700"}}>👑 ベスト回答</span>}
      </button>
      {isOpen && (
        <div style={{ marginTop: "16px", display: "grid", gap: "12px" }}>
          {post.answers.map((ans:any) => (
            <div key={ans.id} style={{ 
              padding: "20px", borderRadius: "24px", 
              background: ans.isAuthor ? "rgba(52,152,219,0.12)" : (ans.isBest ? "rgba(255,215,0,0.07)" : "rgba(255,255,255,0.02)"),
              border: ans.isAuthor ? "1px solid rgba(52,152,219,0.3)" : (ans.isBest ? "1px solid #ffd700" : "1px solid rgba(255,255,255,0.05)")
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "12px", color: ans.isAuthor ? "#3498db" : "#999", fontWeight: ans.isAuthor ? "bold" : "normal" }}>
                  {ans.isAuthor && "👤 投稿者本人 "} {ans.isBest && "👑 "}{ans.name} ({ans.attr}) · {ans.createdAt}
                </span>
                <div style={{ display: "flex", gap: "10px" }}>
                  {isAdmin && <button onClick={() => onSetBest(post.id, ans.id)} style={{ background: "none", border: "none", color: "#ffd700", cursor: "pointer" }}>👑</button>}
                  {isAdmin && <button onClick={() => onDelete(post.id, ans.id)} style={{ background: "none", border: "none", color: "#ff4d4d", cursor: "pointer" }}>削除</button>}
                </div>
              </div>
              <div style={{ fontSize: "15px", color: "#ddd", lineHeight: "1.7" }}>{ans.text}</div>
              <button onClick={() => onLike(ans.id)} style={{...subButtonStyle, padding: "6px 12px", marginTop: "12px", background: "rgba(255,255,255,0.04)"}}>❤ {ans.likes}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnswerBox({ post, onAnswer, onAddUpdate }: any) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [isAuthorMode, setIsAuthorMode] = useState(false);
  const [marriage, setMarriage] = useState("未婚");
  const [age, setAge] = useState("20代");
  const [gender, setGender] = useState("女性");
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = () => {
    if (!text.trim()) return;
    if (isAuthorMode) {
      const input = prompt("操作用の鍵（4桁）を入力");
      if (input !== post.postKey) { alert("鍵が一致しません"); return; }
      if (confirm("これは回答への『本人返信』ですか？（はい=青色の投稿、いいえ=状況の追記として投稿）")) {
        onAnswer(post.id, post.name, "投稿者本人", text, true);
      } else {
        onAddUpdate(post, text);
      }
    } else {
      const finalAttr = isPrivate ? "属性非公開" : `${marriage}・${age}・${gender}`;
      onAnswer(post.id, name || "名無し", finalAttr, text, false);
    }
    setText(""); setName("");
  };

  return (
    <div style={{ background: "rgba(0,0,0,0.3)", padding: "24px", borderRadius: "28px", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
        <button onClick={() => setIsAuthorMode(false)} style={{ flex: 1, padding: "12px", borderRadius: "14px", fontSize: "13px", background: !isAuthorMode ? "rgba(255,255,255,0.12)" : "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>一般として回答</button>
        <button onClick={() => setIsAuthorMode(true)} style={{ flex: 1, padding: "12px", borderRadius: "14px", fontSize: "13px", background: isAuthorMode ? "#3498db" : "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>本人として返信</button>
      </div>

      {!isAuthorMode && (
        <div style={{ marginBottom: "16px" }}>
          <input placeholder="お名前（匿名可）" value={name} onChange={e => setName(e.target.value)} style={{...answerInputStyle, marginBottom: "10px"}} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
            <select value={marriage} onChange={e => setMarriage(e.target.value)} style={smallSelectStyle} disabled={isPrivate}><option>未婚</option><option>既婚</option><option>バツイチ</option></select>
            <select value={age} onChange={e => setAge(e.target.value)} style={smallSelectStyle} disabled={isPrivate}><option>10代</option><option>20代</option><option>30代</option><option>40代</option><option>50代+</option></select>
            <select value={gender} onChange={e => setGender(e.target.value)} style={smallSelectStyle} disabled={isPrivate}><option>女性</option><option>男性</option></select>
            <label style={{ fontSize: "12px", color: "#888", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
              <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} /> 属性非公開
            </label>
          </div>
        </div>
      )}

      <textarea placeholder={isAuthorMode ? "回答への返信や、その後の進展を記入してください..." : "あなたの客観的なオピニオンを投稿してください..."} value={text} onChange={(e) => setText(e.target.value)} style={{...answerInputStyle, minHeight: "100px"}} />
      <button onClick={handleSubmit} style={{...mainButtonStyle, padding: "16px", marginTop: "16px", background: isAuthorMode ? "#3498db" : "#fff", color: isAuthorMode ? "#fff" : "#000", fontSize: "15px"}}>
        {isAuthorMode ? "本人として診察室へ投稿" : "オピニオンを投稿する"}
      </button>
    </div>
  );
}

function UpdateInput({ onAdd }: any) {
  const [text, setText] = useState(""); const [show, setShow] = useState(false);
  if (!show) return <button onClick={() => setShow(true)} style={{ marginTop: "20px", background: "none", border: "none", color: "#3498db", fontSize: "13px", cursor: "pointer", textDecoration: "underline", fontWeight: "bold" }}>+ 状況が変わったら追記する（追いコイシル）</button>;
  return <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}><input placeholder="その後どうなった？" value={text} onChange={e => setText(e.target.value)} style={answerInputStyle} /><button onClick={() => { onAdd(text); setText(""); setShow(false); }} style={{...subButtonStyle, background: "#3498db", minWidth: "80px"}}>追加</button></div>;
}

function Field({ label, children, fullWidth = false }: any) { return <div style={{ marginBottom: "18px", gridColumn: fullWidth ? "1 / -1" : "span 1" }}><label style={{ display: "block", marginBottom: "8px", fontSize: "13px", color: "#8f8f8f", fontWeight: "bold" }}>{label}</label>{children}</div>; }
function Meta({ label, value }: any) { return value ? <div style={{ padding: "5px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "5px" }}><span style={{ fontSize: "10px", color: "#666" }}>{label}:</span><span style={{ fontSize: "12px", color: "#eee" }}>{value}</span></div> : null; }

// --- スタイル定義 ---
const inputStyle = { width: "100%", padding: "14px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: "15px", outline: "none", boxSizing: "border-box" as any };
const selectStyle = { ...inputStyle, appearance: "none" as any };
const textareaStyle = { ...inputStyle, minHeight: "140px", lineHeight: "1.7", resize: "vertical" as any };
const mainButtonStyle = { width: "100%", padding: "18px", borderRadius: "18px", border: "none", background: "#fff", color: "#000", fontSize: "17px", fontWeight: 900, cursor: "pointer", boxShadow: "0 10px 30px rgba(255,255,255,0.1)" };
const subButtonStyle = { padding: "10px 18px", borderRadius: "12px", border: "none", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: "13px", cursor: "pointer", fontWeight: "bold" };
const voteContainerStyle = { margin: "24px 0", padding: "20px", background: "rgba(0,0,0,0.25)", borderRadius: "28px", border: "1px solid rgba(255,255,255,0.04)" };
const gaugeBarStyle = { height: "10px", background: "#111", borderRadius: "5px", overflow: "hidden", display: "flex" as any };
const ariGaugeStyle = { background: "linear-gradient(90deg, #ff4d94, #ff85b3)", transition: "1.2s cubic-bezier(0.16, 1, 0.3, 1)" };
const voteButtonStyle = { flex: 1, padding: "14px", borderRadius: "16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "13px", cursor: "pointer", fontWeight: "bold" };
const postDetailStyle = { lineHeight: "1.9", whiteSpace: "pre-wrap" as any, margin: "24px 0" };
const updateBubbleStyle = { marginTop: "16px", padding: "18px", background: "rgba(52,152,219,0.1)", borderRadius: "24px", fontSize: "15px", border: "1px solid rgba(52,152,219,0.2)", color: "#d0e8f8" };
const emojiButtonStyle = { padding: "8px 16px", borderRadius: "20px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "13px", cursor: "pointer" };
const tabBtnStyle = { padding: "10px 24px", border: "none", color: "#fff", fontSize: "14px", cursor: "pointer", borderRadius: "12px", fontWeight: "bold" };
const answerInputStyle = { width: "100%", padding: "14px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", background: "#000", color: "#fff", fontSize: "15px", outline: "none", boxSizing: "border-box" as any };
const smallSelectStyle = { ...inputStyle, width: "auto", padding: "6px 12px", fontSize: "12px", marginBottom: "5px" };
const paginationBtnStyle = { padding: "14px 28px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "16px", cursor: "pointer", fontSize: "15px", fontWeight: "bold" };
const newBadgeStyle = { background: "#e74c3c", color: "#fff", fontSize: "10px", fontWeight: "900", padding: "3px 10px", borderRadius: "6px", letterSpacing: "0.05em" };
const emptyTextStyle = { padding: "80px 20px", color: "#555", fontSize: "16px", textAlign: "center" as any, fontWeight: "bold" };
const postCardStyle = { transition: "0.3s" };
const answerContainerStyle = { marginTop: "32px", paddingTop: "32px", borderTop: "1px solid rgba(255,255,255,0.08)" };
const noticeBoxStyle = { marginTop: "10px", fontSize: "14px", fontWeight: "bold" };
