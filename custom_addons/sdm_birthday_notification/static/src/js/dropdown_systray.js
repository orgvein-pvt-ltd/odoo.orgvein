/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, useState, onMounted, useRef, onWillUnmount } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

/* ════════════════════════════════════════════════════════════════
   BIRTHDAY SONG  –  Plays your MP3 file
════════════════════════════════════════════════════════════════ */

let _birthdayAudio = null;

function playBirthdaySong() {
    // Stop any existing audio first
    if (_birthdayAudio) {
        _birthdayAudio.pause();
        _birthdayAudio.currentTime = 0;
    }
    _birthdayAudio = new Audio(
        "/web/content?module=sdm_birthday_notification&filename=happy_birthday.mp3&field=datas"
    );
    // Simpler path approach — use the static file path directly
    _birthdayAudio = new Audio(
        "/sdm_birthday_notification/static/src/audio/happy_birthday.mp3"
    );
    _birthdayAudio.volume = 0.85;
    _birthdayAudio.play().catch(err => console.error("Birthday song failed to play:", err));

    // Stop after 16 seconds (song duration)
    setTimeout(() => {
        if (_birthdayAudio) {
            _birthdayAudio.pause();
            _birthdayAudio.currentTime = 0;
        }
    }, 16000);
}

function stopBirthdaySong() {
    if (_birthdayAudio) {
        _birthdayAudio.pause();
        _birthdayAudio.currentTime = 0;
        _birthdayAudio = null;
    }
}

/* ════════════════════════════════════════════════════════════════
   CONFETTI
════════════════════════════════════════════════════════════════ */

function launchConfetti() {
    const canvas = document.createElement("canvas");
    canvas.style.cssText =
        "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999;";
    document.body.appendChild(canvas);
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx    = canvas.getContext("2d");
    const count = window.innerWidth < 480 ? 160 : 220;
    const pieces = Array.from({length: count}, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 8 + 4,
        d: Math.random() * 120 + 30,
        color: `hsl(${Math.random()*360},90%,60%)`,
        tilt: Math.random() * 10 - 10,
        tiltAngle: 0,
        tiltSpeed: Math.random() * 0.07 + 0.05,
    }));
    let frame = 0;
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach(p => {
            p.tiltAngle += p.tiltSpeed;
            p.y         += (Math.cos(frame * 0.01 + p.d) + 2);
            p.tilt       = Math.sin(p.tiltAngle) * 12;
            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.ellipse(p.x + p.tilt, p.y, p.r, p.r / 2, p.tilt, 0, Math.PI * 2);
            ctx.fill();
        });
        frame++;
        if (frame < 900) requestAnimationFrame(draw);
        else canvas.remove();
    }
    draw();
}

/* ════════════════════════════════════════════════════════════════
   BIRTHDAY POPUP
════════════════════════════════════════════════════════════════ */

function showBirthdayPopup(name, imageBase64) {
    const overlay = document.createElement("div");
    overlay.className = "bday_overlay";
    const imgHTML = imageBase64
        ? `<div class="crown_avatar"><span class="bday_crown">👑</span><img src="data:image/png;base64,${imageBase64}" class="bday_avatar" alt="${name}"/></div>`
        : `<div class="crown_avatar"><span class="bday_crown">👑</span><div class="bday_avatar_placeholder">🎂</div></div>`;
    overlay.innerHTML = `
        <div class="bday_card">
            <span class="bday_float_left">🎈</span>
            <span class="bday_float_right">🎉</span>
            ${imgHTML}
            <div class="card-balloon">🎈</div>
            <div class="card-balloon">🎊</div>
            <div class="card-balloon">🎉</div>
            <div class="card-balloon">🎈</div>
            <div class="card-balloon">🎊</div>
            <h2 class="bday_title">Happy Birthday!</h2>
            <p class="bday_name">${name}</p>
            <p class="bday_wish">Wishing you a day full of joy,<br>laughter and wonderful surprises! 🎂✨</p>
            <div class="bday_progress_wrap">
                <div class="bday_progress_bar"></div>
            </div>
            <button class="bday_close_btn" id="bdayCloseBtn">🎊 Thank You!</button>
        </div>`;

    document.body.appendChild(overlay);

    function closePopup() {
        stopBirthdaySong();
        overlay.classList.add("bday_fadeout");
        setTimeout(() => overlay.remove(), 500);
    }

    // Close on button click — also stops song
    document.getElementById("bdayCloseBtn").addEventListener("click", closePopup);

    // Auto close after 16s (matches song duration)
    setTimeout(() => {
        if (document.body.contains(overlay)) closePopup();
    }, 16000);

    playBirthdaySong();
    launchConfetti();
}

/* ════════════════════════════════════════════════════════════════
   OWL COMPONENT
════════════════════════════════════════════════════════════════ */

export class BirthdayListSystray extends Component {
    static template = "sdm_birthday_notification.SystrayDropdown";

    setup() {
        this.orm  = useService("orm");
        this.user = useService("user");
        this.isHR = false;
        this.rootRef = useRef("root");

        this.state = useState({
            birthdays        : [],
            todayBirthdays   : [],
            upcomingCount    : 0,
            open             : false,
            showDot          : false,   // red dot for regular employees
            acknowledged     : false,   // true after user clicks OK in dropdown
        });

        // Close dropdown when clicking anywhere outside
        this._onClickOutside = (e) => {
            if (this.state.open &&
                this.rootRef.el &&
                !this.rootRef.el.contains(e.target)) {
                this.state.open = false;
            }
        };

        onMounted(async () => {
            document.addEventListener("click", this._onClickOutside);

            this.isHR = await this.user.hasGroup("hr.group_hr_user");
            await this.checkOwnBirthday();    // everyone
            await this.loadTodayBirthdays();  // everyone

            // Show red dot if there are today's birthdays and not yet acknowledged
            const ackKey = `bday_ack_${new Date().toISOString().split("T")[0]}`;
            if (this.state.todayBirthdays.length > 0 && !localStorage.getItem(ackKey)) {
                this.state.showDot = true;
            }

            if (this.isHR) {
                await this.loadBirthdays();   // HR only
            }
        });

        // Clean up listener when component is destroyed
        onWillUnmount(() => {
            document.removeEventListener("click", this._onClickOutside);
        });
    }

    toggleDropdown() {
        this.state.open = !this.state.open;
    }

    closeDropdown() {
        this.state.open = false;
    }

    acknowledgeNotification() {
        // Hide the red dot and save to localStorage so it stays gone for today
        this.state.showDot   = false;
        this.state.upcomingCount = 0;
        this.state.open      = false;
        const ackKey = `bday_ack_${new Date().toISOString().split("T")[0]}`;
        localStorage.setItem(ackKey, "seen");
    }

    /* ── TODAY BIRTHDAYS — safe for ALL users via sudo Python method ── */
    async loadTodayBirthdays() {
        try {
            const result = await this.orm.call(
                "hr.employee", "get_today_birthdays", []
            );
            this.state.todayBirthdays = result.map(emp => ({
                ...emp,
                image_url: emp.image_128 ? `data:image/png;base64,${emp.image_128}` : null,
            }));
        } catch (err) {
            console.error("Error loading today birthdays:", err);
        }
    }

    /* ── UPCOMING BIRTHDAYS — HR only via sudo Python method ── */
    async loadBirthdays() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const currentYear = today.getFullYear();

            const employees = await this.orm.call(
                "hr.employee", "get_upcoming_birthdays", []
            );

            const allBirthdays = employees
                .filter(e => e.birthday)
                .map(emp => {
                    const bd       = new Date(emp.birthday);
                    const nextBday = new Date(currentYear, bd.getMonth(), bd.getDate());
                    // If today or already passed this year, push to next year
                    if (nextBday <= today) nextBday.setFullYear(currentYear + 1);
                    const diff = Math.ceil((nextBday - today) / (1000 * 60 * 60 * 24));
                    return {
                        ...emp,
                        daysRemaining: diff,
                        birthdayLabel: nextBday.toLocaleDateString("en-US", { month:"short", day:"2-digit" }),
                        image_url: emp.image_128 ? `data:image/png;base64,${emp.image_128}` : null,
                        isToday: false,
                    };
                })
                .filter(e => e.daysRemaining > 0)   // exclude today
                .sort((a, b) => a.daysRemaining - b.daysRemaining)
                .slice(0, 4);                        // only next 4

            this.state.birthdays     = allBirthdays;
            this.state.upcomingCount = allBirthdays.length;
        } catch (err) {
            console.error("Error loading birthdays:", err);
        }
    }

    /* ── OWN BIRTHDAY — safe for ALL users via sudo Python method ── */
    async checkOwnBirthday() {
        try {
            const emp = await this.orm.call(
                "hr.employee", "get_own_birthday", [this.user.userId]
            );
            if (!emp) return;

            const today    = new Date();
            const birthday = new Date(emp.birthday);
            const isBirthday =
                today.getDate()  === birthday.getDate() &&
                today.getMonth() === birthday.getMonth();
            if (!isBirthday) return;

            const todayKey = `bday_popup_${emp.id}_${today.toISOString().split("T")[0]}`;
            if (localStorage.getItem(todayKey)) return;

            setTimeout(() => showBirthdayPopup(emp.name, emp.image_128 || null), 1500);
            localStorage.setItem(todayKey, "shown");
        } catch (err) {
            console.error("Error checking birthday:", err);
        }
    }
}

/* ════════════════════════════════════════════════════════════════
   REGISTER SYSTRAY
════════════════════════════════════════════════════════════════ */

registry.category("systray").add(
    "sdm_birthday_notification.BirthdayListSystray",
    { Component: BirthdayListSystray, sequence: 15 }
);