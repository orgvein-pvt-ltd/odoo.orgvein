from odoo import models, fields

class HrApplicant(models.Model):
    _inherit = 'hr.applicant'

    current_salary = fields.Float(string='Current Salary')

    expected_joining_date = fields.Date(
        string="Expected Date of Joining"
    )

    total_experience = fields.Float(
        string="Total Experience (Years)",
        help="Total years of professional experience"
    )