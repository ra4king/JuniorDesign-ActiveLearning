import React from 'react';
import socket from '../socket.jsx';


export default class SettingsPanels extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            users: [],
            selectedUser: null
        };

        this.getUsers = this.getUsers.bind(this);

        if(socket.isLoggedIn()) {
            this.getUsers();
        } else {
            socket.on('login', this.getUsers);
        }

        socket.on('term', this.getUsers);
    }

    componentWillUnmount() {
        socket.remove('login', this.getUsers);
        socket.remove('term', this.getUsers);
    }

    getUsers() {
        socket.send('getAllUsers', (err, users) => {
            if(err) {
                console.error('Error getting users: ' + err);
            } else {
                this.setState((prevState) => {
                    let selectedUser = prevState.selectedUser;

                    if(selectedUser) {
                        users.findIndex((user) => {
                            if(user.username == selectedUser.username) {
                                selectedUser = user;
                                return true;
                            } else {
                                return false;
                            }
                        });
                    }

                    return { users: users, selectedUser: selectedUser };
                });
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
                    users={this.state.users}
                    getUsers={this.getUsers.bind(this)}
                    selectUser={this.selectUser.bind(this)}
                    showConfirm={this.props.showConfirm} />

                <PermissionPanel
                    getUsers={this.getUsers.bind(this)}
                    selectUser={this.selectUser.bind(this)}
                    selectedUser={this.state.selectedUser}
                    showConfirm={this.props.showConfirm} />
            </div>
        );
    }
}

class StudentPanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showStudents: true,
            userToAdd: '',
            invitationURL: '',
        };
    }

    addUser() {
        if(this.state.userToAdd) {
            socket.send('addUser', this.state.userToAdd, (err) => {
                if(err) {
                    this.props.showConfirm({ type: 'ok', title: 'Error adding user: ' + err });
                } else {
                    this.setState({ userToAdd: '' });
                    this.props.getUsers();
                }
            });
        }
    }

    createInvitation() {
        socket.send('createInvitation', (err, id) => {
            if(err) {
                this.props.showConfirm({ type: 'ok', title: 'Error creating invitation: ' + err });
            } else {
                this.setState({ invitationURL: document.location.href.replace('settings', 'login?register=true&invitation=' + id) });
            }
        });
    }

    render() {
        return (
            <div className='panel' id='student-panel'>
                <div id='add-user'>
                    <input type='text' value={this.state.userToAdd} onChange={(e) => this.setState({ userToAdd: e.target.value })} onSubmit={this.addUser.bind(this)} />
                    <button onClick={this.addUser.bind(this)}>Add user</button>
                </div>
                <div id='create-invitation'>
                    <button onClick={this.createInvitation.bind(this)}>Create Invitation Link</button>
                    <input type='text' value={this.state.invitationURL} readOnly={true} />
                </div>
                <div id='student-lists'>
                    <ul id='tabs'>
                        <li>
                            <a href='#' className={'tablinks' + (this.state.showStudents ? ' tablinks-active' : '')} onClick={() => this.setState({ showStudents: true })}>
                                Students
                            </a>
                        </li>
                        <li>
                            <a href='#' className={'tablinks' + (this.state.showStudents ? '' : ' tablinks-active')} onClick={() => this.setState({ showStudents: false })}>
                                TAs
                            </a>
                        </li>
                    </ul>

                    {this.state.showStudents
                        ? (<ul className='student-list'>
                            {this.props.users.map((user) => (
                                (!user.permissions || !user.permissions.isTA) &&
                                    (<li key={user.username}>
                                        <button className='list-button' onClick={() => this.props.selectUser(user)}>
                                            {user.username}
                                        </button>
                                    </li>)
                            ))}
                        </ul>)
                        : (<ul className='student-list'>
                            {this.props.users.map((user) => (
                                user.permissions && user.permissions.isTA &&
                                    (<li key={user.username}>
                                        <button className='list-button' onClick={() => this.props.selectUser(user)}>
                                            {user.username}
                                        </button>
                                    </li>)
                            ))}
                        </ul>)}
                </div>
            </div>
        );
    }
}

class PermissionPanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isTA: false,
            canCreateQuestions: false,
            canEditQuestions: false,
            canCreateQuizzes: false,
            canEditQuizzes: false,
            canPublishQuizzes: false,
            canManageRoster: false,
            canManageTAs: false,
        };

        if(props.selectedUser && props.selectedUser.permissions) {
            this.state.isTA = props.selectedUser.permissions.isTA;
            this.state.canCreateQuestions = props.selectedUser.permissions.canCreateQuestions;
            this.state.canEditQuestions = props.selectedUser.permissions.canEditQuestions;
            this.state.canCreateQuizzes = props.selectedUser.permissions.canCreateQuizzes;
            this.state.canEditQuizzes = props.selectedUser.permissions.canEditQuizzes;
            this.state.canPublishQuizzes = props.selectedUser.permissions.canPublishQuizzes;
            this.state.canManageRoster = props.selectedUser.permissions.canManageRoster;
            this.state.canManageTAs = props.selectedUser.permissions.canManageTAs;
        }
    }

    componentWillReceiveProps(newProps) {
        if(newProps.selectedUser && newProps.selectedUser.permissions) {
            this.setState({
                isTA: newProps.selectedUser.permissions.isTA,
                canCreateQuestions: newProps.selectedUser.permissions.canCreateQuestions,
                canEditQuestions: newProps.selectedUser.permissions.canEditQuestions,
                canCreateQuizzes: newProps.selectedUser.permissions.canCreateQuizzes,
                canEditQuizzes: newProps.selectedUser.permissions.canEditQuizzes,
                canPublishQuizzes: newProps.selectedUser.permissions.canPublishQuizzes,
                canManageRoster: newProps.selectedUser.permissions.canManageRoster,
                canManageTAs: newProps.selectedUser.permissions.canManageTAs
            });
        }
    }

    updatePermissions() {
        if(this.props.selectedUser) {
            socket.send('setPermissions', {
                username: this.props.selectedUser.username,
                permissions: {
                    isTA: true,
                    canCreateQuestions: this.state.canCreateQuestions,
                    canEditQuestions: this.state.canEditQuestions,
                    canCreateQuizzes: this.state.canCreateQuizzes,
                    canEditQuizzes: this.state.canEditQuizzes,
                    canPublishQuizzes: this.state.canPublishQuizzes,
                    canManageRoster: this.state.canManageRoster,
                    canManageTAs: this.state.canManageTAs
                }}, (err) => {
                    this.props.getUsers();

                    this.props.showConfirm({
                        type: 'ok',
                        title: err ? 'Could not set permissions: ' + err : 'Permissions updated.'
                    });
                });
        } else {
            this.props.showConfirm({
                type: 'ok',
                title: 'Please select a student to modify.'
            });
        }
    }

    removeTA() {
        if(this.props.selectedUser) {
            socket.send('setPermissions', {
                username: this.props.selectedUser.username,
                permissions: {
                    isTA: false,
                    canCreateQuestions: false,
                    canEditQuestions: false,
                    canCreateQuizzes: false,
                    canEditQuizzes: false,
                    canPublishQuizzes: false,
                    canManageRoster: false,
                    canManageTAs: false
                }}, (err) => {
                    if(err) {
                        this.props.showConfirm({
                            type: 'ok',
                            title: 'Could not set permissions: ' + err
                        });
                    } else {
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

    removeStudent() {
        if(this.props.selectedUser) {
            socket.send('removeUser', this.props.selectedUser.username, (err) => {
                if(err) {
                    this.props.showConfirm({
                        type: 'ok',
                        title: 'Error removing student: ' + err
                    });
                }

                this.props.getUsers();
                this.props.selectUser(null);
            });
        }
    }

    render() {
        return (
            <div className='panel' id='permission-panel'>
                {this.props.selectedUser
                    ? [<p key='title' id='username-title'>{this.props.selectedUser.username}</p>,
                      !this.state.isTA
                        ? (<div key='maketa'><button className='option-button' id='make-ta-button' onClick={this.updatePermissions.bind(this)}>Make a TA</button></div>)
                        : (<div key='permissions'>
                            <ul id='permission-list'>
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
                                <li><label className="switch">
                                    <input type="checkbox"
                                           checked={this.state.canManageTAs}
                                           onChange={() => this.setState({ canManageTAs: !this.state.canManageTAs })} />
                                    <div className="slider"></div>
                                    </label> Manage TAs</li>
                            </ul>
                            <div><button className='option-button' id='make-ta-button' onClick={this.updatePermissions.bind(this)}>Update</button></div>
                            <div><button className='option-button' id='remove-ta-button' onClick={this.removeTA.bind(this)}>Remove TA</button></div>
                        </div>),
                        <div key='removestudent'><button className='option-button' id='remove-student-button' onClick={this.removeStudent.bind(this)}>Remove Student</button></div>]
                    : <p>Please selected a user on the left panel.</p>}
            </div>
        );
    }
}
