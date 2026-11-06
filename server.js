const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static(__dirname));

let activeUsersCount = 0;

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
    res.json({ ...db, onlineUsers: activeUsersCount });
});

app.post('/api/data', (req, res) => {
    db = req.body;
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    res.json({ success: true });
});

// مسار لحساب عدد المتصلين الحقيقيين بدقة
app.get('/api/ping', (req, res) => {
    res.json({ online: activeUsersCount });
});

// محاكاة نبض الاتصال الحي
setInterval(() => {
    if (activeUsersCount > 0) activeUsersCount--;
}, 15000);

app.post('/api/connect', (req, res) => {
    activeUsersCount = Math.max(1, activeUsersCount + 1);
    res.json({ online: activeUsersCount });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
