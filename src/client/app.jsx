import React from 'react';
import ReactDOM from 'react-dom';
import socket from './socket.jsx';

import ProfessorHome from './professor/professor-app.jsx';
import ProfessorStatistics from './professor/professor-statistics.jsx';
import ProfessorSettings from './professor/professor-settings.jsx';

import StudentHome from './student/student-app.jsx';
import StudentStatistics from './student/student-statistics.jsx';

import { Router, Route, IndexRoute, IndexLink, browserHistory } from 'react-router';


window.onload = () => {
    ReactDOM.render(
        <Router history={browserHistory}>
            <Route path='/active-learning/' component={App}>
                <IndexRoute component={HomePanels} />
                <Route path='/active-learning/select-term' component={SelectTermPanels} />
                <Route path='/active-learning/statistics' component={StatisticsPanels} />
                <Route path='/active-learning/settings' component={SettingsPanels} />
            </Route>
        </Router>, document.getElementById('page'));
}

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            user: null,
            selectedTerm: null,
            resources: {},
            questions: {},
            quizzes: {},
            submissions: {},
            showConfirm: null
        };

        socket.on('login', (user) => {
            if(user) {
                console.log('USER');
                console.log(user);
                this.setState({ user: user });

                if(user.lastSelectedTerm) {
                    this.selectTerm(user.lastSelectedTerm.term_id);
                } else {
                    browserHistory.push('/active-learning/select-term');
                }
            }
        });

        socket.on('term', (term) => {
            this.setState({ selectedTerm: term });
        });

        socket.on('user', (user) => {
            console.log('USER')
            console.log(user);

            this.setState((prevState) => {
                if(JSON.stringify(prevState.user) != JSON.stringify(user)) {
                    this.selectTerm(user.lastSelectedTerm.term_id);
                    return { user: user };
                }
            });
        });

        socket.on('questions', (data) => {
            console.log('QUESTIONS');
            console.log(data);

            this.setState((prevState) => {
                var questions = {};
                Object.assign(questions, prevState.questions);

                data.forEach((question) => {
                    if(question.removed) {
                        delete questions[question._id];
                    } else {
                        questions[question._id] = question;
                    }
                });

                return { questions: questions };
            });
        });
        socket.on('quizzes', (data) => {
            console.log('QUIZZES');
            console.log(data);

            this.setState((prevState) => {
                var quizzes = {};
                Object.assign(quizzes, prevState.quizzes);

                data.forEach((quiz) => {
                    if(quiz.removed) {
                        delete quizzes[quiz._id];
                    } else {
                        quizzes[quiz._id] = quiz;
                    }
                });

                return { quizzes: quizzes };
            });
        });
        socket.on('submissions', (data) => {
            console.log('SUBMISSIONS');
            console.log(data);

            this.setState((prevState) => {
                var submissions = {};
                Object.assign(submissions, prevState.submissions);

                data.forEach((submission) => {
                    submissions[submission._id] = submission;
                });

                return { submissions: submissions };
            });
        });

        socket.connect();
    }

    // { permissions, isTermAdmin }
    getPermissions() {
        if(!this.state.user || !this.state.selectedTerm) {
            return;
        }

        var idx = this.state.user.permissions.findIndex((permission) =>
                        String(permission.term_id) === String(this.state.selectedTerm._id));
        if(idx === -1) {
            return { permissions: null, isTermAdmin: this.state.user.admin };
        }

        var permissions = this.state.user.permissions[idx];
        return { permissions: permissions, isTermAdmin: permissions.isCreator || permissions.isTA };
    }

    selectTerm(term_id) {
        this.setState({ questions: {}, quizzes: {}, submissions: {} }, () =>
            socket.send('selectTerm', term_id, (err, term) => {
                if(err) {
                    this.showConfirm({ type: 'ok', title: 'Error selecting term: ' + err });

                    this.setState({ selectedTerm: null });
                    browserHistory.push('/active-learning/select-term');
                } else {
                    console.log('TERM');
                    console.log(term);

                    this.setState({ selectedTerm: term });
                }
            }));
    }

    showConfirm(options) {
        this.setState({ showConfirm: options });
    }

    hideConfirm() {
        this.setState({ showConfirm: null });
    }

    getResource(resource_id, callback) {
        if(this.state.resources[resource_id]) {
            if(callback) {
                callback(null, this.state.resources[resource_id]);
            }

            this.forceUpdate();
        } else {
            socket.send('getResource', resource_id, (err, resource) => {
                if(err) {
                    console.error('Failed to load image with resource id ' + resource_id + ': ' + err);
                    if(callback) {
                        callback(err);
                    }
                } else {
                    this.setState((prevState) => {
                        let resources = prevState.resources;
                        resources[resource_id] = resource;
                        return { resources: resources };
                    }, () => {
                        if(callback) {
                            callback(null, resource);
                        }
                    });
                }
            });
        }
    }

    deleteResource(resource_id) {
        delete this.state.resources[resource_id];
    }

    render() {
        return (
            <div>
                {(this.state.currentLiveQuiz || this.state.showConfirm)
                    && (<div id='overlay'></div>)}

                {this.state.currentLiveQuiz &&
                    <LiveQuizPanel
                        quiz={this.state.currentLiveQuiz}
                        questions={this.state.questions}
                        resources={this.state.resources}
                        getResource={this.getResource.bind(this)}
                        hideLiveQuiz={this.hideLiveQuiz.bind(this)} />}

                {this.state.showConfirm &&
                    <ConfirmBox hide={() => this.hideConfirm()} {...this.state.showConfirm} />}

                <div id='content' className={(this.state.currentLiveQuiz || this.state.showConfirm) && 'blur'}>
                    <HeaderPanel user={this.state.user} selectedTerm={this.state.selectedTerm} />

                    {React.Children.map(this.props.children, (child) =>
                        React.cloneElement(child, {
                            user: this.state.user,
                            getPermissions: this.getPermissions.bind(this),
                            selectedTerm: this.state.selectedTerm,
                            selectTerm: this.selectTerm.bind(this),
                            questions: this.state.questions,
                            quizzes: this.state.quizzes,
                            submissions: this.state.submissions,
                            getResource: this.getResource.bind(this),
                            deleteResource: this.deleteResource.bind(this),
                            showConfirm: this.showConfirm.bind(this)
                        }))}
                </div>
            </div>
        );
    }
}

class HeaderPanel extends React.Component {
    render() {
        var username = (this.props.user && this.props.user.username ? ' ' + this.props.user.username : '') + '!';
        var termName = this.props.selectedTerm ? '\n' + this.props.selectedTerm.course.name + ' - ' + this.props.selectedTerm.name : '';

        return (
            <div id='header-panel'>
                <img id='logo' src='images/active_learning_logo_white.png' width='175' height='75' alt='logo'/>
                <div id='name'>
                    <h2>Welcome, {username}</h2>
                    <h2>{termName}</h2>
                </div>
                <nav>
                    <form method='post' id='nav-links'>
                        <IndexLink to='/active-learning/select-term' className='header-nav-link' activeClassName='header-nav-link-selected'>Change Term</IndexLink>
                        <IndexLink to='/active-learning/' className='header-nav-link' activeClassName='header-nav-link-selected'>Home</IndexLink>
                        <IndexLink to='/active-learning/statistics' className='header-nav-link' activeClassName='header-nav-link-selected'>Statistics</IndexLink>
                        <IndexLink to='/active-learning/settings' className='header-nav-link' activeClassName='header-nav-link-selected'>Settings</IndexLink>
                        <button className='header-nav-link' formAction='api/logout'>Logout</button>
                    </form>
                </nav>
            </div>
        );
    }
}

class ConfirmBox extends React.Component {
    clicked(value) {
        this.props.hide();
        this.props.onAction && this.props.onAction(value);
    }

    render() {
        return (
            <div id='confirm-box'>
                <p id='confirm-msg'>{this.props.title}</p>
                <div id='confirm-buttons'>
                    {this.props.type == 'yesno'
                        ? [(<button key='no' onClick={() => this.clicked(false)} className='confirm-button' id='yes-button'>{this.props.noText || 'No'}</button>),
                            (<button key='ok' onClick={() => this.clicked(true)} className='confirm-button' id='no-button'>{this.props.yesText || 'Yes'}</button>)]
                        : (<button onClick={() => this.clicked()} className='confirm-button' id='ok-button'>{this.props.okText || 'Ok'}</button>)}
                </div>
            </div>
        );
    }
}

class SelectTermPanels extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            schools: [],
            courses: [],
            terms: []
        };

        var getSchools = () => {
            socket.send('getSchools', (err, schools) => {
                if(err) {
                    props.showConfirm({ type: 'ok', title: 'Error getting schools: ' + err });
                } else {
                    this.setState({ schools: schools });
                }
            });
        };

        if(socket.isLoggedIn()) {
            getSchools();
        } else {
            socket.on('login', (user) => {
                if(user.lastSelectedTerm) {
                    this.props.selectTerm(user.lastSelectedTerm.term_id);
                    browserHistory.push('/active-learning/');
                } else {
                    getSchools();
                }
            });
        }
    }

    selectSchool(school_id) {
        if(this.state.school_id == school_id) {
            return;
        }

        this.setState({ selectedSchool: school_id, selectedCourse: null });

        socket.send('getCourses', school_id, (err, courses) => {
            if(err) {
                this.props.showConfirm({ type: 'ok', title: 'Error getting courses: ' + err });
            } else {
                this.setState({ courses: courses, terms: [] });
            }
        });
    }

    selectCourse(course_id) {
        if(this.state.course_id == course_id) {
            return;
        }

        this.setState({ selectedCourse: course_id });

        socket.send('getTerms', course_id, (err, terms) => {
            if(err) {
                this.props.showConfirm({ type: 'ok', title: 'Error getting terms: ' + err });
            } else {
                this.setState({ terms: terms });
            }
        });
    }

    render() {
        return (
            <div id='panels'>
                <div className='panel select-panel' id='school-select-panel'>
                    <p className='select-title'>Schools</p>
                    <ol className='select-list'>
                        {this.state.schools.map((school) =>
                            (<li key={school._id}>
                                <button
                                    className={'select-list-button' + (this.state.selectedSchool === school._id ? ' select-list-button-selected' : '')}
                                    onClick={() => this.selectSchool(school._id)}>{school.name}</button>
                            </li>))}
                    </ol>
                </div>

                <div className='panel select-panel' id='course-select-panel'>
                    <p className='select-title'>Courses</p>
                    <ol className='select-list'>
                        {this.state.courses.map((course) =>
                            (<li key={course._id}>
                                <button
                                    className={'select-list-button' + (this.state.selectedCourse === course._id ? ' select-list-button-selected' : '')}
                                    onClick={() => this.selectCourse(course._id)}>{course.name}</button>
                            </li>))}
                    </ol>
                </div>

                <div className='panel select-panel' id='term-select-panel'>
                    <p className='select-title'>Terms</p>
                    <ol className='select-list'>
                        {this.state.terms.map((term) =>
                            (<li key={term._id}>
                                <button
                                    className='select-list-button'
                                    onClick={() => this.props.selectTerm(term._id) || browserHistory.push('/active-learning/')}>{term.name}</button>
                            </li>))}
                    </ol>
                </div>
            </div>
        );
    }
}

class HomePanels extends React.Component {
    render() {
        var permissions = this.props.getPermissions();

        return !permissions
            ? <div>Logging in...</div>
            : (permissions.isTermAdmin
                ? <ProfessorHome {...this.props} />
                : <StudentHome {...this.props} />);
    }
}

class StatisticsPanels extends React.Component {
    render() {
        var permissions = this.props.getPermissions();

        return !permissions
            ? <div>Logging in...</div>
            : (permissions.isTermAdmin
                ? <ProfessorStatistics {...this.props} />
                : <StudentStatistics {...this.props} />);
    }
}

class SettingsPanels extends React.Component {
    render() {
        var permissions = this.props.getPermissions();

        return !permissions
            ? <div>Logging in...</div>
            : (permissions.isTermAdmin
                ? <ProfessorSettings {...this.props} />
                : <div>Unimplemented.</div>);
    }
}
