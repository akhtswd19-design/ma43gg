const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());

// السماح بقراءة ملفات الواجهة من الجذر
app.use(express.static(__dirname));

let db = {
    categories: ["الكل", "الحرس الملكي", "الحرس الوطني", "وزارة الدفاع", "الكلية الامنيه", "أخرى"],
    majors: ["علوم حاسب", "هندسة", "إدارة أعمال", "قانون", "شريعة", "أخرى"],
    ads: [
        { id: 1, title: "متجر العاقل - خدمات وحلول متكاملة", link: "https://t.me/Al3agl_bot" },
        { id: 2, title: "انضم إلى قروب المناقشة الرسمي", link: "https://t.me/Q3skrr" }
    ],
    experiences: []
};

if (fs.existsSync(DATA_FILE)) {
    try {
        const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        db = { ...db, ...saved };
    } catch (e) {}
}

// توجيه الصفحة الرئيسية لملف index.html صراحةً لمنع خطأ Not Found
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/data', (req, res) => {
    res.json(db);
});

app.post('/api/data', (req, res) => {
    db = req.body;
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
