'use strict';
import Reflux from 'reflux';
import React from 'react';
import {RouteHandler, Link} from 'react-router';

import WaitingTaskActions from '../../actions/WaitingTaskActions.jsx';
import WaitingTaskStore from '../../stores/WaitingTaskStore.jsx';

import Griddle from 'griddle-react';

import {Loading, DeleteButton} from './component.jsx'
import {TableComponentMixin} from '../../mixins/component.jsx';

import ProcessActions from '../../actions/ProcessActions.jsx';

import moment from 'moment';

const TaskDateEst = React.createClass({

  renderMessage(deadline){
    const now = moment()
    const due = moment(deadline)

    if(due.isBefore(now))
      return <small className="pull-right text-danger">
    <span className="warnicon">Waiting dep. </span>
    <i title="You had accepted to complete this task, but the products you need to use for your task have not been completed yet. We are sorry for this. We are trying to solve this and will let you know as soon as you can start working on this task" className="task-overdue fa fa-2x fa-clock-o"></i>
    </small>;

    const diff = moment.duration(now.diff(due)).asDays();

    if(diff < 7)
      return <small className="pull-right task-warning"><span className="warnicon">{moment(deadline).fromNow()}</span> <i className="fa fa-2x fa-exclamation-triangle"></i></small>;

    return <small className="pull-right">{moment(deadline).fromNow()}</small>;
  },
  render(){
    const row = this.props.rowData;

    return this.renderMessage(row['start_date'])
  }
});

const TaskDate = React.createClass({

  renderMessage(deadline){
    const now = moment()
    const due = moment(deadline)

    if(due.isBefore(now))
      return <small className="pull-right text-danger">
    <span className="warnicon">Waiting dep. </span>
    <i title="You had accepted to complete this task, but the products you need to use for your task have not been completed yet. We are sorry for this. We are trying to solve this and will let you know as soon as you can start working on this task" className="task-overdue fa fa-2x fa-clock-o"></i>
    </small>;

    const diff = moment.duration(now.diff(due)).asDays();

    if(diff < 7)
      return <small className="pull-right task-warning"><span className="warnicon">{moment(deadline).fromNow()}</span> <i className="fa fa-2x fa-exclamation-triangle"></i></small>;

    return <small className="pull-right">{moment(deadline).fromNow()}</small>;
  },
  render(){
    const row = this.props.rowData;

    return this.renderMessage(row.deadline)
  }
});

const TaskLink = React.createClass({
  render: function(){
    const row = this.props.rowData;
    const object = {object: row.hash}
    return <small title={row.process}>
            <Link id={`task_${row.hash}`}
              key={row.hash} to={this.props.rowData.type}
               params={object}>{this.props.rowData.task_repr}</Link><br />

           </small>;
  }
});

const TaskType = React.createClass({
  getIcon(type){
    switch(type){
      case 'tasks.SimpleTask':
        return 'fa-cube';
      case 'form.FormTask':
        return 'fa-list-ul';
    }

    return 'fa-times-circle-o';
  },
  render: function(){
    const row = this.props.rowData.processtask;
    return <span><i className={`fa fa-2x ${this.getIcon(row.type)}`}></i></span>;
  }
});

const TaskAvailability = React.createClass({
  accept(){
    WaitingTaskActions.accept(this.props.rowData.hash);
  },
  reject(){
    WaitingTaskActions.reject(this.props.rowData.hash);
  },
  render: function(){
    return (<div className="btn-group" role="group" >
              <button onClick={this.accept} className="btn btn-success">Accept</button>
              <button onClick={this.reject} className="btn btn-danger">Reject</button>
            </div>);
  }
});

const TaskComment = React.createClass({
  render: function(){
    const row = this.props.rowData;
    const object = {object: row.hash}
    return <small title={row.process}>
            <Link id={`task_${row.hash}`}
              key={row.hash} to={this.props.rowData.type}
               params={object}>{this.props.rowData.task_repr}</Link><br />

           </small>;
  }
});


const WaitingTaskTable = React.createClass({
    tableAction: WaitingTaskActions.load,
    tableStore: WaitingTaskStore,
    mixins: [Reflux.listenTo(WaitingTaskStore, 'update'), TableComponentMixin],
    getInitialState: function() {
        return {
        };
    },
    update: function(data){
        this.setState(this.getState());
      console.log("set state");
    },
  render: function () {

    const columnMeta = [
      {
      "columnName": "type",
      "order": 1,
      "locked": false,
      "visible": true,
      "customComponent": TaskType,
      "displayName": "Type",
      "cssClassName": 'type-td',
      },
      {
      "columnName": "task_repr",
      "order": 2,
      "locked": false,
      "visible": true,
      "customComponent": TaskLink,
      "displayName": "Title"
      },
      {
      "columnName": "process_repr",
      "order": 3,
      "locked": false,
      "visible": true,
      "displayName": "Process"
      },
      {
      "columnName": "start_date",
      "order": 4,
      "locked": true,
      "visible": true,
      "cssClassName": 'start-td',
      "customComponent": TaskDateEst,
      "displayName": "Est. Start"
      },
      {
      "columnName": "deadline",
      "order": 5,
      "locked": true,
      "visible": true,
      "cssClassName": 'deadline-td',
      "customComponent": TaskDate,
      "displayName": "Deadline"
      },
      {
      "columnName": "availability",
      "order": 6,
      "locked": true,
      "visible": true,
      "cssClassName": 'availability-td',
      "customComponent": TaskAvailability,
      "displayName": "Availability"
      }
      /*{
      "columnName": "comments",
      "order": 7,
      "locked": true,
      "visible": true,
      "cssClassName": 'comments-td',
      "customComponent": TaskComment,
      "displayName": "Comment"
      }*/
    ];
    return <Griddle
                      noDataMessage={<center>You currently have no completed tasks yet. This tasks are all the tasks that you have completed.</center>}
                      {...this.commonTableSettings()}
                      columns={["type", "task_repr", "process_repr", "start_date", "deadline", "availability"]}
                      columnMetadata={columnMeta} />
  }

});

export default {WaitingTaskTable}
