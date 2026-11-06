const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static(__dirname));

// تخزين المتصلين النشطين مع وقت آخر نبضة
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

// استقبال نبضة المتصل وتحديث وقت جلسته
app.post('/api/ping', (req, res) => {
    const { clientId } = req.body;
    if (clientId) {
        activeSessions.set(clientId, Date.now());
    }
    cleanExpiredSessions();
    res.json({ online: Math.max(1, activeSessions.size) });
});

function cleanExpiredSessions() {
    const now = Date.now();
    for (let [id, timestamp] of activeSessions.entries()) {
        // إذا مر أكثر من 15 ثانية بدون نبضة، يُعتبر انقطع الاتصال
        if (now - timestamp > 15000) {
            activeSessions.delete(id);
        }
    }
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
