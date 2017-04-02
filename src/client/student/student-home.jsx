import React from 'react';
import ReactDOM from 'react-dom';
import socket from '../socket.jsx';
import { unescapeHTML } from '../utils.jsx';
import StatisticsPanels from './student-statistics.jsx';

import { Router, Route, IndexRoute, IndexLink, browserHistory } from 'react-router';


export default class HomePanels extends React.Component {
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
            <div id='panels'>
                <QuizPanel
                    showConfirm={this.props.showConfirm}
                    quizzes={this.props.quizzes}
                    chooseQuiz={this.chooseQuiz.bind(this)} />

                <QuestionPanel
                    getResource={this.props.getResource}
                    showConfirm={this.props.showConfirm}
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
            <ol id='quiz-list' className='list'>
                {Object.keys(this.props.quizzes).map((id) => {
                    var quiz = this.props.quizzes[id];
                    var chooseQuizId = this.props.chooseQuiz.bind(null, id);
                    return (
                        <li key={id} className='quiz'>
                            <button className={'quiz-body' + (quiz.is_live ? ' is-live-quiz-body' : '')} onClick={chooseQuizId}>{unescapeHTML(quiz.name)}</button>
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
            <div id='question-panel' className='panel home-panel'>
                <h2 id='quiz-title'>{this.props.quiz ? this.props.quiz.name : 'Quiz'}</h2>
                {this.props.quiz
                    ? (<QuestionList
                            quiz={this.props.quiz}
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
        var submitQuiz = () => {
            socket.send('submitQuiz', { quiz_id: this.props.quiz._id, answers: this.answers }, (err, data) => {
                this.props.showConfirm({
                    type: 'ok',
                    title: err
                        ? 'Failed to submit, please trying again. Error: ' + err
                        : 'Your answers have been submitted.'
                });

                if(!err) {
                    this.props.hideQuiz();
                    this.answers = {};
                    this._id = null;
                }
            });
        }

        if(this.props.quiz.is_live) {
            submitQuiz();
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
                        submitQuiz();
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
                            key={idx}
                            getResource={this.props.getResource}
                            question={question}
                            answerSelected={this.answerSelected.bind(this, question._id )} />)),
                <li key='submit-all' className='submit-all'><button className='submit-all-button' onClick={this.submitClicked.bind(this)}>Submit All</button></li>]}
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
                    <p className='question-title'>{unescapeHTML(this.props.question.title)}</p>
                    <ol className='answer-list'>
                        {this.props.question.answers.map((answer, idx) => (
                            <li key={answer + idx} className='answer'>
                                <input
                                    type='radio'
                                    name={'answers-' + this.props.question._id}
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