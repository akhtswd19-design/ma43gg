const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static(__dirname));

// تخزين الأجهزة المتصلة مع وقت آخر نبضة
let activeSessions = new Map();

let db = {
    categories: ["الكل", "الحرس الملكي", "الحرس الوطني", "وزارة الدفاع", "الكلية الامنيه", "أخرى"],
    majors: ["علوم حاسب", "هندسة", "إدارة أعمال", "قانون", "شريعة", "أخرى"],
    ads: [
        { id: 1, title: "متجر العاقل - خدمات وحلول متكاملة", link: "https://t.me/Al3agl_bot", image: "" }
    ],
    experiences: []
};

if (fs.existsSync(DATA_FILE)) {
    try {
        const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        db = { ...db, ...saved };
    } catch (e) {}
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/data', (req, res) => {
    cleanExpiredSessions();
    res.json({ ...db, onlineUsers: Math.max(1, activeSessions.size) });
});

app.post('/api/data', (req, res) => {
    db = req.body;
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    res.json({ success: true });
});

// استقبال نبضة القلب من المتصفح لتأكيد أن المستخدم ما زال متصلاً
app.post('/api/ping', (req, res) => {
    const { clientId } = req.body;
    if (clientId) {
        activeSessions.set(clientId, Date.now());
    }
    cleanExpiredSessions();
    res.json({ online: Math.max(1, activeSessions.size) });
});

// مسار فوري لحذف الجلسة عندما يقفل المستخدم الصفحة
app.post('/api/leave', (req, res) => {
    const { clientId } = req.body;
    if (clientId) {
        activeSessions.delete(clientId);
    }
    res.json({ success: true });
});

// تنظيف الجلسات التي انقطع اتصالها لأكثر من 10 ثوانٍ (إذا قفل المتصفح مفاجأة)
function cleanExpiredSessions() {
    const now = Date.now();
    for (let [id, timestamp] of activeSessions.entries()) {
        if (now - timestamp > 10000) {
            activeSessions.delete(id);
        }
    }
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
