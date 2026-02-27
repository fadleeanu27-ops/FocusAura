/**
 * Study Flow Pro - High Clarity & Mobile Optimized
 */

const modernColors = ['#6366f1', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#06b6d4', '#a855f7', '#f97316'];
let usedColors = []; 
let currentSelectedColor = modernColors[0];
let isDrawing = false;

function init() {
    const datePicker = document.getElementById('datePicker');
    if (datePicker) datePicker.value = new Date().toISOString().split('T')[0];

    const timeGrid = document.getElementById('time-grid');
    if (timeGrid) {
        timeGrid.innerHTML = ''; 
        for (let h = 4; h <= 23; h++) {
            const row = document.createElement('div');
            row.className = 'time-row flex items-center py-2.5 border-b border-slate-50 last:border-0';
            row.innerHTML = `
                <div class="time-label text-[12px] font-bold text-slate-400 w-14 shrink-0">${h.toString().padStart(2, '0')}:00</div>
                <div class="hour-slots flex flex-1 gap-1.5 h-9">
                    ${Array(6).fill(0).map(() => `
                        <div class="slot flex-1 bg-white border border-slate-100 rounded-md cursor-pointer transition-all touch-none shadow-sm" 
                             onmousedown="startPaint(this)" 
                             onmouseenter="continuePaint(this)"
                             ontouchstart="handleTouch(event)"
                             ontouchmove="handleTouch(event)"></div>
                    `).join('')}
                </div>
            `;
            timeGrid.appendChild(row);
        }
    }

    const subjectList = document.getElementById('subject-list');
    if (subjectList) {
        subjectList.innerHTML = '';
        ['Quran', 'English', 'Academic'].forEach(n => addSubject(n));
    }

    window.onmouseup = () => isDrawing = false;
    window.ontouchend = () => isDrawing = false;
    renderHistory();
}

// --- ระบบระบายสี ---
function startPaint(el) { isDrawing = true; toggleColor(el); }
function continuePaint(el) { if (isDrawing) toggleColor(el); }
function handleTouch(e) {
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains('slot')) {
        isDrawing = true;
        toggleColor(target);
    }
}

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

// --- ระบบ Export รูปภาพ (เน้นความชัดเจนของข้อความ) ---
async function downloadImage() {
    const captureArea = document.getElementById('capture-area');
    const rows = document.querySelectorAll('.time-row');
    const addBtn = document.querySelector('button[onclick*="Subject"]');
    const hiddenRows = [];

    // 1. กรองเฉพาะแถวที่มีข้อมูล (ทำให้ข้อความดูใหญ่ขึ้นในรูป)
    rows.forEach(row => {
        const hasColor = Array.from(row.querySelectorAll('.slot'))
            .some(s => s.style.background !== "" && s.style.background !== "white");
        if (!hasColor) {
            row.style.display = 'none';
            hiddenRows.push(row);
        }
    });

    // 2. ซ่อน UI ที่ไม่จำเป็น
    if (addBtn) addBtn.style.visibility = 'hidden';

    // 3. ใช้ html2canvas พร้อมตั้งค่าความชัดสูงสุด
    const canvas = await html2canvas(captureArea, { 
        scale: 4, // เพิ่ม Scale เป็น 4 เท่าเพื่อความคมชัดของตัวหนังสือ
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc) => {
            // ปรับแต่งสไตล์ในรูปที่ clone มาให้เข้มข้นขึ้น
            const clonedLabels = clonedDoc.querySelectorAll('.time-label');
            clonedLabels.forEach(l => {
                l.style.color = '#64748b'; // ปรับสีตัวอักษรเวลาให้เข้มขึ้นในรูป
                l.style.fontSize = '14px';
            });
        }
    });

    // 4. คืนค่าหน้าจอเดิม
    hiddenRows.forEach(row => row.style.display = 'flex');
    if (addBtn) addBtn.style.visibility = 'visible';

    // 5. บันทึกไฟล์
    const link = document.createElement('a');
    link.download = `StudyFlow-${document.getElementById('datePicker').value}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
}

function addSubject(name) {
    const container = document.getElementById('subject-list');
    const color = getRandomColor();
    const item = document.createElement('div');
    item.className = 'subject-item flex items-center gap-4 cursor-pointer p-3.5 rounded-2xl transition-all border border-transparent shadow-sm mb-2';
    item.onclick = () => {
        document.querySelectorAll('.subject-item').forEach(el => el.classList.remove('active', 'bg-slate-50', 'border-slate-200'));
        item.classList.add('active', 'bg-slate-50', 'border-slate-200');
        currentSelectedColor = color;
    };
    item.innerHTML = `<div class="w-4 h-4 rounded-full shadow-inner" style="background:${color}"></div>
                      <span class="text-sm font-extrabold text-slate-700">${name}</span>`;
    container.appendChild(item);
    if (container.children.length === 1) item.click();
}

function updateTotal() {
    const painted = Array.from(document.querySelectorAll('.slot')).filter(s => s.style.background !== "" && s.style.background !== "white");
    const mins = painted.length * 10;
    const h = Math.floor(mins/60);
    const m = String(mins%60).padStart(2, '0');
    document.getElementById('totalHours').innerText = `${h}h ${m}m`;
}

function getRandomColor() {
    if (usedColors.length === modernColors.length) usedColors = [];
    let available = modernColors.filter(c => !usedColors.includes(c));
    let res = available[Math.floor(Math.random() * available.length)];
    usedColors.push(res);
    return res;
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
    return `rgb(${r}, ${g}, ${b})`;
}

function addNewSubjectPrompt() {
    const name = prompt("เพิ่มวิชาใหม่:");
    if (name) addSubject(name);
}

init();