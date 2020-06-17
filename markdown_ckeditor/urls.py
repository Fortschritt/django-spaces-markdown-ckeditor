# -*- coding: utf-8 -*-
from django.conf.urls import url
from spaces.urls import space_patterns
from .views import AjaxPathSearch

app_name = 'markdown_ckeditor'
urlpatterns = (
    url(r'^markdown_ckeditor/search/(?P<keyword>[_\-\wäöüÄÖÜß]+)/$',
        AjaxPathSearch.as_view(), name='search'),
)
