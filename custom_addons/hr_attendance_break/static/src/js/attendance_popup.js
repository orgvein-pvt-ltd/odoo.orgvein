/** @odoo-module **/

import { Component, useChildSubEnv } from "@odoo/owl";
import { patch } from "@web/core/utils/patch";
import { ActivityMenu } from "@hr_attendance/components/attendance_menu/attendance_menu";
import { mountComponent } from "@web/env";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeStr() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtHours(h) {
    const hh = Math.floor(h || 0);
    const mm = Math.round(((h || 0) - hh) * 60);
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// ─── Popup rendered as pure HTML — no OWL mounting needed ────────────────────
// Since OWL mounting is causing DOM target issues, we render the popup
// as plain HTML injected into document.body. Simple, reliable, zero OWL issues.

function showPopup(props) {
    // Remove any existing popup
    const old = document.getElementById("att_popup_root");
    if (old) old.remove();

    const isCheckout = props.action === "check_out";

    // Determine greeting
    const h = new Date().getHours();
    const greeting = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";

    const html = isCheckout ? `
        <div class="att_popup_overlay" id="att_popup_root">
            <div class="att_popup_card is-checkout">
                <span class="att_popup_emoji">🌅</span>
                <h2>Goodbye!</h2>
                <p class="att_popup_sub">See you, <strong>${props.employeeName}</strong>!</p>
                <div class="att_popup_stats">
                    <div>
                        <div class="att_stat_label">⏱ Worked Today</div>
                        <div class="att_stat_value">${props.worked || "00:00"}</div>
                    </div>
                </div>
                <div class="att_popup_time">${props.time}</div>
                <button class="att_popup_btn btn-checkout" id="att_popup_close_btn">
                    Done for Today 👍
                </button>
            </div>
        </div>
    ` : `
        <div class="att_popup_overlay" id="att_popup_root">
            <div class="att_popup_card">
                <span class="att_popup_emoji">👋</span>
                <h2>Good ${greeting}!</h2>
                <p class="att_popup_sub">Welcome, <strong>${props.employeeName}</strong></p>
                <p class="att_popup_sub">Have a productive day ahead.</p>
                <div class="att_popup_time">${props.time}</div>
                <button class="att_popup_btn btn-checkin" id="att_popup_close_btn">
                    Let's Go ✅
                </button>
            </div>
        </div>
    `;

    // Inject into body
    document.body.insertAdjacentHTML("beforeend", html);

    const root = document.getElementById("att_popup_root");

    const destroy = () => {
        const el = document.getElementById("att_popup_root");
        if (el) el.remove();
    };

    // Close on button click
    document.getElementById("att_popup_close_btn").addEventListener("click", () => {
        clearTimeout(timer);
        destroy();
    });

    // Close on overlay click
    root.addEventListener("click", (e) => {
        if (e.target === root) { clearTimeout(timer); destroy(); }
    });

    // Auto close after 7 seconds
    const timer = setTimeout(destroy, 7000);
}

// ─── Patch searchReadEmployee() ───────────────────────────────────────────────

const _origSearchRead = ActivityMenu.prototype.searchReadEmployee;

patch(ActivityMenu.prototype, {
    async searchReadEmployee() {
        const stateBefore = this.state.checkedIn;
        const isFirst = this._popupFirstLoad !== false;

        await _origSearchRead.call(this);

        const stateAfter = this.state.checkedIn;

        if (isFirst) {
            this._popupFirstLoad = false;
            return;
        }

        if (stateBefore === stateAfter) return;

        const name = this.employee?.employee_name || "there";

        if (!stateBefore && stateAfter) {
            showPopup({ action: "check_in", employeeName: name, time: timeStr() });
        } else if (stateBefore && !stateAfter) {
            showPopup({
                action: "check_out",
                employeeName: name,
                time: timeStr(),
                worked: fmtHours(this.employee?.hours_today || 0),
            });
        }
    }
});