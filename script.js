const modernColors = ['#6366F1', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#06B6D4', '#A855F7', '#F97316'];
let usedColors = []; 
let currentSelectedColor = modernColors[0];
let isDrawing = false;

// 1. เริ่มระบบ
function init() {
    const datePicker = document.getElementById('datePicker');
    if (datePicker) datePicker.value = new Date().toISOString().split('T')[0];

    buildTimeGrid();
    setupDefaultSubjects();
    renderHistory();

    window.addEventListener('mouseup', () => isDrawing = false);
    window.addEventListener('touchend', () => isDrawing = false);
}

// 2. สร้างตารางเวลา (6 ช่อง/ชม.)
function buildTimeGrid() {
    const timeGrid = document.getElementById('time-grid');
    if (!timeGrid) return;
    timeGrid.innerHTML = ''; 
    for (let h = 4; h <= 23; h++) {
        const row = document.createElement('div');
        row.className = 'time-row flex items-center py-2.5 border-b border-slate-50 last:border-0';
        row.innerHTML = `
            <div class="time-label text-[12px] font-black text-slate-400 w-14 shrink-0">${h.toString().padStart(2, '0')}:00</div>
            <div class="hour-slots flex flex-1 gap-1.5 h-8">
                ${Array(6).fill(0).map(() => `
                    <div class="slot flex-1 bg-white border border-slate-100 rounded-lg cursor-pointer transition-all shadow-sm" 
                         onmousedown="startPaint(this)" onmouseenter="continuePaint(this)"
                         ontouchstart="handleTouchStart(event, this)" ontouchmove="handleTouchMove(event)"></div>
                `).join('')}
            </div>
        `;
        timeGrid.appendChild(row);
    }
}

// 3. ระบบระบายสี (Touch & Mouse)
function handleTouchStart(e, el) { isDrawing = true; toggleColor(el); }
function handleTouchMove(e) {
    if (!isDrawing) return;
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains('slot')) toggleColor(target);
}
function startPaint(el) { isDrawing = true; toggleColor(el); }
function continuePaint(el) { if (isDrawing) toggleColor(el); }

function toggleColor(el) {
    const activeRgb = hexToRgb(currentSelectedColor);
    if (el.style.background === activeRgb) {
        el.style.background = "white";
        el.style.borderColor = "#f1f5f9";
    } else {
        el.style.background = currentSelectedColor;
        el.style.borderColor = currentSelectedColor;
    }
    updateTotal();
}

// 4. ระบบประวัติ (History)
function saveToHistory() {
    const total = document.getElementById('totalHours').innerText;
    if (total === "0h 00m") return alert("ระบายสีตารางก่อนบันทึกครับ");

    const record = {
        id: Date.now(),
        date: document.getElementById('datePicker').value,
        total: total,
        user: document.getElementById('userName').value || "No Name"
    };

    let history = JSON.parse(localStorage.getItem('study_history') || '[]');
    history.unshift(record);
    localStorage.setItem('study_history', JSON.stringify(history));
    renderHistory();
    alert("Saved successfully!");
}

function renderHistory() {
    const list = document.getElementById('history-list');
    if (!list) return;
    const history = JSON.parse(localStorage.getItem('study_history') || '[]');
    list.innerHTML = history.length ? history.map(i => `
        <div class="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex justify-between items-center shadow-sm">
            <div>
                <div class="text-[10px] font-black text-indigo-500 uppercase">${i.date}</div>
                <div class="text-2xl font-black text-slate-800">${i.total}</div>
                <div class="text-[10px] text-slate-300 font-bold">BY: ${i.user}</div>
            </div>
            <button onclick="deleteHistory(${i.id})" class="text-red-300 font-bold p-2 text-xs">DEL</button>
        </div>
    `).join('') : '<div class="text-center py-20 text-slate-300 font-black uppercase text-xs">No Records</div>';
}

function deleteHistory(id) {
    let history = JSON.parse(localStorage.getItem('study_history') || '[]');
    localStorage.setItem('study_history', JSON.stringify(history.filter(i => i.id !== id)));
    renderHistory();
}

function clearAllHistory() {
    if (confirm("ล้างประวัติทั้งหมด?")) {
        localStorage.removeItem('study_history');
        renderHistory();
    }
}

// 5. ระบบ Export (ชัดพิเศษ 5x)
async function downloadImage() {
    const rows = document.querySelectorAll('.time-row');
    const hiddenRows = [];
    rows.forEach(r => {
        const colored = Array.from(r.querySelectorAll('.slot')).some(s => s.style.background !== "" && s.style.background !== "white");
        if (!colored) { r.style.display = 'none'; hiddenRows.push(r); }
    });

    const canvas = await html2canvas(document.getElementById('capture-area'), {
        scale: 5,
        backgroundColor: "#ffffff",
        onclone: (cloned) => {
            const name = cloned.getElementById('userName');
            if (name) { name.style.fontSize = '30px'; name.style.height = '70px'; name.style.border = 'none'; }
        }
    });

    hiddenRows.forEach(r => r.style.display = 'flex');
    const link = document.createElement('a');
    link.download = `StudyFlow-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

// --- ฟังก์ชันช่วยเหลือ ---
function switchTab(tab) {
    document.getElementById('track-page').classList.toggle('hidden', tab !== 'track');
    document.getElementById('history-page').classList.toggle('hidden', tab !== 'history');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.innerText.toLowerCase().includes(tab)));
}

function addSubject(name) {
    const container = document.getElementById('subject-list');
    const color = getRandomColor();
    const item = document.createElement('div');
    item.className = 'subject-item flex items-center gap-4 cursor-pointer p-4 rounded-3xl border-2 border-transparent transition-all shadow-sm bg-white';
    item.onclick = () => {
        document.querySelectorAll('.subject-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        currentSelectedColor = color;
    };
    item.oncontextmenu = (e) => { e.preventDefault(); if(confirm(`ลบวิชา "${name}"?`)) item.remove(); };
    item.innerHTML = `<div class="w-4 h-4 rounded-full" style="background:${color}"></div><span class="text-sm font-black text-slate-700">${name}</span>`;
    container.appendChild(item);
    if (container.children.length === 1) item.click();
}

function setupDefaultSubjects() {
    const list = document.getElementById('subject-list');
    if (list && list.children.length === 0) ['Quran', 'English', 'Math'].forEach(n => addSubject(n));
}

function updateTotal() {
    const p = Array.from(document.querySelectorAll('.slot')).filter(s => s.style.background !== "" && s.style.background !== "white");
    const m = p.length * 10;
    document.getElementById('totalHours').innerText = `${Math.floor(m/60)}h ${String(m%60).padStart(2, '0')}m`;
}

function getRandomColor() {
    let avail = modernColors.filter(c => !usedColors.includes(c));
    if (avail.length === 0) { usedColors = []; avail = modernColors; }
    const c = avail[Math.floor(Math.random() * avail.length)];
    usedColors.push(c);
    return c;
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
    return `rgb(${r}, ${g}, ${b})`;
}

function addNewSubjectPrompt() {
    const n = prompt("ชื่อวิชาใหม่:");
    if (n) addSubject(n);
}

init();
