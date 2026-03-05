{
    'name': 'Employee Birthday Notifications',
    'version': '17.0.1.0.0',
    'category': 'Extra Tools',
    'summary': 'Notifications for upcoming employee birthdays',
    'description': 'Displays notifications for upcoming employee birthdays in systray.',
    'author': 'Abin sanal',
    'depends': ['base', 'hr'],
    'data': [],
    'assets': {
        'web.assets_backend': [
            'sdm_birthday_notification/static/src/xml/systray_dropdown.xml',
            'sdm_birthday_notification/static/src/js/dropdown_systray.js',
            'sdm_birthday_notification/static/src/css/style.css',
        ],
    },
    'installable': True,
    'auto_install': False,
    'application': False,
}