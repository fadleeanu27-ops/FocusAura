let activeColor = '#d1d1d6';
let totalMins = 0;
const aestheticPales = ['#FFDEB4', '#B2A4FF', '#FFB7B2', '#B2F2BB', '#D0EAFF', '#FDFD96', '#FFCCF9', '#C5E1A5'];

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('gridBody');
    // Generate Time Matrix 04:00 - 23:00
    for (let h = 4; h <= 23; h++) {
        const row = document.createElement('div');
        row.className = 'row';
        const lbl = document.createElement('div');
        lbl.className = 'hour';
        lbl.innerText = `${h.toString().padStart(2, '0')}H`;
        const slotsDiv = document.createElement('div');
        slotsDiv.className = 'slots';
        for (let i = 0; i < 6; i++) {
            const s = document.createElement('div');
            s.className = 'slot';
            s.onclick = () => {
                if (s.dataset.filled === "true") {
                    s.style.backgroundColor = "";
                    s.dataset.filled = "false";
                    totalMins -= 10;
                } else {
                    s.style.backgroundColor = activeColor;
                    s.dataset.filled = "true";
                    totalMins += 10;
                }
                updateTime();
            };
            slotsDiv.appendChild(s);
        }
        row.append(lbl, slotsDiv);
        grid.appendChild(row);
    }
});

function addSubject() {
    const input = document.getElementById('subjectInput');
    if (!input.value) return;
    const color = aestheticPales[Math.floor(Math.random() * aestheticPales.length)];
    const item = document.createElement('div');
    item.className = 'subject-item';
    item.innerHTML = `<div class="dot" style="background:${color}"></div> ${input.value}`;
    item.onclick = () => {
        document.querySelectorAll('.subject-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        activeColor = color;
    };
    document.getElementById('subjectList').appendChild(item);
    input.value = "";
}

function updateTime() {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    document.getElementById('totalDisplay').innerText = `${h}H ${m.toString().padStart(2, '0')}M`;
}

function downloadPlanner() {
    const rows = document.querySelectorAll('.row');
    rows.forEach(r => {
        if (r.querySelectorAll('.slot[data-filled="true"]').length === 0) r.classList.add('hide-row');
    });
    html2canvas(document.getElementById('captureArea'), { 
        scale: 3, 
        backgroundColor: getComputedStyle(document.getElementById('captureArea')).backgroundColor,
        borderRadius: 40
    }).then(canvas => {
        const a = document.createElement('a');
        a.download = `StudySummary_${new Date().toLocaleDateString()}.png`;
        a.href = canvas.toDataURL();
        a.click();
        rows.forEach(r => r.classList.remove('hide-row'));
    });
}

function toggleDarkMode() {
    document.getElementById('bodyApp').classList.toggle('dark-mode');
}

function saveToHistory() {
    const name = document.querySelector('.name-field').value || "Guest";
    const history = JSON.parse(localStorage.getItem('study_logs') || "[]");
    history.unshift({ 
        name, 
        total: document.getElementById('totalDisplay').innerText, 
        date: new Date().toLocaleString('th-TH') 
    });
    localStorage.setItem('study_logs', JSON.stringify(history.slice(0, 15)));
    alert("History saved locally!");
}

function toggleHistory() {
    const m = document.getElementById('historyModal');
    m.style.display = m.style.display === 'flex' ? 'none' : 'flex';
    if (m.style.display === 'flex') {
        const data = JSON.parse(localStorage.getItem('study_logs') || "[]");
        document.getElementById('historyContent').innerHTML = data.map(d => `
            <div style="padding:15px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                <span><strong>${d.name}</strong><br><small style="color:#86868b">${d.date}</small></span>
                <strong style="font-size:18px;">${d.total}</strong>
            </div>
        `).join('') || "<p style='text-align:center; color:#86868b;'>No activity found.</p>";
    }
}
