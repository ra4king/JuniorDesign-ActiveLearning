import React from 'react';
import socket from '../socket.jsx';
import { unescapeHTML } from '../utils.jsx';

import StatisticsPanels from './professor-statistics.jsx';
import SettingsPanels from './professor-settings.jsx';

import { Router, Route, IndexRoute, IndexLink, browserHistory } from 'react-router';

export default class ProfessorApp extends React.Component {
    render() {
        return (
            <Router history={browserHistory}>
                <Route path='/active-learning/' component={ProfessorHome}>
                    <IndexRoute component={HomePanels} />
                    <Route path='/active-learning/select-term' component={SelectTermPanels} />
                    <Route path='/active-learning/statistics' component={StatisticsPanels} />
                    <Route path='/active-learning/settings' component={SettingsPanels} />
                </Route>
            </Router>
        );
    }
}

class ProfessorHome extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            user: null,
            resources: {},
            questions: {},
            quizzes: {},
            submissions: {},
            showConfirm: null
        };

        socket.on('login', (user) => {
            if(user) {
                this.setState({ user: user });

                if(user.lastSelectedTerm) {
                    this.selectTerm(user.lastSelectedTerm.term_id);
                }
            }
        });
        socket.on('user', (user) => {
            console.log('USER')
            console.log(user);

            this.setState({ user: user });
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
                    if(submission.removed) {
                        delete submissions[submission._id];
                    } else {
                        submissions[submission._id] = submission;
                    }
                });

                return { submissions: submissions };
            });
        });
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

        var permissions = connection.user.permissions[idx];
        return { permissions: permissions, isTermAdmin: permissions.isCreator || permissions.isTA };
    }

    selectTerm(term_id) {
        this.setState({ questions: {}, quizzes: {}, submissions: {} }, () =>
            socket.send('selectTerm', term_id, (err, term) => {
                if(err) {
                    this.showConfirm({ type: 'ok', title: 'Error selecting term: ' + err });

                    this.setState({ selectedTerm: null });
                } else {
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

            this.setState({ questions: this.state.questions });
        } else {
            socket.send('get_resource', resource_id, (err, resource) => {
                if(err) {
                    console.error('Failed to load image with resource id ' + resource_id + ': ' + err);
                    if(callback) {
                        callback(err);
                    }
                } else {
                    var resources = this.state.resources;
                    resources[resource_id] = resource;

                    if(callback) {
                        callback(null, resource);
                    }

                    this.setState({ questions: this.state.questions, resources: resources });
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
                    <HeaderPanel user={this.state.user} />

                    {React.Children.map(this.props.children, (child) =>
                        React.cloneElement(child, {
                            user: this.state.user,
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
        return (
            <div id='header-panel'>
                <img id='logo' src='images/active_learning_logo_white.png' width='175' height='75' alt='logo'/>
                <h2 id='name'>{this.props.user ? this.props.user.username : ''}</h2>
                <nav id='nav-links'>
                    <form method='post'>
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
                this.setState({ courses: courses });
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
    constructor(props) {
        super(props);

        this.state = {
            creatingQuiz: false
        };
    }

    setCreatingQuiz(creatingQuiz) {
        if(this.state.creatingQuiz != creatingQuiz) {
            this.setState({ creatingQuiz: creatingQuiz });
        }
    }

    render() {
        return (
            <div id='panels'>
                <QuizPanel
                    user={this.props.user}
                    questions={this.props.questions}
                    quizzes={this.props.quizzes}
                    setCreatingQuiz={this.setCreatingQuiz.bind(this)}
                    getResource={this.props.getResource}
                    showConfirm={this.props.showConfirm}
                    presentLive={this.props.presentLive} />

                <QuestionPanel
                    user={this.props.user}
                    questions={this.props.questions}
                    creatingQuiz={this.state.creatingQuiz}
                    getResource={this.props.getResource}
                    deleteResource={this.props.deleteResource}
                    showConfirm={this.props.showConfirm} />
            </div>
        );
    }
}

class QuizPanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            editQuiz: null
        };
    }

    setCreatingQuiz() {
        if(this.state.editQuiz && this.state.editQuiz.is_published) {
            return;
        }

        this.props.setCreatingQuiz(!!this.state.editQuiz);
    }

    chooseQuiz(id) {
        this.setState({ editQuiz: this.props.quizzes[id] },
            this.setCreatingQuiz.bind(this));
    }

    toggleQuizEditor() {
        this.setState((prevState) => ({editQuiz: prevState.editQuiz ? null : {}}),
            this.setCreatingQuiz.bind(this));
    }

    hideQuizEditor() {
        this.setState({ editQuiz: null }, this.setCreatingQuiz.bind(this));
    }

    render() {
        return (
            <div id='quiz-panel' className='panel home-panel'>
                <button className='option-button' onClick={() => this.toggleQuizEditor()}>
                    {this.state.editQuiz ? 'Cancel' : 'Create Quiz'}
                </button>

                {this.state.editQuiz
                    ? (<QuizEditor
                        user={this.props.user}
                        quiz={this.state.editQuiz}
                        questions={this.props.questions}
                        hideQuizEditor={this.hideQuizEditor.bind(this)}
                        getResource={this.props.getResource}
                        showConfirm={this.props.showConfirm} />)
                    : (<QuizList
                        showConfirm={this.props.showConfirm}
                        quizzes={this.props.quizzes}
                        chooseQuiz={this.chooseQuiz.bind(this)}
                        presentLive={this.props.presentLive} />)
                }
            </div>
        );
    }
}

class QuizEditor extends React.Component {
    constructor(props) {
        super(props);

        let settings = props.quiz.settings || {};

        this.state = {
            _id: props.quiz._id,
            name: props.quiz.name || '',
            is_published: props.quiz.is_published || false,
            questions: props.quiz.questions || [],
            settings: {
                open_date: new Date(settings.open_date || Date.now()).toISOString().substring(0, 10),
                close_date: new Date(settings.close_date || Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), // 1 week
                max_submission: settings.max_submission || 0,
                allow_question_review: settings.allow_question_review || false,
                allow_answer_review: settings.allow_answer_review || false,
            }
        };
    }

    onNameChange(e) {
        this.setState({ name: e.target.value });
    }

    onOpenDateChange(e) {
        let value = e.target.value;

        this.setState((prevState) => {
            var newSettings = {}
            Object.assign(newSettings, prevState.settings);

            newSettings.open_date = new Date(value).toISOString().substring(0, 10);
            return { settings: newSettings };
        });
    }

    onCloseDateChange(e) {
        let value = e.target.value;

        this.setState((prevState) => {
            var newSettings = {}
            Object.assign(newSettings, prevState.settings);

            newSettings.close_date = new Date(value).toISOString().substring(0, 10);
            return { settings: newSettings };
        });
    }

    onMaxSubmissionChange(e) {
        let value = e.target.value;

        this.setState((prevState) => {
            var newSettings = {}
            Object.assign(newSettings, prevState.settings);

            newSettings.max_submission = value;
            return { settings: newSettings };
        });
    }

    submitQuiz(publish) {
        var callback = (err) => {
            if(err) {
                this.props.showConfirm({
                    type: 'ok',
                    title: 'Error when submitting quiz: ' + err
                });
            } else {
                this.props.hideQuizEditor();
            }
        }

        if(this.state._id) {
            socket.send('updateQuiz', {
                _id: this.state._id,
                term_id: this.props.user.lastSelectedTerm.term_id,
                name: this.state.name,
                is_published: publish,
                questions: this.state.questions,
                settings: this.state.settings
            }, callback);
        } else {
            socket.send('createQuiz', {
                term_id: this.props.user.lastSelectedTerm.term_id,
                name: this.state.name,
                is_published: publish,
                questions: this.state.questions,
                settings: this.state.settings
            }, callback);
        }
    }

    removeQuestion(id) {
        this.setState((prevState) => {
            var questions = prevState.questions.slice();
            var idx = questions.indexOf(id);
            if(idx != -1) {
                questions.splice(idx, 1);
                return { questions: questions };
            } else {
                return {};
            }
        });
    }

    onDragStart(id, e) {
        e.dataTransfer.setData('question-id', id);
    }

    getDropTargetId(e) {
        var component = e.target;
        while(component && (!component.dataset || !component.dataset.id)) {
            component = component.parentNode;
        }
        return component && component.dataset.id;
    }

    onDrop(e) {
        this.setState({ dragOverId: null });

        e.preventDefault();
        var id = e.dataTransfer.getData('question-id');

        if(id) {
            var dropTargetId = this.getDropTargetId(e);

            this.setState((prevState) => {
                var questions = prevState.questions.slice();

                if(dropTargetId) {
                    // nested if to skip the else in case this is false
                    if(id != dropTargetId) {
                        var idx = questions.indexOf(id);
                        var dropIdx = questions.indexOf(dropTargetId);

                        if(idx != -1) {
                            questions.splice(idx, 1);
                        }

                        if(dropIdx != -1) {
                            questions.splice(dropIdx, 0, id);
                        } else {
                            questions.push(id);
                        }
                    }
                } else {
                    var idx = questions.indexOf(id);
                    if(idx != -1) {
                        questions.splice(idx, 1);
                    }

                    questions.push(id);
                }

                return { questions: questions };
            });
        }
    }

    onDragOver(e) {
        e.preventDefault();

        var dragOverId = this.getDropTargetId(e);

        if(dragOverId != this.state.dragOverId) {
            this.setState({ dragOverId: dragOverId });
        }
    }

    render() {
        return (
            <div id='quiz-creator'>
                <div id='quiz-creator-header'>
                    <div id='quiz-name'>
                        Name: {this.state.is_published
                                    ? this.state.name
                                    : (<input type='text' id='quiz-name-field' value={this.state.name} onChange={this.onNameChange.bind(this)}/>)}
                    </div>
                    {!this.state.is_published &&
                        <div>
                            <button id='save-quiz-button' onClick={this.submitQuiz.bind(this, false)}>Save</button>
                            <button id='publish-quiz-buton' onClick={this.submitQuiz.bind(this, true)}>Publish</button>
                        </div>}
                    <div>
                        <p className='quiz-creator-header-entry'>Open Date:&nbsp;
                            {this.state.is_published ? this.state.settings.open_date : <input type='date' value={this.state.settings.open_date} onChange={this.onOpenDateChange.bind(this)} />}</p>
                        <p className='quiz-creator-header-entry'>Close Date:&nbsp;
                            {this.state.is_published ? this.state.settings.close_date : <input type='date' value={this.state.settings.close_date} onChange={this.onCloseDateChange.bind(this)} />}</p>
                    </div>
                    <div className='quiz-creator-header-entry'>
                        Submissions allowed: {this.state.is_published ? (this.state.settings.max_submission || 'Unlimited') : <input type='number' size='2' value={this.state.settings.max_submission} onChange={this.onMaxSubmissionChange.bind(this)} />}
                        {!this.state.is_published && ' 0 for unlimited'}
                    </div>
                </div>
                <ol id='quiz-question-list' onDrop={this.onDrop.bind(this)} onDragOver={this.onDragOver.bind(this)}>
                    {this.state.questions.length > 0
                        ? [this.state.questions.map((id) => (
                            <Question key={id}
                                question={this.props.questions[id]}
                                getResource={this.props.getResource}
                                draggable={!this.state.is_published}
                                onDragStart={this.onDragStart.bind(this, id)}
                                draggedOver={this.state.dragOverId == id}>

                                <button className='delete-button' onClick={() => this.removeQuestion(id)}>&#10006;</button>
                            </Question>)),
                            (<li key='hidden' style={{ visibility: 'hidden', height: '100px' }}></li>)]
                        : (<li style={{ listStyleType: 'none', textAlign: 'center' }}>Drag questions here!</li>)}
                </ol>
            </div>
        );
    }
}

class QuizList extends React.Component {
    render() {
        return (
            <ol id='quiz-list' className='list'>
                {Object.keys(this.props.quizzes).map((id) => {
                    var quiz = this.props.quizzes[id];
                    return (
                        <Quiz key={id}
                            quiz={quiz}
                            chooseQuiz={() => this.props.chooseQuiz(id)}
                            presentLive={() => this.props.presentLive(id)}
                            showConfirm={this.props.showConfirm} />
                    );
                })}
            </ol>
        );
    }
}

class Quiz extends React.Component {
    deleteQuiz() {
        this.props.showConfirm({
            type: 'yesno',
            title: 'Are you sure you want to delete this quiz?',
            onAction: (choice) => {
            if(choice) {
                socket.send('delete_quiz', this.props.quiz._id, (err, data) => {
                    if(err) {
                        this.props.showConfirm({
                            type: 'ok',
                            title: err
                        });
                    }
                });
            }
        }});
    }

    render() {
        return (
            <li className='quiz'>
                <button className='quiz-body' onClick={this.props.chooseQuiz}>{unescapeHTML(this.props.quiz.name)}</button>
                <button className='delete-button' onClick={this.deleteQuiz.bind(this)}>&#10006;</button>
                <button className='live-button' onClick={this.props.presentLive}>L</button>
            </li>
        );
    }
}

class QuestionPanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            editQuestion: null,
            searchTerm: '',
            shownQuestions: props.questions
        };
    }

    componentWillReceiveProps(nextProps) {
        this.updateShownQuestions(this.state.searchTerm, nextProps.questions);
    }

    chooseQuestion(id) {
        this.setState({ editQuestion: this.props.questions[id] });
    }

    toggleQuestionEditor() {
        this.setState((prevState) =>  ({ editQuestion: prevState.editQuestion ? null : {}}));
    }

    hideQuestionEditor() {
        this.setState({ editQuestion: null });
    }

    getFolderHierarchy() {
        var tags = [];

        for(var id in this.props.questions) {
            var question = this.props.questions[id];
            question.tags && question.tags.forEach((tag) => {
                if(tags.indexOf(tag) == -1) {
                    tags.push(tag);
                }
            });
        }

        return [{ name: this.props.user ? this.props.user.lastSelectedTerm.name : '', children: tags }];
    }

    updateShownQuestions(searchTerm, questions) {
        if(searchTerm) {
            searchTerm = searchTerm.toLowerCase();
            
            var filtered = {};
            for (var key in this.props.questions) {
                var match = this.props.questions[key]['name'].toLowerCase().indexOf(searchTerm) != -1 ||
                            this.props.questions[key].tags.map((t) => t.toLowerCase()).indexOf(searchTerm) != -1;

                if (match) {
                    filtered[key] = this.props.questions[key];
                }
            }

            this.setState({ shownQuestions: filtered });
        } else {
            this.setState({ shownQuestions: questions });
        }
    }

    render() {
        return (
            <div id='question-panel' className='panel home-panel'>
                <div id='question-panel-header'>
                    <button className='option-button' onClick={this.toggleQuestionEditor.bind(this)}>
                        {this.state.editQuestion ? 'Cancel' : 'Create Question'}
                    </button>

                    {!this.state.editQuestion &&
                        (<div id='question-search-input'>
                            Search:
                            <input type="text" id='search-input'
                                onChange={(e) => this.updateShownQuestions(e.target.value, this.props.questions)} />
                        </div>)}
                </div>

                {this.state.editQuestion
                    ? (<QuestionEditor
                            user={this.props.user}
                            question={this.state.editQuestion}
                            getResource={this.props.getResource}
                            deleteResource={this.props.deleteResource}
                            hideQuestionEditor={this.hideQuestionEditor.bind(this)}
                            showConfirm={this.props.showConfirm} />)
                    : (<div id='question-tags-list'>
                            <Hierarchy tags={this.getFolderHierarchy()} />
                            <QuestionList
                                questions={this.state.shownQuestions}
                                creatingQuiz={this.props.creatingQuiz}
                                getResource={this.props.getResource}
                                chooseQuestion={this.chooseQuestion.bind(this)}
                                showConfirm={this.props.showConfirm} />
                        </div>)
                }
            </div>
        );
    }
}

class QuestionEditor extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            _id: props.question._id,
            title: props.question.title || '',
            answers: props.question.answers || ['', '', '', ''],
            correct: props.question.correct || 0,
            image_id: props.question.image_id || null,
            tags: props.question.tags || [],
            tag: ''
        }
    }

    componentWillMount() {
        if(this.state.image_id) {
            this.props.getResource(this.state.image_id, (err, resource) => !this.didUnmount && this.setState({ image: resource }));
        }
    }

    componentWillUnmount() {
        this.didUnmount = true;
    }

    changeTitle(e) {
        this.setState({ title: e.target.value });
    }

    changeAnswer(idx, e) {
        var value = e.target.value;
        this.setState((prevState) => {
            var answers = prevState.answers.slice();
            answers[idx] = String(value);
            return { answers: answers };
        });
    }

    addAnswer() {
        this.setState((prevState) => {
            var answers = prevState.answers.slice();
            answers.push('');
            return { answers: answers };
        });
    }

    removeAnswer(idx) {
        if(this.state.answers.length == 2) {
            this.props.showConfirm({
                type: 'ok',
                title: 'You must have at least 2 answer fields.'
            });
            return;
        }

        this.setState((prevState) => {
            var answers = prevState.answers.slice();
            answers.splice(idx, 1);
            return { answers: answers };
        });
    }

    correctSelected(idx) {
        this.setState({ correct: idx });
    }

    imageSelected(e) {
        if(e.target.files && e.target.files[0]) {
            var reader = new FileReader();
            reader.onload = (e) => {
                var image = e.target.result;
                if(image.startsWith('data:image')) {
                    this.setState({ image: image, image_id: null });
                } else {
                    this.props.showConfirm({
                        type: 'ok',
                        title: 'Invalid image file'
                    });
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        } else {
            this.setState({ image: null, image_id: null });
        }
    }

    clearImage() {
        this.setState({ image: null, image_id: null });
    }

    submitQuestion() {
        var title = this.state.title.trim();
        if(!title) {
            this.props.showConfirm({
                type: 'ok',
                title: 'Question title cannot be empty.'
            });
            return;
        }

        var answers = this.state.answers.map((elem) => elem.trim());

        if(answers.findIndex((elem) => !elem) != -1) {
            this.props.showConfirm({
                type: 'ok',
                title: 'Cannot have a blank answer field.'
            });
            return;
        }

        var callback = (err) => {
            if(err) {
                this.props.showConfirm({
                    type: 'ok',
                    title: 'Error submitting question: ' + err
                });
            } else {
                this.props.hideQuestionEditor();
            }
        };

        var sendQuestion = (err, resource_id) => {
            if(err) {
                this.props.showConfirm({
                    type: 'ok',
                    title: 'Error uploading image: ' + err
                });
            } else {
                var toSend = {
                    course_id: this.props.user.lastSelectedTerm.course_id,
                    title: this.state.title,
                    answers: answers,
                    correct: String(this.state.correct),
                    image_id: resource_id || null,
                    tags: this.state.tags
                };

                if(this.state._id) {
                    toSend._id = this.state._id;
                    socket.send('updateQuestion', toSend, callback);
                } else {
                    socket.send('createQuestion', toSend, callback);
                }
            }
        }

        if(!this.state.image_id) {
            if(this.state.image) {
                socket.send('create_resource', this.state.image, sendQuestion);
            } else if(this.props.question.image_id) {
                socket.send('delete_resource', this.props.question.image_id, sendQuestion);
                this.props.deleteResource(this.props.question.image_id);
            } else {
                sendQuestion(null, null);
            }
        } else {
            sendQuestion(null, this.state.image_id);
        }
    }

    changeTag(e) {
        this.setState({ tag: e.target.value });
    }

    addTag() {
        if(this.state.tag) {
            this.setState((prevState) => {
                var tags = prevState.tags.slice();
                tags.push(this.state.tag);
                return { tags: tags, tag: '' };
            });
        }
    }

    removeTag(idx) {
        this.setState((prevState) => {
            var tags = prevState.tags.slice();
            tags.splice(idx, 1);
            return { tags: tags };
        });
    }

    render() {
        return (
            <div id='question-creator'>
                <label id='question-creator-header'>
                    <span id='question-creator-title'>Question: </span>
                    <input id='question-creator-title-field' type='text' value={this.state.title} onChange={this.changeTitle.bind(this)} />
                </label>

                <ol id='question-creator-answer-list' className='question-creator-row'>
                    {this.state.answers.map((answer, idx) => {
                        return (
                            <li key={idx} className='question-creator-answer'>
                                <input
                                    type='text'
                                    value={answer}
                                    size='35'
                                    onChange={this.changeAnswer.bind(this, idx)} />
                                <input
                                    type='radio'
                                    name='correct'
                                    checked={this.state.correct == idx}
                                    onChange={this.correctSelected.bind(this, idx)} />
                                Correct

                                <button className='remove-answer-button' onClick={this.removeAnswer.bind(this, idx)}>&#10006;</button>
                            </li>
                        );
                    })}
                </ol>

                <button className='question-creator-row option-button' onClick={this.addAnswer.bind(this)}>Add answer</button>

                <div className='question-creator-row'>
                    <label className='option-button'>
                        Select file
                        <input type='file' onChange={this.imageSelected.bind(this)} />
                    </label>
                    {this.state.image &&
                        <button className='option-button clear-image-button' onClick={this.clearImage.bind(this)}>Clear image</button>}
                </div>

                {this.state.image &&
                    (<img className='question-creator-row' id='image-input' src={this.state.image} />)}

                <div className='question-creator-row'>
                    <b>Tags:</b>
                    <ol>
                        {this.state.tags.map((tag, idx) => {
                            return (
                                <li key={idx}>
                                    {this.state.tags[idx]}

                                    <button className='remove-tag-button' onClick={this.removeTag.bind(this, idx)}>&#10006;</button>
                                </li>
                                );
                            })
                        }
                    </ol>
                    <input type='text' size='15' value={this.state.tag} onChange={this.changeTag.bind(this)} onKeyPress={(e) => e.key === 'Enter' && this.addTag()} />
                    <button id='add-tag-button' className='option-button' onClick={this.addTag.bind(this)}>Add Tag</button>
                </div>
                <button className='question-creator-row option-button' onClick={this.submitQuestion.bind(this)}>
                    {this.state._id ? 'Update' : 'Submit'}
                </button>
            </div>
        );
    }
}

class QuestionList extends React.Component {
    deleteQuestion(id) {
        this.props.showConfirm({
            type: 'yesno',
            title: 'Are you sure you want to delete this question?',
            onAction: (choice) => {
            if(choice) {
                socket.send('delete_question', id, (err, data) => {
                    if(err) {
                        this.props.showConfirm({
                            type: 'ok',
                            title: err
                        });
                    }
                });
            }
        }});
    }

    onDragStart(id, e) {
        e.dataTransfer.setData('question-id', id);
    }

    render() {
        return (
            <ul id='question-list' className='list'>
                {Object.keys(this.props.questions).map((id) => (
                    <Question
                        key={id}
                        question={this.props.questions[id]}
                        getResource={this.props.getResource}
                        draggable={this.props.creatingQuiz}
                        onDragStart={this.onDragStart.bind(this, id)}
                        initialHideAnswers={true}>

                        <button className='delete-button' onClick={() => this.deleteQuestion(id)}>&#10006;</button>
                        <button className='edit-button' onClick={() => this.props.chooseQuestion(id)}>E</button>
                    </Question>
                ))}
            </ul>
        );
    }
}

class Question extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            image_id: null,
            image: null,
            hideAnswers: false,//true
        };
    }

    loadImage(image_id) {
        if(image_id) {
            if(image_id != this.state.image_id) {
                this.setState({ image_id: image_id });
                this.props.getResource(image_id, (err, resource) => !this.didUnmount && this.setState({ image: resource }));
            }
        } else {
            this.setState({ image_id: null, image: null });
        }
    }

    componentWillMount() {
        this.loadImage(this.props.question.image_id);
    }

    componentWillReceiveProps(nextProps) {
        this.loadImage(nextProps.question.image_id);
    }

    componentWillUnmount() {
        this.didUnmount = true;
    }

    toggleShowAnswers() {
        this.setState({ hideAnswers: !this.state.hideAnswers });
    }

    render() {
        if(!this.props.question) {
            return null;
        }

        return (
            <li data-id={this.props.question._id}
                className={'question' + (this.props.draggable ? ' draggable' : '') + (this.props.draggedOver ? ' drag-over' : '')}
                draggable={this.props.draggable}
                onDragStart={this.props.onDragStart}>
                <div className='question-body' style={this.state.image || this.props.question.image_id ? {width: '70%'} : {}}>
                    <p className='question-title'>{unescapeHTML(this.props.question.title)}</p>
                    {!this.state.hideAnswers &&
                        (<ol className='answer-list'>
                            {this.props.question.answers.map((answer, idx) => (
                                <li key={answer + idx} className='answer'>
                                    <input
                                        type='radio'
                                        value={idx}
                                        readOnly
                                        checked={this.props.question.correct == idx} />
                                    {unescapeHTML(answer)}
                                </li>
                            ))}
                        </ol>)}
                </div>
                {!this.state.hideAnswers &&
                    (this.state.image
                        ? (<img className='question-image' src={this.state.image} />)
                        : this.props.question.image_id && (<p className='question-image'>Loading image</p>))}
                {this.props.children}
                <button className='hide-button' onClick={this.toggleShowAnswers.bind(this)}>{this.state.hideAnswers ? 'Show' : 'Hide'}</button>
            </li>
        );
    }
}

class Hierarchy extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            tags: this.formatTags(props.tags)
        };
    }

    formatTags(tags) {
        return tags.map((tag) => {
            if(typeof tag === 'string') {
                return {
                    name: tag
                }
            } else {
                return {
                    name: tag.name,
                    isOpen: false,
                    children: this.formatTags(tag.children)
                }
            }
        });
    }

    mergeTags(oldTags, newTags) {
        newTags.forEach((newTag) => {
            var idx = oldTags.findIndex((tag) => tag.name == newTag.name);
            if(idx != -1) {
                var oldTag = oldTags[idx];
                newTag.isOpen = oldTag.isOpen;
                if(oldTag.children) {
                    newTag.children = this.mergeTags(oldTag.children, newTag.children);
                }
            }
        });

        return newTags;
    }

    componentWillReceiveProps(nextProps) {
        this.setState({ tags: this.mergeTags(this.state.tags, this.formatTags(nextProps.tags)) })
    }

    recursivelyOpen(treeArray) {
        var listItems = []
        treeArray.map((element, idx) => {
            if(element.children && element.children.length > 0) {
                var curr = [<li className='parent-node tree-node' key={element.name + element.id} onClick={() => this.openParentNode(element)}>{element.name}</li>]
                if (element.isOpen) {
                    curr = curr.concat(this.recursivelyOpen(element.children));
                }
                listItems.push(<ul key={element.name + idx} className='parent-holder'>{curr}</ul>);
            } else {
                listItems.push(<li className='leaf-node tree-node' key={element.name + element.id} onClick={() => this.openLeafNode(element)}>{element.name}</li>);
            }
        });
        return listItems;
    }

    openParentNode(node) {
        node.isOpen = !node.isOpen;
        this.forceUpdate();
    }

    openLeafNode(leaf) {
        /*TODO - use this to display question*/
        console.log("clicked " + leaf.name);
    }

    render() {
        return(
            <ul id='hierarchy-panel'>{this.recursivelyOpen(this.state.tags)}</ul>
        )
    }
}


/*[
    {
        name: "menu1",
        id: 1,
        isOpen: true,
        children: [
            {
                name: "submenu1",
                id: 1,
                isOpen: true,
                children: [
                    {
                        name: "item1-1",
                        id: 1
                    },
                    {
                        name: "item1-2",
                        id: 2
                    }
                ]
            },
            {
                name: "submenu2",
                id: 2,
                isOpen: true,
                children: [
                    {
                        name: "item2-1",
                        id: 1
                    }
                ]
            }
        ]
    },
    {
        name: "menu2",
        isOpen: true,
        children: [
            {
                name: "item3-1",
                id: 1
            }
        ]
    }
]*/
