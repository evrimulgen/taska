'use strict';
import {RouteHandler, Link, Router} from 'react-router';
import React from 'react/addons';
import Reflux from 'reflux';
import Griddle from 'griddle-react';

import {Authentication} from '../../mixins/component.jsx';
import {TableComponentMixin} from '../../mixins/component.jsx';

import RequestByProcessActions from '../../actions/RequestByProcessActions.jsx';
import RequestByProcessStore from '../../stores/RequestByProcessStore.jsx';
import UserStore from '../../stores/UserStore.jsx';

import {Loading} from '../reusable/component.jsx'
import {RequestDate, RequestProcess, RequestUser, RequestLink, RequestStatus} from './reusable/request.jsx'

export default React.createClass({
    displayName: "My Studies",
    mixins: [Authentication],
    render: function () {
        return <LoggedInHome />;
    }
});

const LoggedInHome = React.createClass({
    __getState(){
        return {
            user: UserStore.getUser()
        }
    },
    contextTypes: {
        router: React.PropTypes.func.isRequired
    },
    getInitialState(){
        return this.__getState();
    },
    render: function () {
        let params = this.context.router.getCurrentParams();
        return (<span>
                      <div className="row flex-container">
                          <div className="col-md-6 flex-container flex-row">
                              <RequestTable hash={params.object} />
                          </div>
                      </div>
                  </span>);
    }
});

const RequestTable = React.createClass({
    tableAction: RequestByProcessActions.load,
    tableStore: RequestByProcessStore,
    mixins: [Reflux.listenTo(RequestByProcessStore, 'update'), TableComponentMixin],
    getInitialState: function () {
        return {};
    },
    update: function (data) {
        this.setState(this.getState());
    },
    render: function () {
        const columnMeta = [
            {
                "columnName": "title",
                "order": 1,
                "locked": true,
                "visible": true,
                "customComponent": RequestLink,
                "displayName": "Title"
            },
            {
                "columnName": "processtaskuser",
                "order": 2,
                "locked": true,
                "visible": true,
                "customComponent": RequestUser,
                "displayName": "User"
            },
            {
                "columnName": "process",
                "order": 3,
                "locked": true,
                "visible": true,
                "customComponent": RequestProcess,
                "displayName": "Study"
            },
            {
                "columnName": "date",
                "order": 4,
                "locked": true,
                "visible": true,
                "displayName": "Date",
                "customComponent": RequestDate
            },
            {
                "columnName": "type",
                "order": 5,
                "locked": true,
                "visible": true,
                "customComponent": RequestStatus,
                "cssClassName": "request-td",
                "displayName": "Type"
            }
        ];
        return <div className="panel panel-default panel-overflow  griddle-pad">
                    <div className="panel-heading">
                        <i className="fa fa-life-ring pull-left"></i>
                        <h3 className="text-center panel-title">Received Requests</h3>
                      </div>
                    <Griddle
                        noDataMessage={<center>You have no requests made by assignees.</center>}
                        {...this.commonTableSettings(false)}
                        columns={["title", "process", "processtaskuser",  "date","type"]}
                        columnMetadata={columnMeta}/>
                </div>;
    }

});