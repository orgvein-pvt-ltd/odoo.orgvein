/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { useService } from "@web/core/utils/hooks";
import { ActivityMenu } from "@hr_attendance/components/attendance_menu/attendance_menu";

patch(ActivityMenu.prototype, {

    setup() {
        super.setup(...arguments);
        this.orm_break = useService("orm");
    },

    async searchReadEmployee() {
        await super.searchReadEmployee(...arguments);

        if (!this.employee || !this.employee.id) return;

        try {
            const result = await this.orm_break.call(
                "hr.employee",
                "get_break_duration_state",
                [], {}
            );
            if (result && result.total_break_seconds) {
                const breakHours = result.total_break_seconds / 3600.0;

                // Subtract break from worked hours
                this.employee.hours_today = Math.max(
                    0,
                    (this.employee.hours_today || 0) - breakHours
                );
                this.employee.last_attendance_worked_hours = Math.max(
                    0,
                    (this.employee.last_attendance_worked_hours || 0) - breakHours
                );

                // Reformat display
                this.hoursToday = this.date_formatter(this.employee.hours_today);
                this.lastAttendanceWorkedHours = this.date_formatter(
                    this.employee.last_attendance_worked_hours
                );
            }
        } catch (_) {
            // silently ignore
        }
    },
});