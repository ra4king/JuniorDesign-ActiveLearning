import React from 'react';
import ReactDOM from 'react-dom';
import socket from '../socket.jsx';
import { unescapeHTML } from '../utils.jsx';
import StatisticsPanels from './student-statistics.jsx';

import { Router, Route, IndexRoute, IndexLink, browserHistory } from 'react-router';

window.onload = () => {
    ReactDOM.render(
        <Router history={browserHistory}>
            <Route path='/active-learning/' component={App}>
                <IndexRoute component={Panels} />
                <Route path='/active-learning/statistics' component={StatisticsPanels} />
            </Route>
        </Router>,
        document.getElementById('panels'));
}

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            resources: {},
            questions: {},
            quizzes: {},
            showConfirm: null,
            showLiveQuestion: false,
            currentLiveQuestion: null,
        };

        socket.on('login', (user) => {
            if(user) {
                this.setState({ user: user });
            }
        });
        
        socket.on('questions', (questions) => this.setState({ questions: questions }));
        socket.on('quizzes', (quizzes) => this.setState({ quizzes: quizzes }));
        socket.on('live_question', (question) => this.setState({ currentLiveQuestion: question }));

        this.refresh = this.refresh.bind(this);

        if(socket.isLoggedIn()) {
            this.refresh();
        } else {
            socket.on('login', this.refresh);
        }
    }

    refresh() {
        socket.send('get_quizzes', (err, data) => !err && socket.emit('quizzes', data));
        socket.send('get_questions', (err, data) => !err && socket.emit('questions', data));
        socket.send('get_live_question', (err, data) => !err && socket.emit('live_question', data));
    }

    componentWillUnmount() {
        socket.remove('login', this.refresh);
    }

    toggleLiveQuiz() {
        this.setState({ showLiveQuestion: !this.state.showLiveQuestion });

        socket.send('live_question', (err, data) => {
            if(!err) {
                socket.emit('live_question', data);
            } else {
                console.error('Error sending request for live question id: ' + err);
            }
        });
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
                    console.error('Failed to load image for question ' + question_id + ' with resource id ' + resource_id + ': ' + err);
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

    render() {
        return (
            <div>
                {(this.state.showLiveQuestion || this.state.showConfirm) && (<div id='overlay'></div>)}

                {this.state.showLiveQuestion &&
                    <LiveQuizPanel
                        question={this.state.currentLiveQuestion}
                        getResource={this.getResource.bind(this)}
                        toggleLiveQuiz={this.toggleLiveQuiz.bind(this)} />}

                {this.state.showConfirm && <ConfirmBox hideConfirm={() => this.hideConfirm()} {...this.state.showConfirm} />}

                <div className={(this.state.showLiveQuestion || this.state.showConfirm) && 'blur'}>
                    <HeaderPanel user={this.state.user} page={this.state.page} />

                    {React.Children.map(this.props.children, (child) =>
                        React.cloneElement(child, {
                            user: this.state.user,
                            questions: this.state.questions,
                            quizzes: this.state.quizzes,
                            getResource: this.getResource.bind(this),
                            showConfirm: this.showConfirm.bind(this),
                            toggleLiveQuiz: this.toggleLiveQuiz.bind(this)
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
                <nav>
                    <form method='post'>
                        <button className='header-nav-link' formAction='api/logout'>Logout</button>
                    </form>
                    <IndexLink to='/active-learning/statistics' className='header-nav-link' activeClassName='selected'>Statistics</IndexLink>
                    <IndexLink to='/active-learning/' className='header-nav-link' activeClassName='selected'>Home</IndexLink>
                </nav>
            </div>
        );
    }
}

class LiveQuizPanel extends React.Component {
    render() {
        return (
            <div id='live-quiz'>
                {this.props.question
                    ? (<ul id='live-question'><Question question={this.props.question} getResource={this.props.getResource} /></ul>)
                    : (<p id='live-question-msg'>Live question has ended.</p>)}
                <button onClick={this.props.toggleLiveQuiz} className='delete-button'>&#10006;</button>
            </div>
        );
    }
}

class ConfirmBox extends React.Component {
    clicked(value) {
        this.props.hideConfirm();
        this.props.onAction && this.props.onAction(value);
    }

    render() {
        return (
            <div id='confirm-box'>
                <p id='confirm-msg'>{this.props.title}</p>
                {this.props.type == 'yesno' ?
                    (<div>
                        <button
                            onClick={() => this.clicked(false)}
                            className='cancel-button'>{this.props.noText || 'No'}</button>
                        <button
                            onClick={() => this.clicked(true)}
                            className='confirm-button'>{this.props.yesText || 'Yes'}</button>
                    </div>) :
                    (<button onClick={() => this.clicked()} id='ok-button'>{this.props.okText || 'Ok'}</button>)}
            </div>
        );
    }
}

class Panels extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            selectedQuiz: null
        };
    }

    chooseQuiz(id) {
        if(!id || !this.state.selectedQuiz) {
            this.setState({ selectedQuiz: id });
        } else {
            this.props.showConfirm({
                type: 'yesno',
                title: 'Discard current quiz?',
                onAction: ((confirm) => {
                    if(confirm) {
                        this.setState({ selectedQuiz: id });
                    }
                })
            });
        }
    }

    render() {
        return (
            <div>
                <QuizPanel
                    showConfirm={this.props.showConfirm}
                    quizzes={this.props.quizzes}
                    chooseQuiz={this.chooseQuiz.bind(this)}
                    toggleLiveQuiz={this.props.toggleLiveQuiz} />

                <QuestionPanel
                    getResource={this.props.getResource}
                    showConfirm={this.props.showConfirm}
                    hideQuiz={() => this.chooseQuiz(null)}
                    questions={this.props.questions}
                    quiz={this.state.selectedQuiz && this.props.quizzes[this.state.selectedQuiz]} />
            </div>
        );
    }
}

class QuizPanel extends React.Component {
    render() {
        return (
            <div id='quiz-panel'>
                <button className='option-button' onClick={this.props.toggleLiveQuiz}>Live Quiz</button>
                <QuizList quizzes={this.props.quizzes} chooseQuiz={this.props.chooseQuiz} />
            </div>
        );
    }
}

class QuizList extends React.Component {
    render() {
        return (
            <ol className='quiz-list'>
                {Object.keys(this.props.quizzes).map((id) => {
                    var quiz = this.props.quizzes[id];
                    var chooseQuizId = this.props.chooseQuiz.bind(null, id);
                    return (
                        <li key={id} id={'quiz-' + id} className='quiz'>
                            <button className='quiz-body' onClick={chooseQuizId}>{unescapeHTML(quiz.name)}</button>
                        </li>
                    );
                })}
            </ol>
        );
    }
}

class QuestionPanel extends React.Component {
    render() {
        return (
            <div id='question-panel'>
                <h2 id='quiz-title'>{this.props.quiz ? this.props.quiz.name : 'Quiz'}</h2>
                {this.props.quiz
                    ? (<QuestionList
                            quiz={this.props.quiz}
                            questions={this.props.questions}
                            getResource={this.props.getResource}
                            showConfirm={this.props.showConfirm}
                            hideQuiz={this.props.hideQuiz} />)
                    : (<p id='choose-quiz-msg'>Choose a quiz from the left side!</p>)}
            </div>
        );
    }
}

class QuestionList extends React.Component {
    constructor(props) {
        super(props);

        this.answers = {};
    }

    answerSelected(id, value) {
        this.answers[id] = value;
    }

    submitClicked() {
        var title = 'Are you sure you want to submit this quiz?'
        var answersLen = Object.keys(this.answers).length;
        var questionsLen = this.props.quiz.questions.length
        if(answersLen != questionsLen) {
            title += ' You only answered ' + answersLen + ' of the ' + questionsLen + ' questions.';
        }

        this.props.showConfirm({
            type: 'yesno',
            title: title,
            onAction: (confirm) => {
                if(confirm) {
                    socket.send(
                        'submit_quiz',
                        { quiz_id: this.props.quiz.id, answers: this.answers },
                        (err, data) => {
                            this.props.showConfirm({
                                type: 'ok',
                                title: err
                                    ? 'Failed to submit, please trying again. Error: ' + err
                                    : 'Your answers have been submitted.'
                            });

                            this.props.hideQuiz();
                        }
                    );
                }
            }
        });
    }

    render() {
        return (
            <div>
                <ol id='question-list'>
                    {this.props.quiz.questions.map((question_id) =>
                        (<Question
                                key={question_id}
                                question={this.props.questions[question_id]}
                                getResource={this.props.getResource}
                                answerSelected={this.answerSelected.bind(this, question_id)} />))}
                </ol>
                <button id='submit-all' className='submit-all-button' onClick={this.submitClicked.bind(this)}>Submit All</button>
            </div>
        );
    }
}

class Question extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            image: null
        };
    }

    componentWillMount() {
        if(this.props.question.image_id && !this.state.image) {
            this.props.getResource(this.props.question.image_id, (err, resource) => this.setState({ image: resource }));
        }
    }

    answerSelected(e) {
        this.props.answerSelected(e.target.value);
    }

    render() {
        if(!this.props.question) {
            return null;
        }

        return (
            <li className='question'>
                <div className='question-body' style={this.state.image || this.props.question.image_id ? {width: '70%'} : {}}>
                    <p className='question-name'>{unescapeHTML(this.props.question.name)}</p>
                    <ol className='answer-list'>
                        {this.props.question.answers.map((answer, idx) => (
                            <li key={answer + idx} className='answer'>
                                <input
                                    type='radio'
                                    name={'answers-' + this.props.question.id}
                                    value={idx}
                                    onChange={this.answerSelected.bind(this)}/>
                                {unescapeHTML(answer)}
                            </li>
                        ))}
                    </ol>
                </div>
                {this.state.image
                    ? (<img className='question-image' src={this.state.image} />)
                    : this.props.question.image_id && (<p className='question-image'>Loading image</p>)}
            </li>
        );
    }
}
