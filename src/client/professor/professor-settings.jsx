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
            <div>
                <StudentPanel users={this.state.users} selectUser={this.selectUser.bind(this)} />

                <PermissionPanel users={this.state.users} selectedUser={this.state.selectedUser} />
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
                <ul className='tab'>
                    <li>
                        <a href='#' className={'tablinks' + (this.state.showStudents ? ' active' : '')} onClick={this.showStudents.bind(this)}>
                            Students
                        </a>
                    </li>
                    <li>
                        <a href='#' className={'tablinks' + (this.state.showStudents ? '' : ' active')} onClick={this.showTAs.bind(this)}>
                            TAs
                        </a>
                    </li>
                </ul>

                {this.state.showStudents
                    ? (<table className='sortable tabcontent' id='student-list'>
                        <thead>
                            <tr><th>Users</th></tr>
                        </thead>
                        <tbody id='student-buttons'>
                            {this.props.users.map((user) => (
                                <tr key={user.username}>
                                    <td>
                                        <button className='list-button' onClick={() => this.props.selectUser(user)}>
                                            {unescapeHTML(user.username)}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>)
                    : (<table className='sortable tabcontent' id='ta-list'>
                        <thead>
                            <tr><th>Teaching Assistants</th></tr>
                        </thead>
                        <tbody id='ta-buttons'>
                        </tbody>
                    </table>)}
            </div>
        );
    }
}

class PermissionPanel extends React.Component {
    render() {
        return (
            <div className='panel' id='permission-panel'>
                <p>{this.props.selectedUser ? 'Selected ' + unescapeHTML(this.props.selectedUser.username) + '.' : 'Select a user from the side panel.'}</p>
                <p>What else are we going to put here?</p>
                <button id='make-ta-button'>Make a TA</button>
            </div>
        );
    }
}
