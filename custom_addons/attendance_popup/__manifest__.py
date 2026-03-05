{
    'name': 'HR Attendance Check In/Out Popup',
    'version': '17.0.1.0.0',
    'category': 'Human Resources/Attendances',
    'summary': 'Custom Check-in / Check-out popup in systray',
    'depends': ['hr_attendance', 'web'],
    'author': 'abin',
    'assets': {
        'web.assets_backend': [
            'attendance_popup/static/src/css/popup.css',
            'attendance_popup/static/src/js/attendance_popup.js',
        ],
    },
    'installable': True,
    'application': False,
    'license': 'LGPL-3',
}