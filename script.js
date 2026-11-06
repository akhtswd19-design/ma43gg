const BOT_USERNAME = "Al3agle_bot";
const ADMIN_TELEGRAM_ID = "1056007305"; 

// إنشاء معرف فريد وثابت لهذا المتصفح لمنع تضاعف العدد عند الـ Refresh
let clientId = sessionStorage.getItem('al3agl_session_id');
if (!clientId) {
    clientId = 'client_' + Math.random().toString(36).substring(2) + Date.now();
    sessionStorage.setItem('al3agl_session_id', clientId);
}

let state = {
    activeCategory: "الكل",
    categories: ["الكل", "الحرس الملكي", "الحرس الوطني", "وزارة الدفاع", "الكلية الامنيه", "أخرى"],
    majors: ["علوم حاسب", "هندسة", "إدارة أعمال", "قانون", "شريعة", "أخرى"],
    ads: [],
    experiences: [],
    currentUser: null,
    votesMap: JSON.parse(localStorage.getItem('al3agl_user_votes') || '{}')
};

async function fetchServerData() {
    try {
        const res = await fetch('/api/data');
        if (res.ok) {
            const data = await res.json();
            state.categories = data.categories || state.categories;
            state.majors = data.majors || state.majors;
            state.ads = data.ads || state.ads;
            state.experiences = data.experiences || [];
            
            const onlineEl = document.getElementById('onlineCount');
            if (onlineEl && data.onlineUsers !== undefined) onlineEl.innerText = data.onlineUsers;

            renderCategories();
            renderMajors();
            renderAds();
            renderExperiences();
        }
    } catch(e) {}
}

async function saveServerData() {
    try {
        await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                categories: state.categories,
                majors: state.majors,
                ads: state.ads,
                experiences: state.experiences
            })
        });
    } catch(e) {}
}

// إرسال نبضة للسيرفر لتثبيت وجود المتصفح الحالي بدون زيادة وهمية عند التحديث
async function sendPing() {
    try {
        const res = await fetch('/api/ping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId })
        });
        const data = await res.json();
        const onlineEl = document.getElementById('onlineCount');
        if (onlineEl && data.online !== undefined) onlineEl.innerText = data.online;
    } catch(e) {}
}

// رصد إغلاق الصفحة أو الخروج منها لحذف المتصل فوراً من العداد
window.addEventListener('beforeunload', () => {
    navigator.sendBeacon('/api/leave', JSON.stringify({ clientId }));
});

document.addEventListener("DOMContentLoaded", () => {
    initStarsBg();
    sendPing();
    setInterval(sendPing, 4000); // نبض كل 4 ثوانٍ للحفاظ على العداد حي ودقيق
    fetchServerData();
    setInterval(fetchServerData, 3000);

    renderCategories();
    renderMajors();
    renderAds();
    initTelegramAuth();
    checkAuthUI();
    toggleMajorField();
});

function initStarsBg() {
    const container = document.getElementById('starsBg');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 35; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 2 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDuration = `${Math.random() * 15 + 15}s`;
        star.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(star);
    }
}

function switchTab(viewId, btnEl) {
    if (viewId === 'viewAdd' && !state.currentUser) {
        alert('يجب تسجيل الدخول عبر تليجرام في الصفحة الرئيسية أولاً لتتمكن من إضافة تجربة!');
        return;
    }

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    btnEl.classList.add('active');
    document.querySelectorAll('.view-page').forEach(page => page.classList.remove('active-view'));
    document.getElementById(viewId).classList.add('active-view');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function checkAuthUI() {
    const lockedMsg = document.getElementById('loginRequiredMsg');
    const formBody = document.getElementById('addExperienceFormBody');

    if (state.currentUser) {
        if (lockedMsg) lockedMsg.style.display = 'none';
        if (formBody) formBody.style.display = 'block';
    } else {
        if (lockedMsg) lockedMsg.style.display = 'block';
        if (formBody) formBody.style.display = 'none';
    }
}

function toggleMajorField() {
    const edu = document.getElementById('fieldEdu');
    const majorGroup = document.getElementById('majorGroup');
    if (!edu || !majorGroup) return;
    majorGroup.style.display = (edu.value === 'جامعي') ? 'flex' : 'none';
}

function renderMajors() {
    const select = document.getElementById('fieldMajor');
    if (!select) return;
    select.innerHTML = '';
    state.majors.forEach(major => {
        const opt = document.createElement('option');
        opt.value = major;
        opt.innerText = major;
        select.appendChild(opt);
    });
    renderAdminMajors();
}

function renderCategories() {
    const bar = document.getElementById('categoriesBar');
    const select = document.getElementById('fieldCategory');
    if (!bar || !select) return;
    
    bar.innerHTML = '';
    select.innerHTML = '';

    state.categories.forEach(cat => {
        const chip = document.createElement('div');
        chip.className = `cat-chip ${cat === state.activeCategory ? 'active' : ''}`;
        chip.innerText = cat;
        chip.onclick = () => {
            state.activeCategory = cat;
            renderCategories();
            renderExperiences();
        };
        bar.appendChild(chip);

        if (cat !== "الكل") {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.innerText = cat;
            select.appendChild(opt);
        }
    });
    renderAdminCats();
    renderAdminExperiences();
}

function renderAds() {
    const track = document.getElementById('carouselTrack');
    const dots = document.getElementById('carouselDots');
    if (!track || !dots) return;
    
    track.innerHTML = '';
    dots.innerHTML = '';

    state.ads.forEach((ad, index) => {
        const slide = document.createElement('div');
        slide.className = 'banner-slide';
        
        let contentHtml = '';
        if (ad.image) {
            contentHtml += `<img src="${ad.image}" style="max-height: 75px; border-radius: 6px; margin-bottom: 4px; object-fit: cover;">`;
        }
        contentHtml += `<h4>${ad.title}</h4>`;
        
        slide.innerHTML = contentHtml;
        if (ad.link) {
            slide.onclick = () => window.open(ad.link, '_blank');
            slide.style.cursor = 'pointer';
        }
        track.appendChild(slide);

        const dot = document.createElement('div');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dots.appendChild(dot);
    });
    renderAdminAds();
}

function renderExperiences() {
    const feed = document.getElementById('experiencesFeed');
    if (!feed) return;
    feed.innerHTML = '';

    let filtered = state.experiences.filter(item => !item.hidden);
    if (state.activeCategory !== "الكل") {
        filtered = filtered.filter(item => item.category === state.activeCategory);
    }

    filtered.forEach(item => {
        const up = item.upvotes || 0;
        const down = item.downvotes || 0;
        const total = up + down;
        item.accuracy = total === 0 ? 50 : Math.round((up / total) * 100);
        item.totalVotes = total;
    });

    filtered.sort((a, b) => b.accuracy - a.accuracy || b.totalVotes - a.totalVotes);

    if (filtered.length === 0) {
        feed.innerHTML = `<p style="text-align:center; color:var(--text-gray); font-size:0.85rem; padding:20px;">لا توجد تجارب مضافة حتى الآن في هذا القسم.</p>`;
        return;
    }

    filtered.forEach(exp => {
        const userVote = state.votesMap[exp.id] || null;
        const upCount = exp.upvotes || 0;
        const downCount = exp.downvotes || 0;

        const card = document.createElement('div');
        card.className = 'exp-card';
        card.innerHTML = `
            <div class="exp-header-tags">
                <span class="tag-item">${exp.gender}</span>
                <span class="tag-item">${exp.category}</span>
                <span class="tag-item">سنة ${exp.year}</span>
                <span class="tag-item">${exp.status}</span>
                <span class="tag-item">${exp.edu}</span>
                ${exp.edu === 'جامعي' && exp.major ? `<span class="tag-item">${exp.major}</span>` : ''}
            </div>
            <div class="exp-content-body">${exp.content}</div>
            <div class="exp-footer-actions">
                <div class="vote-controls">
                    <button class="vote-btn down ${userVote === 'down' ? 'voted' : ''}" onclick="vote(${exp.id}, 'down')" title="تصويت سلبي">
                        <svg viewBox="0 0 24 24"><path d="M12 20l8-8h-5V4h-6v8H4z"/></svg>
                        <span style="font-size:0.7rem; margin-right:2px;">${downCount}</span>
                    </button>
                    <button class="vote-btn up ${userVote === 'up' ? 'voted' : ''}" onclick="vote(${exp.id}, 'up')" title="تصويت إيجابي">
                        <svg viewBox="0 0 24 24"><path d="M12 4l-8 8h5v8h6v-8h5z"/></svg>
                        <span style="font-size:0.7rem; margin-right:2px;">${upCount}</span>
                    </button>
                    <span class="percentage-badge">نسبة الصحة: <strong>${exp.accuracy}%</strong></span>
                </div>
                <button class="share-btn" onclick="shareExperience(${exp.id})" title="مشاركة">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"/></svg>
                </button>
            </div>
            <div class="disclaimer-text">التجربه من شخص مو من فريق العمل</div>
        `;
        feed.appendChild(card);
    });
}

async function vote(expId, type) {
    const item = state.experiences.find(e => e.id === expId);
    if (!item) return;

    if (!item.upvotes) item.upvotes = 0;
    if (!item.downvotes) item.downvotes = 0;

    const currentVote = state.votesMap[expId] || null;

    if (currentVote === type) {
        if (type === 'up') item.upvotes--;
        else item.downvotes--;
        delete state.votesMap[expId];
    } else {
        if (currentVote === 'up') item.upvotes--;
        if (currentVote === 'down') item.downvotes--;

        if (type === 'up') item.upvotes++;
        else item.downvotes++;
        state.votesMap[expId] = type;
    }

    localStorage.setItem('al3agl_user_votes', JSON.stringify(state.votesMap));
    await saveServerData();
    renderExperiences();
}

function shareExperience(expId) {
    const url = `${window.location.origin}${window.location.pathname}?exp=${expId}`;
    if (navigator.share) {
        navigator.share({ title: 'تجارب العاقل', text: 'شاهد هذه التجربة:', url: url });
    } else {
        navigator.clipboard.writeText(url);
        alert('تم نسخ رابط التجربة للحافظة!');
    }
}

async function createNewExperience() {
    if (!state.currentUser) {
        alert('يجب تسجيل الدخول عبر تليجرام أولاً.');
        return;
    }

    const content = document.getElementById('fieldContent').value.trim();
    if (!content) {
        alert('يرجى كتابة نص التجربة أولاً.');
        return;
    }

    const edu = document.getElementById('fieldEdu').value;
    const major = edu === 'جامعي' ? document.getElementById('fieldMajor').value : '';

    const newExp = {
        id: Date.now(),
        gender: document.getElementById('fieldGender').value,
        edu: edu,
        major: major,
        status: document.getElementById('fieldStatus').value,
        year: document.getElementById('fieldYear').value,
        category: document.getElementById('fieldCategory').value,
        content: content,
        upvotes: 0,
        downvotes: 0,
        hidden: false
    };

    state.experiences.unshift(newExp);
    await saveServerData();
    document.getElementById('fieldContent').value = '';
    alert('تم إرسال تجربتك بنجاح وظهرت للجميع!');
    switchTab('viewHome', document.querySelectorAll('.nav-item')[0]);
    renderExperiences();
    renderAdminExperiences();
}

function initTelegramAuth() {
    const container = document.getElementById('telegramWidgetContainer');
    if (!container || container.innerHTML.trim() !== '') return;
    const script = document.createElement('script');
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", BOT_USERNAME);
    script.setAttribute("data-size", "medium");
    script.setAttribute("data-radius", "10");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    script.async = true;
    container.appendChild(script);
}

function onTelegramAuth(user) {
    state.currentUser = user;
    document.getElementById('telegramWidgetContainer').style.display = 'none';
    const profile = document.getElementById('userProfileDisplay');
    if (profile) {
        profile.style.display = 'block';
        profile.innerHTML = `مرحباً، ${user.first_name} ${user.username ? '(@' + user.username + ')' : ''}`;
    }

    checkAuthUI();

    if (String(user.id) === ADMIN_TELEGRAM_ID) {
        const adminBtn = document.getElementById('adminBtn');
        if (adminBtn) adminBtn.style.display = 'inline-block';
    }
}

function openAdminModal() { document.getElementById('adminModal').classList.add('active'); }
function closeAdminModal() { document.getElementById('adminModal').classList.remove('active'); }

function renderAdminCats() {
    const list = document.getElementById('adminCatsList');
    if (!list) return;
    list.innerHTML = '';
    state.categories.forEach(cat => {
        if (cat === "الكل") return;
        const tag = document.createElement('div');
        tag.className = 'admin-tag';
        tag.innerHTML = `${cat} <span onclick="removeCategory('${cat}')">×</span>`;
        list.appendChild(tag);
    });
}

function renderAdminMajors() {
    const list = document.getElementById('adminMajorsList');
    if (!list) return;
    list.innerHTML = '';
    state.majors.forEach(major => {
        const tag = document.createElement('div');
        tag.className = 'admin-tag';
        tag.innerHTML = `${major} <span onclick="removeMajor('${major}')">×</span>`;
        list.appendChild(tag);
    });
}

function renderAdminAds() {
    const list = document.getElementById('adminAdsList');
    if (!list) return;
    list.innerHTML = '';
    state.ads.forEach(ad => {
        const tag = document.createElement('div');
        tag.className = 'admin-tag';
        tag.innerHTML = `${ad.title || 'صورة إعلانية'} <span onclick="removeAd(${ad.id})">× حذف</span>`;
        list.appendChild(tag);
    });
}

function renderAdminExperiences() {
    const list = document.getElementById('adminExperiencesList');
    if (!list) return;
    list.innerHTML = '';
    state.experiences.forEach(exp => {
        const row = document.createElement('div');
        row.className = 'admin-exp-row';
        row.innerHTML = `
            <span style="max-width: 65%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${exp.content}</span>
            <div>
                <button onclick="toggleHideExp(${exp.id})" style="color:var(--gold-light); margin-left:6px;">${exp.hidden ? 'إظهار' : 'إخفاء'}</button>
                <button onclick="deleteExp(${exp.id})">حذف</button>
            </div>
        `;
        list.appendChild(row);
    });
}

async function addAdminCategory() {
    const val = document.getElementById('adminCatInput').value.trim();
    if (val && !state.categories.includes(val)) {
        state.categories.push(val);
        await saveServerData();
        document.getElementById('adminCatInput').value = '';
        renderCategories();
    }
}

async function removeCategory(cat) {
    state.categories = state.categories.filter(c => c !== cat);
    await saveServerData();
    renderCategories();
}

async function addAdminMajor() {
    const val = document.getElementById('adminMajorInput').value.trim();
    if (val && !state.majors.includes(val)) {
        state.majors.push(val);
        await saveServerData();
        document.getElementById('adminMajorInput').value = '';
        renderMajors();
    }
}

async function removeMajor(major) {
    state.majors = state.majors.filter(m => m !== major);
    await saveServerData();
    renderMajors();
}

async function addAdminAd() {
    const text = document.getElementById('adminAdText').value.trim();
    const link = document.getElementById('adminAdLink').value.trim();
    const fileInput = document.getElementById('adminAdImageFile');
    
    if (!text && (!fileInput || fileInput.files.length === 0)) {
        alert('يرجى كتابة نص الإعلان أو اختيار صورة على الأقل.');
        return;
    }

    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = async function(e) {
            const imageUrl = e.target.result;
            state.ads.push({ id: Date.now(), title: text, link: link, image: imageUrl });
            await saveServerData();
            document.getElementById('adminAdText').value = '';
            document.getElementById('adminAdLink').value = '';
            fileInput.value = '';
            renderAds();
            alert('تم إضافة الإعلان بنجاح');
        };
        reader.readAsDataURL(file);
    } else {
        state.ads.push({ id: Date.now(), title: text, link: link, image: '' });
        await saveServerData();
        document.getElementById('adminAdText', '').value = '';
        document.getElementById('adminAdLink').value = '';
        renderAds();
        alert('تم إضافة الإعلان بنجاح');
    }
}

async function removeAd(id) {
    state.ads = state.ads.filter(a => a.id !== id);
    await saveServerData();
    renderAds();
}

async function toggleHideExp(id) {
    const exp = state.experiences.find(e => e.id === id);
    if (exp) {
        exp.hidden = !exp.hidden;
        await saveServerData();
        renderExperiences();
        renderAdminExperiences();
    }
}

async function deleteExp(id) {
    state.experiences = state.experiences.filter(e => e.id !== id);
    await saveServerData();
    renderExperiences();
    renderAdminExperiences();
}
