## Markdown CKEditor for Django Collab Wiki

## DIRTY THINGS
this includes a copy of markdown_ckeditor, instead of loading it during installation or something similar

## Installation

Register 'wiki_ckeditor' before 'wiki', as this app overrides one template of django-wiki:

INSTALLED_APPS = [
	...
    'wiki_ckeditor',
    'wiki',
	...

]


Change default editor in your settings.py:

WIKI_EDITOR = 'wiki_ckeditor.ckeditor.CKEditor'

That's it.

