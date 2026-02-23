{
    'name': 'HR Attendance Break with Popup',
    'version': '17.0.1.0.0',
    'category': 'Human Resources/Attendances',
    'summary': 'Check-in/out popup + Break button in systray',
    'depends': ['hr_attendance'],
    'author': 'abin',
    'data': [
        'security/ir.model.access.csv',
        'views/hr_attendance_break_views.xml',
    ],

    'assets': {
        'web.assets_backend': [
            # CSS first
            'hr_attendance_break/static/src/css/attendance_break.css',
            # XML templates before JS components
            'hr_attendance_break/static/src/xml/attendance_popup.xml',
            'hr_attendance_break/static/src/xml/break_systray.xml',
            # JS last
            'hr_attendance_break/static/src/js/attendance_popup.js',
            'hr_attendance_break/static/src/js/break_systray.js',
            'hr_attendance_break/static/src/js/attendance_timer_patch.js',
        ],
    },
    'installable': True,
    'application': False,
    'license': 'LGPL-3',
}