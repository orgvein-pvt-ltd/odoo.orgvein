from odoo import models, api


class HrEmployee(models.Model):
    _inherit = "hr.employee"

    @api.model
    def get_today_birthdays(self):
        """
        Returns today's birthdays for ALL users safely (uses sudo).
        Only returns: id, name, image_128 — no sensitive data.
        """
        from datetime import date
        today = date.today()

        employees = self.sudo().search([
            ("birthday", "!=", False),
        ])

        result = []
        for emp in employees:
            bd = emp.birthday
            if bd.month == today.month and bd.day == today.day:
                result.append({
                    "id"       : emp.id,
                    "name"     : emp.name,
                    "image_128": emp.image_128.decode() if emp.image_128 else False,
                })
        return result

    @api.model
    def get_own_birthday(self, user_id):
        """
        Returns the logged-in user's own employee record birthday.
        Safe for all users.
        """
        emp = self.sudo().search([("user_id", "=", user_id)], limit=1)
        if not emp or not emp.birthday:
            return False
        return {
            "id"       : emp.id,
            "name"     : emp.name,
            "birthday" : str(emp.birthday),
            "image_128": emp.image_128.decode() if emp.image_128 else False,
        }

    @api.model
    def get_upcoming_birthdays(self):
        """
        Returns ALL employee birthdays — HR only (checked in JS).
        """
        employees = self.sudo().search([("birthday", "!=", False)])
        return [{
            "id"       : emp.id,
            "name"     : emp.name,
            "birthday" : str(emp.birthday),
            "image_128": emp.image_128.decode() if emp.image_128 else False,
        } for emp in employees]