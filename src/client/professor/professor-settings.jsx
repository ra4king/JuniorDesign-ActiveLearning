import React from 'react';
import socket from '../socket.jsx';
import { unescapeHTML } from '../utils.jsx';

export default class SettingsPanels extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            students: true,
            users: [],
            selectedUser: null
        };

        if(socket.isLoggedIn()) {
            this.getUsers();
        } else {
            socket.on('login', this.getUsers.bind(this));
        }
    }

    showStudents() {
        this.setState({ students: true, selectedUser: null });
    }

    showTAs() {
        this.setState({ students: false, selectedUser: null });
    }

    getUsers() {
        socket.send('get_users', (err, users) => {
            if(err) {
                console.error('Error getting users: ' + err);
            } else {
                this.setState({ users: users });
            }
        });
    }

    selectUser(user) {
        this.setState({ selectedUser: user });
    }

    render() {
        return (
            <div id='panels'>
                <StudentPanel
		    students={this.state.students}
		    users={this.state.users}
		    showStudents={this.showStudents.bind(this)}
		    showTAs={this.showTAs.bind(this)}
		    selectUser={this.selectUser.bind(this)} />

                <PermissionPanel
		    students={this.state.students}
                    users={this.state.users}
                    getUsers={this.getUsers.bind(this)}
                    selectedUser={this.state.selectedUser}
                    showConfirm={this.props.showConfirm} />
            </div>
        );
    }
}

class StudentPanel extends React.Component {
    render() {
        return (
            <div className='panel' id='student-panel'>
                <ul id='tabs'>
                    <li>
                        <a href='#' className={'tablinks' + (this.props.students ? ' tablinks-active' : '')} onClick={this.props.showStudents}>
                            Students
                        </a>
                    </li>
                    <li>
                        <a href='#' className={'tablinks' + (this.props.students ? '' : ' tablinks-active')} onClick={this.props.showTAs}>
                            TAs
                        </a>
                    </li>
                </ul>

                {this.props.students
                    ? (<div className='list'>
                        {this.props.users.map((user) => (
                            (!user.permissions || !user.permissions.isTA) &&
                                (<li key={user.username}>
                                    <button className='list-button' onClick={() => this.props.selectUser(user)}>
                                        {unescapeHTML(user.username)}
                                    </button>
                                </li>)
                        ))}
                    </div>)
                    : (<div className='list'>
                        {this.props.users.map((user) => (
                            user.permissions && user.permissions.isTA &&
                                (<li key={user.username}>
                                    <button className='list-button' onClick={() => this.props.selectUser(user)}>
                                        {unescapeHTML(user.username)}
                                    </button>
                                </li>)
                        ))}
                    </div>)}
            </div>
        );
    }
}

class PermissionPanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            canCreateQuestions: false,
            canEditQuestions: false,
            canCreateQuizzes: false,
            canEditQuizzes: false,
            canPublishQuizzes: false,
            canManageRoster: false
        };

        if(props.selectedUser && props.selectedUser.permissions) {
            this.state.canCreateQuestions = props.selectedUser.permissions.canCreateQuestions;
            this.state.canEditQuestions = props.selectedUser.permissions.canEditQuestions;
            this.state.canCreateQuizzes = props.selectedUser.permissions.canCreateQuizzes;
            this.state.canEditQuizzes = props.selectedUser.permissions.canEditQuizzes;
            this.state.canPublishQuizzes = props.selectedUser.permissions.canPublishQuizzes;
            this.state.canManageRoster = props.selectedUser.permissions.canManageRoster;
        }
    }

    componentWillReceiveProps(newProps) {
        if(newProps.selectedUser && newProps.selectedUser.permissions) {
            this.setState({
                canCreateQuestions: newProps.selectedUser.permissions.canCreateQuestions,
                canEditQuestions: newProps.selectedUser.permissions.canEditQuestions,
                canCreateQuizzes: newProps.selectedUser.permissions.canCreateQuizzes,
                canEditQuizzes: newProps.selectedUser.permissions.canEditQuizzes,
                canPublishQuizzes: newProps.selectedUser.permissions.canPublishQuizzes,
                canManageRoster: newProps.selectedUser.permissions.canManageRoster
            });
        }
    }

    updatePermissions() {
        if(this.props.selectedUser) {
            socket.send('set_permissions', {
                username: this.props.selectedUser.username,
                permissions: {
                    isTA: true,
                    canCreateQuestions: this.state.canCreateQuestions,
                    canEditQuestions: this.state.canEditQuestions,
                    canCreateQuizzes: this.state.canCreateQuizzes,
                    canEditQuizzes: this.state.canEditQuizzes,
                    canPublishQuizzes: this.state.canPublishQuizzes,
                    canManageRoster: this.state.canManageRoster
                }}, (err) => {
                if(err) {
                    this.props.showConfirm({
                        type: 'ok',
                        title: 'Could not set permissions: ' + err
                    });
                } else {
                    console.log('success!')
                    this.props.getUsers();
                }
            });
        } else {
            this.props.showConfirm({
                type: 'ok',
		title: 'Please select a student to modify.'
            });
	}
    }

    render() {
        return (
            <div className='panel' id='permission-panel'>
                {this.props.selectedUser
                    ? this.props.students
                        ? (<button className='option-button' id='make-ta-button' onClick={this.updatePermissions.bind(this)}>Make a TA</button>)
                        : (<div><ul id='permission-list'>
                            <li><label className="switch">
                                <input type="checkbox"
                                       checked={this.state.canCreateQuestions}
                                       onChange={() => this.setState({ canCreateQuestions: !this.state.canCreateQuestions })} />
                                <div className="slider"></div>
                            </label> Create Questions</li>
                            <li><label className="switch">
                                <input type="checkbox"
                                       checked={this.state.canEditQuestions}
                                       onChange={() => this.setState({ canEditQuestions: !this.state.canEditQuestions })} />
                                <div className="slider"></div>
                            </label> Edit Questions</li>
                            <li><label className="switch">
                                <input type="checkbox"
                                       checked={this.state.canCreateQuizzes}
                                       onChange={() => this.setState({ canCreateQuizzes: !this.state.canCreateQuizzes })} />
                                <div className="slider"></div>
                            </label> Create Quizzes</li>
                            <li><label className="switch">
                                <input type="checkbox"
                                       checked={this.state.canEditQuizzes}
                                       onChange={() => this.setState({ canEditQuizzes: !this.state.canEditQuizzes })} />
                                <div className="slider"></div>
                            </label> Edit Quizzes</li>
                            <li><label className="switch">
                                <input type="checkbox"
                                       checked={this.state.canPublishQuizzes}
                                       onChange={() => this.setState({ canPublishQuizzes: !this.state.canPublishQuizzes })} />
                                <div className="slider"></div>
                            </label> Publish Quizzes</li>
                            <li><label className="switch">
                                <input type="checkbox"
                                       checked={this.state.canManageRoster}
                                       onChange={() => this.setState({ canManageRoster: !this.state.canManageRoster })} />
                                <div className="slider"></div>
                            </label> Manage Roster</li>
                        </ul>
                        <button className='option-button' id='make-ta-button' onClick={this.updatePermissions.bind(this)}>Update</button></div>)
                    : <p>Please selected a user on the left panel.</p>}
            </div>
        );
    }
}
