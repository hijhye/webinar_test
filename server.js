require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(
  express.static(path.join(__dirname, "public"), { extensions: ["html"] })
);

let chats = [];
let watchLogs = [];
let notice = "2026 RISS 이용교육 생중계에 오신 것을 환영합니다.";
let eventTitle = "2026 RISS 학술 데이터 활용 전략 세미나";
let streamMode = "all";
let streamConfig = {
  hlsUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  youtubeUrl: "https://www.youtube.com/embed/jfKfPfyJRdk",
};
let registrants = [{ id: 1, name: "관리자", email: "admin@test.com" }];

// [공통] 로그 기록 (입장, 화면 가림, 복귀, 퇴장)
app.post("/api/log", (req, res) => {
  const { name, email, status } = req.body;
  if (name && email) {
    watchLogs.push({
      name,
      email,
      status,
      time: new Date().toLocaleString("ko-KR"),
      ip: req.ip,
    });
  }
  res.json({ success: true });
});

app.post("/api/login", (req, res) => {
  const { name, email } = req.body;
  const user = registrants.find((r) => r.name === name && r.email === email);
  if (user) {
    watchLogs.push({
      name,
      email,
      time: new Date().toLocaleString("ko-KR"),
      status: "입장",
      ip: req.ip,
    });
    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false });
  }
});

app.get("/api/admin/export", (req, res) => {
  let csv = "\uFEFF[1. 시청 기록]\n이름,이메일,시간,상태,IP\n";
  watchLogs.forEach((l) => {
    csv += `${l.name},${l.email},${l.time},${l.status},${l.ip}\n`;
  });
  csv += "\n\n[2. 채팅 내역]\n작성자,시간,메시지\n";
  chats.forEach((c) => {
    csv += `${c.user},${c.time},${c.message.replace(/,/g, " ")}\n`;
  });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=webinar_report.csv"
  );
  res.send(csv);
});

app.get("/api/admin/data", (req, res) =>
  res.json({
    registrants,
    watchLogs,
    chats,
    notice,
    streamConfig,
    eventTitle,
    streamMode,
  })
);

app.post("/api/admin/update", (req, res) => {
  if (req.body.notice !== undefined) notice = req.body.notice;
  if (req.body.eventTitle !== undefined) eventTitle = req.body.eventTitle;
  if (req.body.streamConfig) streamConfig = req.body.streamConfig;
  if (req.body.streamMode !== undefined) streamMode = req.body.streamMode;
  res.json({ success: true });
});

app.post("/api/admin/login", (req, res) => {
  if (req.body.password === process.env.ADMIN_PW) res.json({ success: true });
  else res.status(401).json({ success: false });
});

app.post("/api/admin/reg", (req, res) => {
  registrants.push({ id: Date.now(), ...req.body });
  res.json({ success: true });
});

app.delete("/api/admin/reg/:id", (req, res) => {
  registrants = registrants.filter((r) => r.id !== parseInt(req.params.id));
  res.json({ success: true });
});

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

app.delete("/api/chats/:id", (req, res) => {
  chats = chats.filter((c) => c.id !== parseInt(req.params.id));
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 서버 가동 중: http://localhost:${PORT}`)
);
