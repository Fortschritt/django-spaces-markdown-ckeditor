# -*- coding: utf-8
from __future__ import unicode_literals
from __future__ import absolute_import
from django import forms
from django.core.urlresolvers import reverse_lazy

# Due to deprecation of django.forms.util in Django 1.9
try:
    from django.forms.utils import flatatt
except ImportError:
    from django.forms.util import flatatt

# Historical name of force_text(). Only available under Python 2.
try:
    from django.utils.encoding import force_unicode
except ImportError:
    def force_unicode(x):
        return(x)

from django.utils.html import conditional_escape
from django.utils.safestring import mark_safe

from wiki.editors.base import BaseEditor


class CKEditorWidget(forms.Widget):

    class Media:
        css = {
            'all': ()
        }
        js = ("markdown_ckeditor/ckeditor/ckeditor.js",
              "collab_links/js/collab_links.js",
             )

    def __init__(self, attrs=None):
        # The 'rows' and 'cols' attributes are required for HTML correctness.
        default_attrs = {'class': 'CKEditor',
                         'rows': '10', 
                         'cols': '40', 
                         'data-search-url': reverse_lazy('markdown_ckeditor:search', args=['_',]),
        }
        if attrs:
            default_attrs.update(attrs)
        super(CKEditorWidget, self).__init__(default_attrs)

    def render(self, name, value, attrs=None):
        if value is None:
            value = ''
        final_attrs = self.build_attrs(attrs, name=name)
        return mark_safe(
            '<div><textarea%s>%s</textarea></div>' %
            (flatatt(final_attrs),
             conditional_escape(
                force_unicode(value))))


class CKEditor(BaseEditor):
    editor_id = 'ckeditor'

    def get_admin_widget(self, instance=None):
        return CKEditorWidget()

    def get_widget(self, instance=None):
        return CKEditorWidget()

    class Media:
        css = {
            'all': ()
        }
        js = (  "markdown_ckeditor/ckeditor/ckeditor.js",
                "spaces_wiki/js/wiki_ckeditor.js",
             )

