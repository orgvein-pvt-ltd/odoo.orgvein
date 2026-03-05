from odoo import models, fields, api
from odoo.exceptions import ValidationError, UserError
import re


class HrEmployee(models.Model):
    _inherit = 'hr.employee'

    employee_custom_id = fields.Char(
        string="Employee ID",
        copy=False,
        index=True,
        tracking=True
    )

    # 🔒 SQL Unique Constraint
    _sql_constraints = [
        (
            'unique_employee_custom_id',
            'unique(employee_custom_id)',
            'Employee ID must be unique!'
        )
    ]

    # ✅ Format + Sequential Validation
    @api.constrains('employee_custom_id')  # ✅ Fixed typo (was 'employee_custom]_id')
    def _check_employee_id(self):
        pattern = r'^OV\d{3}$'  # ✅ Fixed: OV + 3 digits

        for record in self:
            if not record.employee_custom_id:
                continue

            # 1️⃣ Format Validation
            if not re.match(pattern, record.employee_custom_id):
                raise ValidationError(
                    "Employee ID must be in format OV001 (OV + 3 digits)."
                )

            # 2️⃣ Get Highest Numeric Part
            self.env.cr.execute("""
                SELECT MAX(CAST(SUBSTRING(employee_custom_id FROM 3) AS INTEGER))
                FROM hr_employee
                WHERE employee_custom_id LIKE 'OV%%'
                AND id != %s
            """, (record.id,))  # ✅ Fixed: was 'AB%%'

            last_number = self.env.cr.fetchone()[0]
            expected_number = (last_number or 0) + 1
            expected_code = f"OV{str(expected_number).zfill(3)}"  # ✅ Fixed: OV + zfill(3)

            # 3️⃣ Sequential Validation
            if record.employee_custom_id != expected_code:
                raise ValidationError(
                    f"Next Employee ID should be {expected_code}."
                )

    # 🔐 Backend Protection
    def write(self, vals):
        if 'employee_custom_id' in vals:
            if not self.env.user.has_group('hr.group_hr_user'):
                raise UserError(
                    "Only HR users can edit Employee ID."
                )
        return super().write(vals)


class HrEmployeePublic(models.Model):
    _inherit = 'hr.employee.public'

    employee_custom_id = fields.Char(
        string="Employee ID",
        related='employee_id.employee_custom_id',
        readonly=True
    )