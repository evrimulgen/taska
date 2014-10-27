# coding=utf-8
from rest_framework import renderers, serializers, viewsets, permissions, mixins
from rest_framework.decorators import api_view, detail_route, list_route
from rest_framework.response import Response
from rest_framework.reverse import reverse

from django.contrib.auth.models import User
from oauth2_provider.ext.rest_framework import TokenHasReadWriteScope, TokenHasScope

from process.models import Process

@api_view(('GET',))
def root(request, format=None):
    return Response({
        #'User Listing   ': reverse('user-list', request=request, format=format),
    })

# Serializers define the API representation.
class ProcessSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Process
        permission_classes = [permissions.IsAuthenticated, TokenHasScope]

# ViewSets define the view behavior.
class ProcessViewSet(  mixins.CreateModelMixin,
                        mixins.ListModelMixin,
                        mixins.RetrieveModelMixin,
                        mixins.DestroyModelMixin,
                        viewsets.GenericViewSet):
    """
    API for Process manipulation

        Note: All methods on this class pertain to user owned processes
    """
    queryset = Process.objects.all()
    serializer_class = ProcessSerializer
    def list(self, request, *args, **kwargs):
        """
        Return a list of user-owned processes

        TODO: Implement

        """
        return Response({})

    def create(self, request, *args, **kwargs):
        """
        Insert/Update a new process

        TODO: Implement

        """
        return Response({})

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a process, by id

        TODO: Implement
        """
        return Response({})

    def destroy(self, request, *args, **kwargs):
        """
        Delete a process, by id

        TODO: Implement
        """
        return Response({})

    @list_route(methods=['get'])
    def requests(self, request):
        """
        Show user-attributed requests, related with owned processes
        Request can be of several types, such as Clarification, or reassignment

        TODO: Implement
        """
        return Response({})
