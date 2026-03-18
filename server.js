// 1. 보안을 위해 환경 변수(.env) 파일을 읽어옵니다.
require("dotenv").config();

const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());

// ★ [수정 포인트] static 설정에 extensions 옵션을 추가했습니다.
// 이제 브라우저에서 .html을 안 붙여도 서버가 알아서 찾아줍니다!
app.use(
  express.static(path.join(__dirname, "public"), { extensions: ["html"] })
);

// --- 가상 데이터베이스 (메모리 저장 방식) ---
let chats = [];
let watchLogs = [];
let notice = "2026 RISS 이용교육 생중계에 오신 것을 환영합니다.";
let streamConfig = {
  hlsUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  youtubeUrl: "https://www.youtube.com/embed/jfKfPfyJRdk",
};

let registrants = [{ id: 1, name: "관리자", email: "admin@test.com" }];

// --- API 영역 ---

// [사용자] 로그인 처리
app.post("/api/login", (req, res) => {
  const { name, email } = req.body;
  const user = registrants.find((r) => r.name === name && r.email === email);
  if (user) {
    watchLogs.push({
      name,
      email,
      time: new Date().toLocaleString("ko-KR"),
      ip: req.ip,
    });
    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false });
  }
});

// [관리자] 로그인 (보안 강화: .env 파일의 비번과 대조)
app.post("/api/admin/login", (req, res) => {
  if (req.body.password === process.env.ADMIN_PW) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

// [관리자] 엑셀(CSV) 추출
app.get("/api/admin/export", (req, res) => {
  let csv = "\uFEFF이름,이메일,접속시간,IP\n";
  watchLogs.forEach((l) => {
    csv += `${l.name},${l.email},${l.time},${l.ip}\n`;
  });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=webinar_watch_logs.csv"
  );
  res.send(csv);
});

// [관리자] 전체 데이터 로딩
app.get("/api/admin/data", (req, res) => {
  res.json({ registrants, watchLogs, chats, notice, streamConfig });
});

// [관리자] 공지사항 및 스트림 주소 업데이트
app.post("/api/admin/update", (req, res) => {
  if (req.body.notice) notice = req.body.notice;
  if (req.body.streamConfig) streamConfig = req.body.streamConfig;
  res.json({ success: true });
});

// [관리자] 참가자 신규 등록 및 삭제
app.post("/api/admin/reg", (req, res) => {
  registrants.push({ id: Date.now(), ...req.body });
  res.json({ success: true });
});
app.delete("/api/admin/reg/:id", (req, res) => {
  registrants = registrants.filter((r) => r.id !== parseInt(req.params.id));
  res.json({ success: true });
});

// [공통] 채팅 데이터 가져오기 및 등록
app.get("/api/chats", (req, res) => res.json(chats));
app.post("/api/chats", (req, res) => {
  chats.push({
    id: Date.now(),
    ...req.body,
    time: new Date().toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
  res.json({ success: true });
});

// [관리자] 부적절한 채팅 삭제
app.delete("/api/chats/:id", (req, res) => {
  chats = chats.filter((c) => c.id !== parseInt(req.params.id));
  res.json({ success: true });
});

// 포트 설정
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버가 http://localhost:${PORT} 에서 가동 중입니다.`);
});
