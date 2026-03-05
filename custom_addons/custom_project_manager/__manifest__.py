{
    'name': 'Custom Project Manager Role',
    'version': '1.0',
    'summary': 'Adds a Project Manager role with restricted project visibility',
    'depends': ['project', 'base'],
    'data': [
        'security/project_manager_security.xml',
        'security/ir.model.access.csv',
    ],
    'installable': True,
    'application': False,
}