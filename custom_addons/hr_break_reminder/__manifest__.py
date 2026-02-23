{
    'name': 'HR Break Reminder',
    'version': '17.0.1.0.0',
    'summary': 'Popup reminder every 2 hours after attendance check-in',
    'category': 'Human Resources',
    'author': 'Custom',
    'license': 'LGPL-3',
    'depends': ['hr_attendance', 'web'],
    'assets': {
        'web.assets_backend': [
            'hr_break_reminder/static/src/js/break_reminder.js',
        ],
    },
    'installable': True,
    'application': False,
}
