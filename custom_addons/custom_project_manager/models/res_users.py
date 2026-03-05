from odoo import models, fields

class ResUsers(models.Model):
    _inherit = 'res.users'

    is_project_manager = fields.Boolean(
        string='Is Project Manager',
        default=False,
        help="If enabled, this user can create projects and only see their own projects."
    )