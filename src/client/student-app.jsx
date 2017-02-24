window.onload = () => {
    socket.on('login', (success) => {
        if(success) {
            socket.send('get_quizzes', (err, data) => !err && socket.emit('quizzes', data));
            socket.send('get_questions', (err, data) => !err && socket.emit('questions', data));
            socket.send('get_live_question', (err, data) => !err && socket.emit('live_question', data));
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

        socket.send('live_question', (err, data) => {
            if(!err) {
                socket.emit('live_question', data);
            } else {
                console.error('Error sending when requesting live question id: ' + err);
            }
        });
    }

    chooseQuiz(id) {
        if(!id || !this.state.selectedQuiz || confirm('Discard current quiz?')) {
            this.setState({ selectedQuiz: id });
        }
    }

    showConfirm(options) {
        this.setState({ showConfirm: options });
    }

    hideConfirm() {
        this.setState({ showConfirm: null });
    }
    
    render() {
        return (
            <div>
                {(this.state.showLiveQuestion || this.state.showConfirm) && (<div id='overlay'></div>)}

                {this.state.showLiveQuestion &&
                    <LiveQuizPanel
                        question={this.state.currentLiveQuestion}
                        toggleLiveQuiz={this.toggleLiveQuiz.bind(this)} />}

                {this.state.showConfirm && <ConfirmBox hideConfirm={() => this.hideConfirm()} {...this.state.showConfirm} />}

                <div className={(this.state.showLiveQuestion || this.state.showConfirm) && 'blur'}>
                    <HeaderPanel />

                    <QuizPanel
                        showConfirm={this.showConfirm.bind(this)}
                        quizzes={this.state.quizzes}
                        chooseQuiz={this.chooseQuiz.bind(this)}
                        toggleLiveQuiz={this.toggleLiveQuiz.bind(this)} />

                    <QuestionPanel
                        showConfirm={this.showConfirm.bind(this)}
                        hideQuiz={() => this.chooseQuiz(null)}
                        questions={this.state.questions}
                        quiz={this.state.selectedQuiz && this.state.quizzes[this.state.selectedQuiz]} />
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
                <h2 id='name'>{username}</h2>
                <nav>
                    <form method='post'>
                        <button className='header-nav-link' formAction='api/logout'>Logout</button>
                    </form>
                    <a href='statistics' className='header-nav-link'>Statistics</a>
                    <a href='./' className='header-nav-link' id='selected'>Home</a>
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
                    ? (<ul id='live-question'><Question question={this.props.question} /></ul>)
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
                    ? (<QuestionList
                            quiz={this.props.quiz}
                            questions={this.props.questions}
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
