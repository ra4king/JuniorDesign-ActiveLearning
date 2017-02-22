window.onload = () => {
    socket.on('login', function(success) {
        if(success) {
            socket.send('get_quizzes', function(err, data) {
                if(!err) {
                    socket.emit('quizzes', data);
                }
            });
            socket.send('get_questions', function(err, data) {
                if(!err) {
                    socket.emit('questions', data);
                }
            });
            socket.send('get_live_question', function(err, data) {
                if(!err) {
                    socket.emit('live_question', data);
                }
            });
        }
    });
    
    ReactDOM.render(<Panels />, document.getElementById('panels'));
}

class Panels extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            questions: {},
            quizzes: {},

            selectedQuiz: null,
            showConfirm: null,

            showLiveQuestion: false,
            currentLiveQuestion: null,
        };

        socket.on('questions', (data) => this.setState({ questions: data }));
        socket.on('quizzes', (data) => this.setState({ quizzes: data }));
        socket.on('live_question', (data) => this.setState({ currentLiveQuestion: data }));
    }

    toggleLiveQuiz() {
        this.setState({ showLiveQuestion: !this.state.showLiveQuestion });

        socket.send('live_question', function(err, data, request) {
            if(!err) {
                socket.emit('live_question', data);
            } else {
                console.error('Error sending ' + JSON.stringify(request) + ': ' + err);
            }
        });
    }

    chooseQuiz(id) {
        if(!this.state.selectedQuiz || confirm('Discard current quiz?')) {
            this.setState({ selectedQuiz: id, showConfirm: null });
        }
    }

    confirmSubmit(submission) {
        this.setState({ showConfirm: submission });
    }

    doneSubmit(success) {
        if(success) {
            this.setState({ selectedQuiz: null, showConfirm: null });
        } else {
            this.setState({ showConfirm: null });
        }
    }
    
    render() {
        return (
            <div>
                {(this.state.showLiveQuestion || this.state.showConfirm) && (<div id='overlay'></div>)}

                {this.state.showLiveQuestion &&
                    <LiveQuizPanel
                        question={this.state.currentLiveQuestion}
                        toggleLiveQuiz={this.toggleLiveQuiz.bind(this)} />}

                {this.state.showConfirm &&
                    <ConfirmBox submission={this.state.showConfirm} doneSubmit={this.doneSubmit.bind(this)} />}

                <div className={(this.state.showLiveQuestion || this.state.showConfirm) && 'blur'}>
                    <QuizPanel
                        quizzes={this.state.quizzes}
                        chooseQuiz={this.chooseQuiz.bind(this)}
                        toggleLiveQuiz={this.toggleLiveQuiz.bind(this)} />

                    <QuestionPanel
                        questions={this.state.questions}
                        quiz={this.state.selectedQuiz && this.state.quizzes[this.state.selectedQuiz]}
                        submitQuiz={this.confirmSubmit.bind(this)} />
                </div>
            </div>
        );
    }
}

class LiveQuizPanel extends React.Component {
    render() {
        return (
            <div id='live-quiz'>
                {this.props.question
                    ? (<ul id='live-question'><Question question={this.props.question} /></ul>)
                    : (<p id='live-question-msg'>Live question has ended.</p>)}
                <button onClick={this.props.toggleLiveQuiz} className='delete-button'>&#10006;</button>
            </div>
        );
    }
}

class ConfirmBox extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isSubmitting: false,
            doneSubmitting: false
        };
    }

    cancelSubmit() {
        if(!this.state.isSubmitting) {
            this.props.doneSubmit(false);
        }
    }

    submitQuiz() {
        if(!this.state.isSubmitting) {
            this.setState({ isSubmitting: true });

            console.log(this.props.submission);

            socket.send('submit_quiz', this.props.submission, (err, data, request) => {
                this.setState({ isSubmitting: false });

                if(err) {
                    alert('Failed to submit, please trying again. Error: ' + err);
                } else {
                    this.setState({ doneSubmitting: true });
                }
            });
        }
    }

    doneSubmitting() {
        this.props.doneSubmit(true);
    }

    render() {
        return (
            <div id='confirm-box'>
                {this.state.doneSubmitting
                    ? (<div>
                            <p id='confirm-msg'>Your answers have been submitted.</p>
                            <button onClick={this.doneSubmitting.bind(this)} id='ok-button'>OK</button>
                        </div>)
                    : (<div>
                            <p id='confirm-msg'>Are you sure you want to submit this quiz?</p>
                            <button
                                onClick={!this.state.isSubmitting && this.cancelSubmit.bind(this)}
                                className='cancel-button'>Cancel</button>
                            <button
                                onClick={!this.state.isSubmitting && this.submitQuiz.bind(this)}
                                className='submit-confirm-button'>Submit</button>
                        </div>)}
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
            <ol id='quiz-list'>
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
                    ? (<QuestionList quiz={this.props.quiz} questions={this.props.questions} submitQuiz={this.props.submitQuiz} />)
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
        this.props.submitQuiz({
            quiz_id: this.props.quiz.id,
            answers: this.answers
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
                                answerSelected={this.answerSelected.bind(this, question_id)} />))}
                </ol>
                <button id='submit-all' className='submit-all-button' onClick={this.submitClicked.bind(this)}>Submit All</button>
            </div>
        );
    }
}

class Question extends React.Component {
    answerSelected(e) {
        this.props.answerSelected(e.target.value);
    }

    render() {
        return (
            <li className='question'>
                <div className='question-body' style={this.props.question.image ? {width: '70%'} : {}}>
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
                <img className='question-image' src={this.props.question.image || null} />
            </li>
        );
    }
}
