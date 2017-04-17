import React from 'react';
import ReactDOM from 'react-dom';
import socket from '../socket.jsx';
import StatisticsPanels from './student-statistics.jsx';

import { Router, Route, IndexRoute, IndexLink, browserHistory } from 'react-router';


export default class HomePanels extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedQuiz: null,
            showDiscardConfirm: false,
        };
    }

    chooseQuiz(id) {
        if(id == this.state.selectedQuiz)
            return;

        if(!id || !this.state.selectedQuiz || !this.state.showDiscardConfirm) {
            this.setState({ selectedQuiz: id, showDiscardConfirm: false });
        } else if(this.state.showDiscardConfirm) {
            this.props.showConfirm({
                type: 'yesno',
                title: 'Discard current quiz?',
                onAction: ((confirm) => {
                    if(confirm) {
                        this.setState({ selectedQuiz: id, showDiscardConfirm: false });
                    }
                })
            });
        }
    }

    render() {
        return (
            <div id='panels'>
                <QuizPanel
                    showConfirm={this.props.showConfirm}
                    quizzes={this.props.quizzes}
                    chooseQuiz={this.chooseQuiz.bind(this)} />

                <QuestionPanel
                    getResource={this.props.getResource}
                    showConfirm={this.props.showConfirm}
                    showDiscardConfirm={() => this.setState({ showDiscardConfirm: true })}
                    hideQuiz={() => this.chooseQuiz(null)}
                    quiz={this.state.selectedQuiz && this.props.quizzes[this.state.selectedQuiz]} />
            </div>
        );
    }
}

class QuizPanel extends React.Component {
    render() {
        return (
            <div id='quiz-panel' className='panel home-panel'>
                <h2 id='quizzes-title'>Quizzes</h2>
                <QuizList quizzes={this.props.quizzes} chooseQuiz={this.props.chooseQuiz} />
            </div>
        );
    }
}

class QuizList extends React.Component {
    render() {
        return (
            <div id='lists' className='list'>
                <p>Live quizzes</p>
                <ol className='quiz-list'>
                    {Object.keys(this.props.quizzes)
                        .filter((id) => {
                            var quiz = this.props.quizzes[id];
                            return quiz.is_live && new Date() >= new Date(quiz.settings.open_date) && new Date() <= new Date(quiz.settings.close_date);
                        })
                        .map((id) => {
                            var quiz = this.props.quizzes[id];
                            var chooseQuizId = this.props.chooseQuiz.bind(null, id);
                            return (
                                <li key={id} className='quiz'>
                                    <button className='quiz-body is-live-quiz-body' onClick={chooseQuizId}>{quiz.name}</button>
                                </li>
                            );
                        })}
                </ol>
                <p>Active quizzes</p>
                <ol className='quiz-list'>
                    {Object.keys(this.props.quizzes)
                        .filter((id) => {
                            var quiz = this.props.quizzes[id];
                            return !quiz.is_live && new Date() >= new Date(quiz.settings.open_date) && new Date() <= new Date(quiz.settings.close_date);
                        })
                        .map((id) => {
                            var quiz = this.props.quizzes[id];
                            var chooseQuizId = this.props.chooseQuiz.bind(null, id);
                            return (
                                <li key={id} className='quiz'>
                                    <button className='quiz-body' onClick={chooseQuizId}>{quiz.name}</button>
                                </li>
                            );
                        })}
                </ol>
                <p>Inactive quizzes</p>
                <ol className='quiz-list'>
                    {Object.keys(this.props.quizzes)
                        .filter((id) => {
                            var quiz = this.props.quizzes[id];
                            return new Date() < new Date(quiz.settings.open_date) || new Date() > new Date(quiz.settings.close_date);
                        })
                        .map((id) => {
                            var quiz = this.props.quizzes[id];
                            var chooseQuizId = this.props.chooseQuiz.bind(null, id);
                            return (
                                <li key={id} className='quiz'>
                                    <button className={'quiz-body' + (quiz.is_live ? ' is-live-quiz-body' : '')} onClick={chooseQuizId}>{quiz.name}</button>
                                </li>
                            );
                        })}
                </ol>
            </div>
        );
    }
}

class QuestionPanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            startQuiz: false
        };
    }

    render() {
        return (
            <div id='question-panel' className='panel home-panel'>
                <h2 id='quiz-title'>{this.props.quiz ? this.props.quiz.name : 'Quiz'}</h2>
                {this.props.quiz
                    ? (this.state.startQuiz
                        ? (<QuestionList
                            quiz={this.props.quiz}
                            getResource={this.props.getResource}
                            showConfirm={this.props.showConfirm}
                            hideQuiz={this.props.hideQuiz} />)
                        : (<QuizInfo
                            quiz={this.props.quiz}
                            startQuiz={() => this.setState({ startQuiz: true }) || this.props.showDiscardConfirm()}
                            showConfirm={this.props.showConfirm}
                            hideQuiz={this.props.hideQuiz} />))
                    : (<p id='choose-quiz-msg'>Choose a quiz from the left side!</p>)}
            </div>
        );
    }
}

class QuizInfo extends React.Component {
    render() {
        return (
            <div id='quiz-info' className='quiz-view-header'>
                {new Date() >= new Date(this.props.quiz.settings.open_date) && new Date() <= new Date(this.props.quiz.settings.close_date)
                    && <button className='option-button' onClick={this.props.startQuiz}>Start Quiz</button>}

                {this.props.quiz.is_live && <p>Live quiz</p>}
                <p>Open date: {this.props.quiz.settings.open_date}</p>
                <p>Close date: {this.props.quiz.settings.close_date}</p>
                <p>Submissions allowed: {this.props.quiz.settings.max_submissions}</p>
                <p><label><input type='checkbox' checked={this.props.quiz.settings.allow_submission_review || false} />Allow submission review</label></p>
                <p><label><input type='checkbox' checked={this.props.quiz.settings.allow_score_review || false} />Allow score review</label></p>
                <p><label><input type='checkbox' checked={this.props.quiz.settings.allow_correct_review || false} />Allow correct review</label></p>
                {this.props.quiz.settings.choose_highest_score ? <p>Highest score chosen</p> : <p>Last score chosen</p>}
            </div>
        );
    }
}

class QuestionList extends React.Component {
    constructor(props) {
        super(props);

        this._id = props.quiz._id;
        this.answers = {};
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.quiz._id != this._id) {
            this.answers = {};
        }
    }

    answerSelected(id, value) {
        this.answers[id] = value;
    }

    submitClicked() {
        var submitQuiz = (hide) => {
            socket.send('submitQuiz', { quiz_id: this.props.quiz._id, answers: this.answers }, (err, data) => {
                this.props.showConfirm({
                    type: 'ok',
                    title: err
                        ? 'Failed to submit, please trying again. Error: ' + err
                        : 'Your answers have been submitted.'
                });

                if(!err && hide) {
                    this.props.hideQuiz();
                    this.answers = {};
                    this._id = null;
                }
            });
        }

        if(this.props.quiz.is_live) {
            submitQuiz(false);
        } else {
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
                        submitQuiz(true);
                    }
                }
            });
        }
    }

    render() {
        return (
            <ol id='question-list' className='list'>
                {[this.props.quiz.questions.map((question, idx) =>
                    (<Question
                            key={question._id}
                            getResource={this.props.getResource}
                            question={question}
                            answerSelected={this.answerSelected.bind(this, question._id )} />)),

                    (<li key='submit-all' className='submit-all'>
                        {new Date() >= new Date(this.props.quiz.settings.open_date) && new Date() <= new Date(this.props.quiz.settings.close_date)
                            && <button className='submit-all-button' onClick={this.submitClicked.bind(this)}>Submit All</button>}
                    </li>)
                ]}
            </ol>
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
                    <p className='question-title'>{this.props.question.title}</p>
                    <ol className='answer-list'>
                        {this.props.question.answers.map((answer, idx) => (
                            <li key={answer + idx} className='answer'>
                                <input
                                    type='radio'
                                    name={'answers-' + this.props.question._id}
                                    value={idx}
                                    onChange={this.answerSelected.bind(this)}/>
                                {answer}
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
