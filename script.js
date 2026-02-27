/**
 * Study Flow Pro - Ultra Clarity Edition
 * แก้ไข: ข้อความไม่ชัด, รองรับการลากนิ้ว, สุ่มสีอัตโนมัติ
 */

const modernColors = ['#4F46E5', '#E11D48', '#7C3AED', '#059669', '#D97706', '#2563EB', '#DC2626', '#0891B2', '#9333EA', '#EA580C'];
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
            row.className = 'time-row flex items-center py-3 border-b border-slate-50'; // เพิ่ม Padding ให้แถวสูงขึ้น
            row.innerHTML = `
                <div class="time-label text-[13px] font-black text-slate-500 w-16 shrink-0">${h.toString().padStart(2, '0')}:00</div>
                <div class="hour-slots flex flex-1 gap-2 h-10">
                    ${Array(6).fill(0).map(() => `
                        <div class="slot flex-1 bg-white border-2 border-slate-100 rounded-xl cursor-pointer transition-all touch-none shadow-sm" 
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
}

// --- ระบบ Export รูปภาพ (เน้นความชัดระดับ 5X) ---
async function downloadImage() {
    const captureArea = document.getElementById('capture-area');
    const rows = document.querySelectorAll('.time-row');
    const addBtn = document.querySelector('button[onclick*="Subject"]');
    const hiddenRows = [];

    // 1. กรองแถวว่างออกเพื่อให้รูปกระชับและตัวหนังสือดูใหญ่ขึ้น
    rows.forEach(row => {
        const hasColor = Array.from(row.querySelectorAll('.slot'))
            .some(s => s.style.background !== "" && s.style.background !== "white");
        if (!hasColor) {
            row.style.display = 'none';
            hiddenRows.push(row);
        }
    });

    if (addBtn) addBtn.style.visibility = 'hidden';

    // 2. ใช้ html2canvas พร้อม Scale 5 เท่า (ชัดพิเศษ)
    const canvas = await html2canvas(captureArea, { 
        scale: 5, 
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        letterRendering: true, // ช่วยให้ตัวอักษรคมขึ้น
        onclone: (clonedDoc) => {
            // ปรับแต่งสไตล์ในรูปให้เข้มขึ้นเป็นพิเศษ
            clonedDoc.querySelectorAll('.time-label').forEach(l => {
                l.style.color = '#1E293B'; // สีเข้มจัด
                l.style.fontWeight = '900'; // หนาที่สุด
            });
            clonedDoc.querySelector('#totalHours').style.fontSize = '32px';
            clonedDoc.querySelector('#totalHours').style.color = '#4F46E5';
        }
    });

    hiddenRows.forEach(row => row.style.display = 'flex');
    if (addBtn) addBtn.style.visibility = 'visible';

    const link = document.createElement('a');
    link.download = `DailyFlow-${document.getElementById('datePicker').value}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
}

// --- ระบบเสริมอื่นๆ ---
function addSubject(name) {
    const container = document.getElementById('subject-list');
    const color = getRandomColor();
    const item = document.createElement('div');
    item.className = 'subject-item flex items-center gap-4 cursor-pointer p-4 rounded-3xl transition-all border-2 border-transparent mb-3 shadow-sm';
    item.onclick = () => {
        document.querySelectorAll('.subject-item').forEach(el => el.classList.remove('active', 'bg-slate-100', 'border-slate-300'));
        item.classList.add('active', 'bg-slate-100', 'border-slate-300');
        currentSelectedColor = color;
    };
    item.innerHTML = `<div class="w-5 h-5 rounded-full" style="background:${color}"></div>
                      <span class="text-sm font-black text-slate-800">${name}</span>`;
    container.appendChild(item);
    if (container.children.length === 1) item.click();
}

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
function updateTotal() {
    const painted = Array.from(document.querySelectorAll('.slot')).filter(s => s.style.background !== "" && s.style.background !== "white");
    const mins = painted.length * 10;
    document.getElementById('totalHours').innerText = `${Math.floor(mins/60)}h ${String(mins%60).padStart(2, '0')}m`;
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
    const name = prompt("ชื่อวิชาใหม่:");
    if (name) addSubject(name);
}

init();
