from django.db import models

from workflow.models import Workflow

from model_utils.managers import InheritanceManager

class Task(models.Model):
    '''Represents generically a task, executed in relation to an Workflow instance.

    Each workflow instance consists of one or more Tasks.

    Note:
        This model is meant to be generic and abstract, and must be used through a concrete implementation of a task (for example SimpleTask), not directly.

    Attributes:
        :id (int): Private sequential identificator
        :sortid (int): Integer value that describes the order (inside the workflow) that this task is to be executed in
        :title (str): Short title that describes the task
        :description (str): Description of the task at hand, and how it should be executed
        :workflow (Workflow): :class:`workflow.models.Workflow` instance this task is inserted into
    '''
    sortid          = models.IntegerField()
    title           = models.CharField(max_length=100)
    description     = models.TextField()
    workflow        = models.ForeignKey(Workflow)

    # We need this to be able to properly guess the type
    objects         = InheritanceManager()

    def type(self):
        return self._meta.app_label + '.' +self.__class__.__name__

    def __str__(self):
        ''' Represents the task at hand, usually just shows the title (or Unnamed if there's no title for the task).
        '''
        if self.title:
            return self.title

        return 'Unnamed'

    def replaceDependencies(self, dependencies):
        '''
        '''
        all_deps = TaskDependency.objects.filter(maintask=self)

        removed_deps = all_deps.exclude(dependency__in=dependencies)

        removed_deps.delete()

        for dep in dependencies:
            TaskDependency.objects.get_or_create(maintask=self, dependency=dep)


    @staticmethod
    def getPossibleDependencies(workflow, task=None):
        ''' Gives the possible dependencies for a Task, given a workflow.

        Optionally is possible the define the point of origin, to be excluded from the results, using `task`

        Args:
            :workflow (Workflow): :class:`workflow.models.Workflow` instance to get dependencies possible from.
        Kwargs:
            :task (Task, optional) :class:`Task` instance indicating point of origin (will be excluded from results)

        Returns
            QuerySet of Tasks that can be used as dependencies
        '''
        possibilities = Task.objects.filter(workflow=workflow)

        if task != None:
            possibilities=possibilities.exclude(id=task.id)

        return possibilities

    @staticmethod
    def init_serializer():
        from .api import TaskSerializer
        return TaskSerializer()

    def __get_serializer(self):
        serializer_name = '__%s'%(self.type())
        serializer = None
        if hasattr(Task, serializer_name):
            serializer = getattr(Task, serializer_name)
        else:
            serializer = Task.init_serializer()
            setattr(Task, serializer_name, serializer)

        return serializer

    def to_representation(self, instance):
        serializer = self.__get_serializer()

        return serializer.to_representation(instance)

    def to_internal_value(self, instance):
        serializer = self.__get_serializer()

        return serializer.to_internal_value(instance)

    def dependencies(self):
        return TaskDependency.objects.filter(maintask=self)




class TaskDependency(models.Model):
    '''Represents a dependency a Task instance may have over other tasks.

    Each task can require other tasks to be executed first. This model represents this dependencies, if they exist.

    Attributes:
        :id (int): Private sequential identificator
        :maintask (Task): :class:`Task` instance this dependency refers to
        :dependency (Task): :class:`Task` instance the maintask depends upon to be executed
    '''
    maintask        = models.ForeignKey(Task, related_name='maintask')
    dependency      = models.ForeignKey(Task, related_name='dependency')

    class Meta:
        verbose_name_plural = "Task dependencies"

    def __str__(self):
        '''
        '''
        return "TaskDependency: {maintask: %s | dependency %s }" % (str(self.maintask), str(self.dependency))

class SimpleTask(Task):
    '''Basic concretization of a generic task.

    This is a basic implementation of the generic task model, and has no extra behaviour beyond the one provided by the generic model.
    Is meant to be used for simple check tasks, that are executed outside of the system and can not be ascertained through it.

    '''
    @staticmethod
    def init_serializer():
        ''' This method must override default init_serializer behaviour for a task.

        Without init_serializer() wouldnt be possible using to process the MTI.
        '''
        from .api import SimpleTaskSerializer
        return SimpleTaskSerializer()
    pass
