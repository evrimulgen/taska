import Reflux from 'reflux';
import React from 'react';
import {Link} from 'react-router';

import {SimpleState} from '../../../react-statemachine/classes.jsx';

import Select from 'react-select';

import StateActions from '../../../actions/StateActions.jsx';

import UserActions from '../../../actions/UserActions.jsx';

import ProcessActions from '../../../actions/ProcessActions.jsx';

import UserStore from '../../../stores/UserStore.jsx';

import {ReassigningButton, LinkToCancelAssignees, CancelAssigneesButton} from '../component.jsx';

import moment from 'moment';

import checksum from 'json-checksum';

import Uploader from '../uploader.jsx';

import {stateColor, singleStateColor} from '../../../map.jsx';

import DateTimePicker from 'react-widgets/lib/DateTimePicker';

import Toggle from 'react-toggle';

const dummy = React.createClass({render(){return <span></span>; }});



class SimpleTask extends SimpleState {
    constructor(options){
        super(options);
    }
    static typeIcon(){
        return <i className="fa fa-cube"></i>;
    }
    static repr(){
        return 'Simple Task';
    }
    static title(){
        return "Do you know what is a simple tasks? It is a task that have inputs and outputs files, descriptions and comments.";
    }

    detailRender(editable=true, ChildComponent=dummy){
        let self = this;
        const SimpleFields = React.createClass({
            getState(){
                return {
                    parent: this.props.main
                };
            },
            getInitialState(){
                return this.getState();
            },
            setDescription(e){
                console.log('SET DESCR');
                this.state.parent.setState({description: e.target.value});
                this.props.dataChange(self.getIdentificator(), {description: e.target.value}, false);
            },
            setEffort(e){
                console.log('SET EFFORT');
                this.state.parent.setState({effort: Number.parseFloat(e.target.value)});
                this.props.dataChange(self.getIdentificator(), {effort: Number.parseFloat(e.target.value)}, false);
            },
            setOutputResource(e){
                console.log(e.target.checked);
                this.state.parent.setState({'output_resources': e.target.checked});
                this.props.dataChange(self.getIdentificator(), {'output_resources': e.target.checked}, false);
            },
            setResources(related_resources){
                this.state.parent.setState({resources: related_resources});
                this.props.dataChange(self.getIdentificator(), {resources: related_resources}, false);
            },
            parent(){
                return this.state.parent.state;
            },


            __createMap(own){
                if(own){
                    let linkmap = {};

                    for(let link of own){
                        linkmap[link.filename] = 'api/resource/'+link.hash+'/download/';
                    }

                    return linkmap;
                }

                return {};

            },
            digestDescription(desc, map){
                if(desc){

                    let result = desc.replace(/#\((.*?)\)/g, function(a, b){
                        let hit = map[b];

                        if(hit)
                            return '<a target="_blank" href="'+map[b]+'">' + b + '</a>';
                        else
                            return b;

                    });

                    result = result.replace(/((http[s]?:\/\/[\w.\/_\-=?]+)|(mailto:[\w.\/@_\-=?]+))/g, function(a, b){
                        return '<a target="_blank" href="'+b+'">' + b + '</a>';

                    });

                    return result;
                }
                return undefined;
            },

            render(){

                let depmap = this.__createMap(this.parent().resources);

                let description = this.digestDescription(this.parent().description, depmap) || '';
                let getDesc = () => { return {__html: description} };

                return <span>
                    <div key="state-descr" className="form-group">
                        <label for="state-description">Task Description</label>
                            {editable ?
                            <textarea style={{resize: "vertical"}} id="state-description" rows="6" type="description" className="form-control"
                                            aria-describedby="state-description"
                                            placeholder="Enter the state description here"  disabled={!editable}
                                            onChange={this.setDescription} value={this.parent().description}>
                            </textarea>
                            :
                            <div style={{height: 'auto', minHeight:'80px', backgroundColor: '#ecf0f1', 'word-break': 'break-word'}} id="state-description" rows="6" className="form-control"
                                            aria-describedby="state-description">
                                <span dangerouslySetInnerHTML={getDesc()} />
                            </div>
                        }
                    </div>

                    <div key="state-effort" className="form-group">
                        <label for="state-effort">Required Effort (in hours)</label>
                            <input type="number" min="0" id="state-effort" className="form-control"
                                            aria-describedby="state-effort" disabled={!editable}
                                            onChange={this.setEffort} value={(this.parent().effort)?this.parent().effort:1} />
                    </div>

                    <span>
                            <label title="Choose if the answers for all tasks, when running inside a study context, should be passed down to this tasks dependants.">Forward Answers</label>
                            <div className="form-group">
                            <Toggle id="output_resources"
                                    defaultChecked={this.parent()['output_resources']}
                                    onChange={this.setOutputResource} disabled={!editable} />
                            </div>
                    </span>
                    <ChildComponent dataChange={this.props.dataChange} main={this.props.main} />


                        <span>
                        {(this.parent().resources && this.parent().resources.length > 0 || editable)?
                            <label>Attachments</label>
                        :''}
                        <Uploader editable={editable} uploads={this.parent().resources} done={this.setResources} />
                        </span>
                </span>
            }
        });

        return super.detailRender(editable, SimpleFields);
    }

    static deserializeOptions(data){

        if(data.title === undefined)
            throw `data object is missing 'title' property`;

        if(data.description === undefined)
            throw `data object is missing 'description' property`;

        // We only generically consider file resources
        // Other files should be considered by each child class when
        // deserializing/serializing as we have no idea how to interpret the resource
        let resources = [];
        for(let resource of data.resources){
            if(resource.type === 'material.File')
                resources.push({
                    hash: resource.hash,
                    filename: resource.filename,
                    size: resource.size,
                    status: 'Finished',
                    progress: 100,
                    manage: ''
                });
        }
        return {
            name: data.title,
            description: data.description,
            effort: data.effort,
            hash: data.hash,
            type: data.type,
            resources: resources,
            'output_resources': data['output_resources']
        };
    }

    serialize(){
        let deps = [];
        for(let dep of this.getDependencies()){
            deps.push({
                dependency: dep.getIdentificator()
            });
        }
        let resources = [];
        let full = this.getData().resources || [];

        for(let resource of full){
            resources.push(resource.hash);
        }

        return {
            sid: this.__identificator,
            hash: this.getData().hash,
            title: this.getData().name,
            type: this.getData().type,
            sortid: this.getLevel(),
            description: this.getData().description || '',
            effort: this.getData().effort || 1,
            dependencies: deps,
            resourceswrite: resources,
            'output_resources': this.getData()['output_resources']
        }
    }
}

class SimpleTaskRun extends SimpleTask{
    constructor(options){
        super(options);
    }
    is_valid(){
        let data = this.getData();

        return (
            data.deadline
            && data.assignee
            && data.assignee.split(',').length > 0
        );

    }

    status(){
        if(this.is_valid()){
            return 'state-filled';
        }

        return '';
    }

    serialize(){
        let users = [];
        let assignee = this.getData().assignee || '';

        for(let user of assignee.split(','))
            if(user.length > 0)
                users.push({user: Number.parseInt(user)});

        return {
            users: users,
            deadline: this.getData().deadline,
            name: this.getData().name,
            task: this.getData().hash
        }
    }
    stateStyle(user){
        if (this.getData().ptask)
        //This condition is because the state 7 and 8 is influenced by the state of ProcessTaskUser
            if (this.getData().ptask.status != 7 && this.getData().ptask.status != 8)
                return stateColor(this.getData().ptask);
            else if (user != undefined)
                return singleStateColor(user.status);
            else
                return stateColor(this.getData().ptask); //This line is because there are new status (7 and 8, maybe more in the future), so to fill the statemachine i need this condition
        return {};
    }
    stateDesc(){
        if(this.getData().ptask)
            switch(this.getData().ptask.status){
                case 1:
                    return 'Waiting';
                case 2:
                    let end = moment(this.getData().ptask.deadline);
                    let now = moment();

                    if(now.isBefore(end)){
                        return 'Running';
                    } else {
                        return 'Overdue';
                    }
                case 3:
                    return 'Finished';
                case 4:
                    return 'Canceled';
                case 5:
                    return 'Overdue';
                case 7:
                    return 'Waiting for answer';
                case 8:
                    return "Rejected";
                default:
                    console.log("Task status: ");
                    console.log(this.getData().ptask.status);
            }


        return 'Waiting';
    }

    detailRender(editable=true, ChildComponent=dummy){
        let self = this;
        const SimpleRun = React.createClass({
            getState(){
                let alreadyusers;
                try
                {
                    alreadyusers = this.props.main.state.assignee.split(',');
                }
                catch(err)
                {
                    alreadyusers = [];
                }

                return {
                    parent: this.props.main,
                    users: [],
                    new_assignee: undefined,
                    new_reassigning: undefined,
                    oldUser: undefined,
                    showReassign: false,
                    alreadyusers : alreadyusers,
                    tempAlreadyUsers: []
                };
            },
            getInitialState(){
                return this.getState();
            },
            parent(){
                return this.state.parent.state;
            },
            setAssignee(val){
                let data = {assignee: val};

                this.state.parent.setState(data);
                this.props.dataChange(self.getIdentificator(), data, true);
            },
            setDeadline(e){
                let data = {deadline: moment(e).format('YYYY-MM-DDTHH:mm')};

                this.state.parent.setState(data);
                this.props.dataChange(self.getIdentificator(), data, true);
            },
            verifyIfAllUsersCancel(){
                var count = 0;
                let users = this.state.parent.state.ptask.users;

                for(var index = 0; index < users.length; index++ )
                    //If reassinged == false, count
                    if(!users[index].reassigned)
                        count++;

                //If the countage == 1, means that it is the last user
                if(count == 1)
                    return true;
                return false;
            },
            cancelUser(assignee, cancelUser, cancelTask){
                let action = this.state.parent.props.cancelUser;
                if(action){
                    action(self.getData().ptask.hash,
                            assignee,
                            cancelUser,
                            cancelTask);
                }
            },
            cancelTask(){
                let action = this.state.parent.props.cancelTask;
                if(action){
                    action(self.getData().ptask.hash);
                }
            },
            addNew(e){
                let action = this.state.parent.props.addNew;
                if(action){
                    action(self.getData().ptask.hash, this.state.new_assignee);
                }
            },
            newAssignee(e){
                this.setState({
                    new_assignee: e
                })
            },
            newReassigning(e){
                this.setState({
                    new_reassigning: e
                })
            },
            refineAnswer(e){
                let answer_hash = $(e.target).data('answer');

                let action = this.state.parent.props.refineAnswer;
                if(action){
                    action(answer_hash);
                }
            },
            showReassignSelect(e){
                let alreadyusers = []

                let taskUser = this.state.parent.state.ptask.users;

                //add all in already user except the selected
                for(var index = 0; index < this.state.alreadyusers.length; index++ )
                    if (this.state.alreadyusers[index] != Number.parseInt($(e.target).data('assignee')) )
                        alreadyusers += this.state.alreadyusers[index];

                //Verify if the selected was rejected the task, if no add too
                for(var index = 0; index < taskUser.length; index++ )
                    if(taskUser[index].user == Number.parseInt($(e.target).data('assignee')) && taskUser[index].status != 3)
                        alreadyusers += taskUser[index].user;

                this.setState({
                    showReassign: true,
                    oldUser: Number.parseInt($(e.target).data('assignee')),
                    tempAlreadyUsers: alreadyusers
                });

            },
            reassign(){
                let action = this.state.parent.props.reassignRejectedUser;

                if(action){
                    action(this.parent().ptask.hash, this.state.oldUser, this.state.new_reassigning, false);
                }

                this.setState({
                    showReassign: false
                })
            },
            reassignAll(){
                let action = this.state.parent.props.reassignRejectedUser;

                if(action){
                    action(this.parent().ptask.hash, this.state.oldUser, this.state.new_reassigning, true);
                }

                this.setState({
                    showReassign: false
                })
            },

            results(){
                let me=this;

                let users;
                let status;

                if(!this.parent().assignee)
                    return;

                try{
                    users = this.parent().ptask.users;
                    status = this.parent().status;
                } catch(ex){
                    users = [];
                }

                let desc = self.stateDesc();
                let stillOn = desc === 'Running' || desc === 'Waiting';
                let forAvailability =  desc === 'Waiting for answer' || desc === 'Rejected';
                let onlyShow = true;
                try{
                    onlyShow = !this.state.parent.props.showOnly;
                }
                catch(ex){

                }

                let renderStatus = function(user){
                    if (forAvailability)
                        switch(user.status)
                        {
                            case 1:
                                desc = 'Waiting for answer';
                                break;
                            case 2:
                                desc = 'Accepted';
                                break;
                            case 3:
                                desc = 'Rejected';
                                break;
                        }

                    if(user.finished){
                        return (
                            <span>
                                <span style={{fontSize: '100%'}} className="label label-danger">
                                    Finished on {moment(user.result.date).format('YYYY-MM-DD HH:mm')}
                                </span>
                                {onlyShow ?
                                 <div className="btn btn-group">

                                 <button data-answer={user.hash} onClick={me.refineAnswer} className="btn btn-xs btn-warning">Ask for refinement</button>
                                 <Link className="btn btn-xs btn-info" to={user.result.type}
                                 params={{object: user.result.hash}}>
                                 See result</Link>
                                 </div>:''}
                            </span>
                        );
                    } else if(user.reassigned){
                        return (<span>
                            <span style={{fontSize: '100%'}} className="label label-warning">
                                Canceled on {moment(user.reassigned_date).format('YYYY-MM-DD HH:mm')}
                            </span>&nbsp;&nbsp;&nbsp;
                            {stillOn || forAvailability ?
                            <LinkToCancelAssignees
                                    success={me.cancelUser}
                                    user={user.user}
                                    dataCancel={false}
                                    label={"Uncancel "}
                                    title={"Cancel assignee"}
                                    message={`You canceled all the users assigned to this task. Do you want to cancel this task too?`}/> :''}
                            </span>
                        );
                    } else {
                        return (
                            <span>
                            <span className="label" style={self.stateStyle(user)}>
                                {desc}
                            </span> &nbsp;&nbsp;&nbsp;
                            {onlyShow ? (stillOn || forAvailability ?
                            (forAvailability ?
                            <span>
                                <LinkToCancelAssignees
                                    success={me.cancelUser}
                                    user={user.user}
                                    dataCancel={true}
                                    label={"Cancel "}
                                    title={"Cancel assignee"}
                                    message={`You canceled all the users assigned to this task. Do you want to cancel this task too?`}
                                    verificationFunc={me.verifyIfAllUsersCancel}/>
                                <a data-assignee={user.user} data-cancel="true" onClick={me.showReassignSelect}>Reassigning  </a>
                            </span>:
                                <LinkToCancelAssignees
                                    success={me.cancelUser}
                                    user={user.user}
                                    dataCancel={true}
                                    label={"Cancel "}
                                    title={"Cancel assignee"}
                                    message={`You canceled all the users assigned to this task. Do you want to cancel this task too?`}
                                    verificationFunc={me.verifyIfAllUsersCancel}/>):''):''}
                            </span>
                        );
                    }
                };
                if(users.length > 0){
                    return (<span>
                        <table style={{backgroundColor: 'white'}} className="table table-striped table-bordered">
                            <thead>
                                <tr>
                                    <th colSpan="2">
                                    <label style={{position: 'absolute'}}>Assignees Status</label>

                                    <div className="pull-right btn-group">
                                      <button type="button" className="btn btn-default btn-sm dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                                        <i className="fa fa-download"></i> <small>Download Results</small> <span className="caret"></span>
                                      </button>
                                      <ul className="dropdown-menu" role="menu">
                                        <li><a href={`api/process/processtask/${this.parent().ptask.hash}/export/csv`}>
                                            <i className="fa fa-file-text-o"></i> As CSV</a></li>
                                        <li><a href={`api/process/processtask/${this.parent().ptask.hash}/export/json`}>
                                            <i className="fa fa-file-code-o"></i> As JSON</a></li>
                                        <li><a href={`api/process/processtask/${this.parent().ptask.hash}/export/xlsx`}>
                                            <i className="fa fa-file-excel-o"></i> As XLSX</a></li>
                                        <li><a target="_blank" href={`api/process/processtask/${this.parent().ptask.hash}/export/pdf?as=html`}>
                                            <i className="fa fa-file-code-o"></i> As HTML</a>
                                        </li>
                                        <li><a target="_blank" href={`api/process/processtask/${this.parent().ptask.hash}/export/pdf`}>
                                            <i className="fa fa-file-pdf-o"></i> As PDF</a>
                                        </li>
                                      </ul>

                                    </div>
                                    </th>
                                </tr>
                                <tr>
                                    <th style={{width: '40%'}}>User</th>
                                    <th>Status {onlyShow ?
                                        <CancelAssigneesButton
                                            success={me.cancelTask}
                                            title={"Cancel task"}
                                            message={`Do you want to cancel this task?`}
                                        />:''}
                                    </th>

                                </tr>
                            </thead>
                            <tbody id="userTable">
                                {users.map(
                                    (user, index) => {
                                            return (
                                                <tr key={`ustatus_${index}`}>
                                                    <td><small>{user['user_repr']}</small></td>
                                                    <td><small>{renderStatus(user)}</small></td>
                                                </tr>
                                            );
                                    })
                                }
                            </tbody>
                        </table>
                        {onlyShow ? (stillOn || forAvailability ?<span className="clearfix">
                        <div className="row">

                            <div className="col-md-12">
                                <div className="input-group">
                                        <Select placeholder="Search for assignee" onChange={this.newAssignee}
                                            value={this.state.new_assignee} name="form-field-name"
                                            options={this.state.users.filter(user => (this.state.alreadyusers.indexOf(user.value) === -1))
                                        } />
                                  <span className="input-group-btn">
                                    <button onClick={me.addNew} className="btn btn-success"><i className="fa fa-plus"></i></button>
                                  </span>
                                </div>
                                <br />
                                {this.state.showReassign ?
                                <div className="input-group reassign">
                                        <Select placeholder="Search for users to reassigning" onChange={this.newReassigning}
                                            value={this.state.new_reassigning} name="form-field-name"
                                            options={this.state.users.filter(user => (this.state.tempAlreadyUsers.indexOf(user.value) === -1))
                                        } />
                                  <span className="input-group-btn">
                                    <ReassigningButton
                                      success={me.reassign}
                                      allTasks={me.reassignAll}
                                      identificator = {false}
                                      runLabel= {<span><i className="fa fa-plus"></i></span>}
                                      title={'Reassigning'}
                                      message={'You can reassign only this task or all tasks that this user are envolved!'}  />

                                  </span>
                                </div>:''}
                            </div>
                        </div><br />
                        </span>: ''):''}
                    </span>);
                }

                return false;

            },
            componentWillMount(){
                // For some reason i was getting a refresh loop, when getting the action result from the store...
                // so exceptionally, i decided to do it directly, the result is still cached anyway
                if(this.state.users.length == 0)
                    UserActions.loadSimpleListIfNecessary.triggerPromise().then(
                        (users) => {
                            let map = users.results.map(
                                        entry => {
                                            return {
                                                value: ''+entry.id,
                                                label: entry.fullname
                                            }
                                        }
                            );
                            if(this.isMounted()){
                                this.setState(
                                    {
                                        users: map
                                    }
                                );
                            }
                        }
                );

                if(!this.parent().deadline)
                    this.setDeadline(moment().add(10, 'days').format('YYYY-MM-DDTHH:mm'));
            },
            extendDeadline(event){
                let new_deadline,
                    setNewDeadline = (date) => {
                    new_deadline = moment(date).format('YYYY-MM-DDTHH:mm');
                };

                StateActions.alert({
                    'title': `Change deadline for ${this.parent().name}`,
                    'message': <div style={{}}>
                            <p>Please specify the new deadline.</p>
                            <DateTimePicker id="newdeadline" onChange={setNewDeadline}
                                defaultValue={moment(this.parent().deadline).toDate()} format={"yyyy-MM-dd HH:mm"} />
                        </div>,
                    'onConfirm': (val)=>{
                        ProcessActions.changeDeadline(this.parent().ptask.hash, new_deadline);
                        //return false;
                    },
                    'overflow': 'visible'
                });
            },
            render(){
                console.log("aaaaaaaaaaaaaaaa");
                let users;
                try{
                    users = this.parent().ptask.users;
                } catch(ex){
                    users = [];
                }
                let onlyShow = true;
                try{
                    onlyShow = !this.state.parent.props.showOnly;
                }
                catch(ex){

                }

                return <span>
                    <div key="state-assignee" className="form-group">
                        <label for="state-assignee">Assignees <i title="This field is mandatory" className=" text-danger fa fa-asterisk" /></label>
                            {this.state.users.length > 0?
                                <Select onChange={this.setAssignee} placeholder="Search for assignees"
                                    value={this.parent().assignee} name="form-field-name"
                                    multi={true} options={this.state.users} disabled={this.parent().disabled} />
                            :''}
                    </div>
                    <div key="state-deadline" className="form-group">
                        <label for="state-deadline">Deadline <i title="This field is mandatory" className=" text-danger fa fa-asterisk" /></label>
                        {onlyShow ?(users.length > 0 ?
                            <button className="pull-right btn btn-xs btn-primary" onClick={this.extendDeadline}>
                                <i title="Change this task deadline" className="fa fa-plus" /> Change deadline
                            </button>
                        :''):''}

                        <DateTimePicker key={moment(this.parent().deadline).toDate()} onChange={this.setDeadline} disabled={this.parent().disabled}
                            defaultValue={moment(this.parent().deadline).toDate()} format={"yyyy-MM-dd HH:mm"} />

                    </div>

                    {this.results()}

                    <ChildComponent main={this} />
                </span>
            }
        });

        return super.detailRender(editable, SimpleRun);
    }
}

export default {SimpleTask, SimpleTaskRun, dummy};
