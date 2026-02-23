/** @odoo-module **/

import { Component, useState, onMounted, onWillUnmount } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";

class BreakSystray extends Component {
    static template = "hr_attendance_break.BreakSystray";

    setup() {
        this.orm          = useService("orm");
        this.notification = useService("notification");

        this.state = useState({
            onBreak:  false,
            visible:  false,
            loading:  false,
        });

        this._timer      = null;
        this._clicking   = false;   // extra guard against double-click / loop

        onMounted(async () => {
            await this._refresh();
            // Poll every 20 s — only _refresh, never toggleBreak
            this._timer = setInterval(() => this._refresh(), 20_000);
        });

        onWillUnmount(() => {
            if (this._timer) clearInterval(this._timer);
        });
    }

    async _refresh() {
        try {
            const r = await this.orm.call(
                "hr.employee", "get_attendance_break_state", [], {}
            );
            this.state.onBreak  = !!r.on_break;
            this.state.visible  = !!r.attendance_id;
        } catch (_) {
            // silently ignore — employee might not exist for admin users
        }
    }

    async toggleBreak(ev) {
        // Stop the click from bubbling or firing twice
        ev.stopPropagation();
        ev.preventDefault();

        // Hard guard: only one call at a time
        if (this.state.loading || this._clicking) return;
        this._clicking  = true;
        this.state.loading = true;

        try {
            const r = await this.orm.call(
                "hr.employee", "toggle_break", [], {}
            );
            if (r && r.success) {
                this.state.onBreak = !!r.on_break;
                const msg = r.action === "break_started"
                    ? "☕  Break started."
                    : "▶️  Welcome back!";
                this.notification.add(msg, { type: "success", sticky: false });
            } else {
                const err = (r && r.error) || "Unknown error";
                this.notification.add("Break: " + err, { type: "warning" });
            }
        } catch (e) {
            this.notification.add(
                "Break toggle failed: " + (e.message || String(e)),
                { type: "danger" }
            );
            // Resync state from server
            await this._refresh();
        } finally {
            this.state.loading = false;
            // Release click guard after 1 s to prevent accidental rapid clicks
            setTimeout(() => { this._clicking = false; }, 1000);
        }
    }
}

registry.category("systray").add(
    "hr_attendance_break.break_button",
    { Component: BreakSystray, sequence: 99 },
);