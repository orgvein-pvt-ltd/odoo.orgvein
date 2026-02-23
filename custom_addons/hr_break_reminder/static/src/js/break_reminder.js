/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ActivityMenu } from "@hr_attendance/components/attendance_menu/attendance_menu";

// ─── Quotes ───────────────────────────────────────────────────────────────────

const QUOTES = [
    "No ship sails itself to port.",
    "The river does not rush — yet it shapes the stone.",
    "No harvest comes to those who only watch the field.",
    "A key rusts in the hand that never tries the door.",
    "No caravan reaches the desert's end without one who counted the stars.",
    "The tree that bends in the storm was rooted long before the wind came.",
    "No fire warms a home without one who lit it.",
    "Rest is not idleness — it is the sharpening of the blade.",
];

function randomQuote() {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

// ─── Popup ────────────────────────────────────────────────────────────────────

function showBreakReminder() {
    const old = document.getElementById("brr_popup_root");
    if (old) old.remove();

    document.body.insertAdjacentHTML("beforeend", `
        <div class="brr_overlay" id="brr_popup_root">
            <div class="brr_card">
                <div class="brr_icon">
                    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M32 6 C32 6 14 28 14 40 a18 18 0 0 0 36 0 C50 28 32 6 32 6Z"
                              fill="#5BBFDE" opacity="0.85"/>
                        <ellipse cx="25" cy="34" rx="4" ry="7" fill="white" opacity="0.15"
                                 transform="rotate(-20 25 34)"/>
                        <circle cx="47" cy="17" r="12" fill="#0d1b2a" stroke="#5BBFDE" stroke-width="1.5"/>
                        <line x1="47" y1="11" x2="47" y2="17" stroke="#5BBFDE" stroke-width="1.5" stroke-linecap="round"/>
                        <line x1="47" y1="17" x2="52" y2="17" stroke="#7dd3f0" stroke-width="1.5" stroke-linecap="round"/>
                        <circle cx="47" cy="17" r="1.5" fill="#5BBFDE"/>
                    </svg>
                </div>
                <h2 class="brr_title">Time for a Break!</h2>
                <p class="brr_msg">
                    You've been working for <strong>2 hours</strong>.<br/>
                    Step away, stretch, and <span class="brr_highlight">hydrate yourself 💧</span>
                </p>
                <div class="brr_tips">
                    <span>🚶 Walk around</span>
                    <span>👀 Rest your eyes</span>
                    <span>💧 Drink water</span>
                    <span>🧘 Breathe deeply</span>
                </div>
                <p class="brr_quote">"${randomQuote()}"</p>
                <button class="brr_btn" id="brr_dismiss_btn">OK, Fine! ✅</button>
            </div>
        </div>
    `);

    const destroy = () => {
        const el = document.getElementById("brr_popup_root");
        if (el) el.remove();
    };

    document.getElementById("brr_dismiss_btn").addEventListener("click", () => {
        clearTimeout(autoClose);
        destroy();
    });

    document.getElementById("brr_popup_root").addEventListener("click", (e) => {
        if (e.target.id === "brr_popup_root") { clearTimeout(autoClose); destroy(); }
    });

    const autoClose = setTimeout(destroy, 10000);
}

// ─── Inject CSS ───────────────────────────────────────────────────────────────

(function injectCSS() {
    if (document.getElementById("brr_styles")) return;
    const style = document.createElement("style");
    style.id = "brr_styles";
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600&family=Playfair+Display:ital,wght@0,700;1,400&display=swap');

        .brr_overlay {
            position: fixed; inset: 0; z-index: 99999;
            background: rgba(10,15,40,0.78);
            backdrop-filter: blur(6px);
            display: flex; align-items: center; justify-content: center;
            animation: brrFadeIn .35s ease;
        }
        @keyframes brrFadeIn { from { opacity:0 } to { opacity:1 } }

        .brr_card {
            background: linear-gradient(145deg,#0d1b2a 0%,#1a2744 60%,#0a2a3a 100%);
            border: 1px solid rgba(91,191,222,0.25);
            border-radius: 24px;
            padding: 40px 44px 32px;
            max-width: 400px; width: 90%;
            text-align: center;
            box-shadow: 0 0 60px rgba(91,191,222,0.15), 0 24px 60px rgba(0,0,0,0.5);
            animation: brrSlideUp .4s cubic-bezier(.22,1,.36,1);
        }
        @keyframes brrSlideUp {
            from { transform:translateY(30px); opacity:0 }
            to   { transform:translateY(0);    opacity:1 }
        }

        .brr_icon {
            width: 76px; height: 76px; margin: 0 auto 18px;
            animation: brrPulse 2.5s ease-in-out infinite;
        }
        @keyframes brrPulse {
            0%,100% { transform:scale(1); }
            50%     { transform:scale(1.07); }
        }

        .brr_title {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 24px; color: #e8f4f8;
            margin: 0 0 12px; letter-spacing: -.5px;
        }

        .brr_msg {
            font-family: 'DM Sans', sans-serif;
            color: #8ab8cc; font-size: 14px; line-height: 1.65;
            margin: 0 0 20px;
        }
        .brr_msg strong { color: #c8e6f2; }
        .brr_highlight  { color: #5BBFDE; font-weight: 600; }

        .brr_tips {
            display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
            margin-bottom: 20px;
        }
        .brr_tips span {
            font-family: 'DM Sans', sans-serif;
            background: rgba(91,191,222,0.1);
            border: 1px solid rgba(91,191,222,0.2);
            border-radius: 20px; padding: 5px 12px;
            font-size: 12px; color: #7dd3f0;
        }

        .brr_quote {
            font-family: 'Playfair Display', Georgia, serif;
            font-style: italic;
            font-size: 13px;
            color: #f0c040;
            margin: 0 0 22px;
            padding: 0 8px;
            line-height: 1.5;
        }

        .brr_btn {
            font-family: 'DM Sans', sans-serif;
            background: linear-gradient(135deg,#5BBFDE,#3a8fa8);
            color: #0d1b2a; font-weight: 600; font-size: 14px;
            border: none; border-radius: 50px;
            padding: 12px 32px; cursor: pointer;
            box-shadow: 0 4px 20px rgba(91,191,222,0.35);
            transition: transform .2s, box-shadow .2s;
        }
        .brr_btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 28px rgba(91,191,222,0.45);
        }
    `;
    document.head.appendChild(style);
})();

// ─── Patch ActivityMenu ───────────────────────────────────────────────────────

const _origSearchRead = ActivityMenu.prototype.searchReadEmployee;

patch(ActivityMenu.prototype, {
    async searchReadEmployee() {
        const stateBefore = this.state.checkedIn;

        await _origSearchRead.call(this);

        const stateAfter = this.state.checkedIn;

        if (!stateBefore && stateAfter) {
            this._startBreakReminder();
        }

        if (stateBefore && !stateAfter) {
            this._stopBreakReminder();
        }
    },

    _startBreakReminder() {
        this._stopBreakReminder();

        const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

        const schedule = () => {
            // store timeout id so we can clear on checkout
            this._brrTimer = setTimeout(() => {
                showBreakReminder();
                schedule(); // schedule next one after 2 hours
            }, TWO_HOURS_MS);
        };

        schedule();
    },

    _stopBreakReminder() {
        if (this._brrTimer) {
            clearInterval(this._brrTimer);
            this._brrTimer = null;
        }
        this._checkInTime = null;
        const el = document.getElementById("brr_popup_root");
        if (el) el.remove();
    },
});