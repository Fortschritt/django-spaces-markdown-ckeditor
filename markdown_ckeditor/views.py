# -*- coding: utf-8 -*-
import json
from itertools import chain
from django.db.models import Q
from django.forms.fields import CharField
from django.http import JsonResponse
from django.shortcuts import render
from django.views.generic.list import ListView
from spaces_files.models import Folder
from collab.mixins import SpacesMixin
from wiki.models.article import Article


# Create your views here.
class AjaxPathSearch(SpacesMixin, ListView):
    """
        Return a JSON-formatted list of URIs whose page titles contain the
        given search string.
    """
    model = Article

    def dispatch(self, *args, **kwargs):
        keyword = CharField(required=False).clean(kwargs['keyword'])
        self.keyword = keyword
        return super(AjaxPathSearch, self).dispatch(*args, **kwargs)

    def render_to_json_response(self, context, **kwargs):
        """
        Returns a JSON response, transforming 'context' to make the payload.
        """
        return JsonResponse(
            {'pages':context['pages']},
            **kwargs
        )

    def render_to_response(self, context, **kwargs):
        return self.render_to_json_response(context, **kwargs)

    def get_queryset(self):
        # Wiki articles
        qs = self.model.objects.filter(
            wikiarticle__wiki__space=self.request.SPACE,
            current_revision__title__icontains=self.keyword
        )
        # Folders
        qs2 = Folder.objects.filter(
            file_manager__space=self.request.SPACE,
            name__icontains=self.keyword
        )
        qs = list(chain(qs, qs2))
        qs = qs[:10] 
        return qs

    def get_context_data(self, **kwargs):
        context = super(AjaxPathSearch, self).get_context_data( **kwargs)
        path_dictlist = [{  'title':obj.current_revision.title if hasattr(obj, 'current_revision') else obj.name, 
                            'link':obj.get_absolute_url(), 
#                            'pk':obj.pk
                        } for obj in self.get_queryset()]
        context['pages'] = json.dumps(path_dictlist)
        return context
