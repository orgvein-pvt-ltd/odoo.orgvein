from odoo import models, fields, api
from datetime import datetime
import logging

_logger = logging.getLogger(__name__)


class HrAttendanceBreak(models.Model):
    _name = 'hr.attendance.break'
    _description = 'Attendance Break'
    _order = 'break_start desc'

    employee_id = fields.Many2one(
        'hr.employee', string='Employee', required=True,
        ondelete='cascade', index=True
    )
    attendance_id = fields.Many2one(
        'hr.attendance', string='Attendance',
        ondelete='cascade', index=True
    )
    break_start = fields.Datetime(string='Break Start', required=True)
    break_end = fields.Datetime(string='Break End')
    break_duration = fields.Float(
        string='Break Duration (hrs)',
        compute='_compute_break_duration', store=True
    )

    @api.depends('break_start', 'break_end')
    def _compute_break_duration(self):
        for rec in self:
            if rec.break_start and rec.break_end:
                rec.break_duration = (
                    rec.break_end - rec.break_start
                ).total_seconds() / 3600.0
            else:
                rec.break_duration = 0.0


class HrAttendance(models.Model):
    _inherit = 'hr.attendance'

    break_ids = fields.One2many(
        'hr.attendance.break', 'attendance_id', string='Breaks'
    )
    on_break = fields.Boolean(string='On Break', default=False)

    def action_start_break(self):
        self.ensure_one()
        if self.on_break:
            return
        now = datetime.utcnow().replace(microsecond=0)
        self.env['hr.attendance.break'].sudo().create({
            'employee_id': self.employee_id.id,
            'attendance_id': self.id,
            'break_start': now,
        })
        self.sudo().write({'on_break': True})
        _logger.info('Break STARTED for employee: %s', self.employee_id.name)

    def action_end_break(self):
        self.ensure_one()
        if not self.on_break:
            return
        now = datetime.utcnow().replace(microsecond=0)
        open_break = self.env['hr.attendance.break'].sudo().search([
            ('attendance_id', '=', self.id),
            ('break_end', '=', False),
        ], limit=1, order='break_start desc')
        if open_break:
            open_break.sudo().write({'break_end': now})
        self.sudo().write({'on_break': False})
        _logger.info('Break ENDED for employee: %s', self.employee_id.name)


class HrEmployee(models.Model):
    _inherit = 'hr.employee'

    @api.model
    def get_attendance_break_state(self):
        """Called by the frontend Break button every 20s."""
        employee = self.env['hr.employee'].sudo().search(
            [('user_id', '=', self.env.uid)], limit=1
        )
        if not employee:
            return {'on_break': False, 'attendance_id': False}

        attendance = self.env['hr.attendance'].sudo().search([
            ('employee_id', '=', employee.id),
            ('check_out', '=', False),
        ], limit=1, order='check_in desc')

        return {
            'on_break': attendance.on_break if attendance else False,
            'attendance_id': attendance.id if attendance else False,
        }

    @api.model
    def get_break_duration_state(self):
        """Returns total break seconds (including ongoing break) for the
        currently logged-in employee's active attendance session."""
        employee = self.env['hr.employee'].sudo().search(
            [('user_id', '=', self.env.uid)], limit=1
        )
        if not employee:
            return {'total_break_seconds': 0, 'on_break': False}

        attendance = self.env['hr.attendance'].sudo().search([
            ('employee_id', '=', employee.id),
            ('check_out', '=', False),
        ], limit=1, order='check_in desc')

        if not attendance:
            return {'total_break_seconds': 0, 'on_break': False}

        total_seconds = 0
        now = datetime.utcnow().replace(microsecond=0)

        for brk in attendance.break_ids:
            start = brk.break_start
            end = brk.break_end if brk.break_end else now
            total_seconds += max(0, (end - start).total_seconds())

        return {
            'total_break_seconds': int(total_seconds),
            'on_break': attendance.on_break,
        }

    @api.model
    def toggle_break(self):
        """Toggle break on/off for the logged-in employee."""
        try:
            state = self.get_attendance_break_state()
            if not state.get('attendance_id'):
                return {
                    'success': False,
                    'error': 'No active check-in found. Please check in first.',
                }

            attendance = self.env['hr.attendance'].sudo().browse(
                state['attendance_id']
            )
            if not attendance.exists():
                return {'success': False, 'error': 'Attendance record not found.'}

            if state['on_break']:
                attendance.action_end_break()
                return {'success': True, 'on_break': False, 'action': 'break_ended'}
            else:
                attendance.action_start_break()
                return {'success': True, 'on_break': True, 'action': 'break_started'}

        except Exception as e:
            _logger.error('toggle_break ERROR: %s', str(e), exc_info=True)
            return {'success': False, 'error': str(e)}