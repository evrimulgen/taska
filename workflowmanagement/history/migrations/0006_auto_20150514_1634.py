# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('history', '0005_history_authorized'),
    ]

    operations = [
        migrations.AlterField(
            model_name='history',
            name='event',
            field=models.PositiveSmallIntegerField(default=1, choices=[(1, b'Add'), (2, b'Edit'), (3, b'Delete'), (4, b'Access'), (5, b'Cancel'), (6, b'Done')]),
        ),
    ]
