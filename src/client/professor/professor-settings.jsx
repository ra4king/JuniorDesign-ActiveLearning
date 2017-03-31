import React from 'react';
import socket from '../socket.jsx';
import { unescapeHTML } from '../utils.jsx';

export default class SettingsPanels extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            users: [],
            selectedUser: null,
        }

        if(socket.isLoggedIn()) {
            this.getUsers();
        } else {
            socket.on('login', this.getUsers.bind(this));
        }
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
                <StudentPanel users={this.state.users} selectUser={this.selectUser.bind(this)} />

                <PermissionPanel
                    users={this.state.users}
                    getUsers={this.getUsers.bind(this)}
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
            showStudents: true
        };
    }

    showStudents() {
        this.setState({ showStudents: true });
    }

    showTAs() {
        this.setState({ showStudents: false });
    }

    render() {
        return (
            <div className='panel' id='student-panel'>
                <ul id='tabs'>
                    <li>
                        <a href='#' className={'tablinks' + (this.state.showStudents ? ' tablinks-active' : '')} onClick={this.showStudents.bind(this)}>
                            Students
                        </a>
                    </li>
                    <li>
                        <a href='#' className={'tablinks' + (this.state.showStudents ? '' : ' tablinks-active')} onClick={this.showTAs.bind(this)}>
                            TAs
                        </a>
                    </li>
                </ul>

                {this.state.showStudents
                    ? (<div className='list'>
                        {this.props.users.map((user) => (
                            (!user.permissions || !user.permissions.is_ta) &&
                                (<li key={user.username}>
                                    <button className='list-button' onClick={() => this.props.selectUser(user)}>
                                        {unescapeHTML(user.username)}
                                    </button>
                                </li>)
                        ))}
                    </div>)
                    : (<div className='list'>
                        {this.props.users.map((user) => (
                            (user.permissions && user.permissions.is_ta) &&
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
    makeTa() {
        if(this.props.selectedUser) {
            socket.send('set_permissions', { username: this.props.selectedUser.username, permissions: { is_ta: true }}, (err) => {
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
        }
    }

    render() {
        return (
            <div className='panel' id='permission-panel'>
                <p>{this.props.selectedUser ? 'Selected ' + unescapeHTML(this.props.selectedUser.username) + '.' : 'Select a user from the side panel.'}</p>
                <p>What else are we going to put here?</p>
                <button className='option-button' id='make-ta-button' onClick={this.makeTa.bind(this)}>Make a TA</button>
            </div>
        );
    }
}
