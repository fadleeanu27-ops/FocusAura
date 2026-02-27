const colors = ['#6366f1', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];
let currentSelectedColor = colors[0];
let isDrawing = false;

function init() {
    const dp = document.getElementById('datePicker');
    if (dp) dp.value = new Date().toISOString().split('T')[0];

    // สร้างตาราง
    const grid = document.getElementById('time-grid');
    for (let h = 4; h <= 23; h++) {
        const row = document.createElement('div');
        row.className = 'flex items-center gap-2 py-1';
        row.innerHTML = `
            <div class="text-[10px] font-bold text-slate-300 w-8">${h}:00</div>
            <div class="flex flex-1 gap-1 h-7">
                ${Array(6).fill(0).map(() => `
                    <div class="slot flex-1 bg-white border border-slate-100 rounded-md shadow-sm" 
                         onmousedown="startPaint(this)" onmouseenter="continuePaint(this)"
                         ontouchstart="handleTouch(event, this)" ontouchmove="handleTouch(event)"></div>
                `).join('')}
            </div>
        `;
        grid.appendChild(row);
    }

    // สร้างวิชาเริ่มต้น
    ['Quran', 'English', 'Math'].forEach(n => addSubject(n));
    renderHistory();

    window.onmouseup = () => isDrawing = false;
    window.ontouchend = () => isDrawing = false;
}

// ระบายสี
function startPaint(el) { isDrawing = true; paint(el); }
function continuePaint(el) { if (isDrawing) paint(el); }
function handleTouch(e, el) {
    if (e.type === 'touchstart') { isDrawing = true; paint(el); }
    else {
        const t = e.touches[0];
        const target = document.elementFromPoint(t.clientX, t.clientY);
        if (target && target.classList.contains('slot')) paint(target);
    }
}

function paint(el) {
    const activeColor = currentSelectedColor;
    if (el.style.backgroundColor === hexToRgb(activeColor)) {
        el.style.backgroundColor = 'white';
        el.style.borderColor = '#f1f5f9';
    } else {
        el.style.backgroundColor = activeColor;
        el.style.borderColor = activeColor;
    }
    updateTotal();
}

function addSubject(name) {
    const list = document.getElementById('subject-list');
    const color = colors[list.children.length % colors.length];
    const item = document.createElement('div');
    item.className = 'subject-item flex items-center gap-3 p-3 bg-white rounded-2xl border-2 border-transparent shadow-sm cursor-pointer';
    item.onclick = () => {
        document.querySelectorAll('.subject-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        currentSelectedColor = color;
    };
    item.oncontextmenu = (e) => { e.preventDefault(); if(confirm('Delete?')) item.remove(); };
    item.innerHTML = `<div class="w-3 h-3 rounded-full" style="background:${color}"></div><span class="text-xs font-bold text-slate-700">${name}</span>`;
    list.appendChild(item);
    if (list.children.length === 1) item.click();
}

function updateTotal() {
    const slots = Array.from(document.querySelectorAll('.slot')).filter(s => s.style.backgroundColor !== '' && s.style.backgroundColor !== 'white');
    const totalMin = slots.length * 10;
    document.getElementById('totalHours').innerText = `${Math.floor(totalMin/60)}h ${String(totalMin%60).padStart(2, '0')}m`;
}

// ระบบประวัติ
function saveToHistory() {
    const data = {
        id: Date.now(),
        date: document.getElementById('datePicker').value,
        total: document.getElementById('totalHours').innerText,
        user: document.getElementById('userName').value
    };
    let h = JSON.parse(localStorage.getItem('study_h') || '[]');
    h.unshift(data);
    localStorage.setItem('study_h', JSON.stringify(h));
    renderHistory();
    alert('Saved!');
}

function renderHistory() {
    const list = document.getElementById('history-list');
    const h = JSON.parse(localStorage.getItem('study_h') || '[]');
    list.innerHTML = h.map(i => `
        <div class="bg-white p-4 rounded-3xl flex justify-between items-center shadow-sm border border-slate-50">
            <div>
                <div class="text-[10px] font-black text-indigo-400">${i.date}</div>
                <div class="text-lg font-black text-slate-800">${i.total}</div>
                <div class="text-[9px] text-slate-300 font-bold uppercase">${i.user}</div>
            </div>
            <button onclick="deleteH(${i.id})" class="text-red-300 font-bold text-xs">ลบ</button>
        </div>
    `).join('');
}

function deleteH(id) {
    let h = JSON.parse(localStorage.getItem('study_h') || '[]');
    localStorage.setItem('study_h', JSON.stringify(h.filter(i => i.id !== id)));
    renderHistory();
}

function clearAllHistory() { if(confirm('Clear all?')) { localStorage.removeItem('study_h'); renderHistory(); } }

// Export รูป (ความชัดสูง)
async function downloadImage() {
    const area = document.getElementById('capture-area');
    const canvas = await html2canvas(area, {
        scale: 4,
        useCORS: true,
        onclone: (cloned) => {
            const name = cloned.getElementById('userName');
            name.style.fontSize = '32px'; // ขยายชื่อให้ชัด
            name.style.height = '60px';
        }
    });
    const link = document.createElement('a');
    link.download = 'StudyFlow.png';
    link.href = canvas.toDataURL();
    link.click();
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
    return `rgb(${r}, ${g}, ${b})`;
}

function addNewSubjectPrompt() {
    const n = prompt("Subject Name:");
    if (n) addSubject(n);
}

init();
