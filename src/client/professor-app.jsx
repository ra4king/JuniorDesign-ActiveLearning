window.onload = () => {
    socket.on('login', (success) => {
        if(success) {
            socket.send('get_quizzes', (err, data) => !err && socket.emit('quizzes', data));
            socket.send('get_questions', (err, data) => !err && socket.emit('questions', data));
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
            currentLiveQuiz: null,
        };

        socket.on('login', (success) => {
            if(this.state.currentLiveQuestion != null) {
                socket.send('broadcast_live_question', this.state.currentLiveQuestion);
            }
        });

        socket.on('questions', (data) => this.setState({ questions: data }));
        socket.on('quizzes', (data) => this.setState({ quizzes: data }));
    }

    toggleLiveQuiz() {
        this.setState({ showLiveQuestion: !this.state.showLiveQuestion });
    }

    chooseQuiz(id) {
        console.log('Selected quiz ' + id);
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

                    <QuestionPanel showConfirm={this.showConfirm.bind(this)} questions={this.state.questions} />
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
                <QuizList
                    showConfirm={this.props.showConfirm}
                    quizzes={this.props.quizzes}
                    chooseQuiz={this.props.chooseQuiz} />
            </div>
        );
    }
}

class QuizList extends React.Component {
    deleteQuiz(id) {
        this.props.showConfirm({
            type: 'yesno',
            title: 'Are you sure you want to delete this quiz?',
            onAction: (choice) => {
            if(choice) {
                this.props.showConfirm({
                    type: 'ok',
                    title:'Quiz deleted'
                });
            }
        }})
    }

    presentLive(id) {
        console.log('Clicked presentLive on ' + id);
    }

    render() {
        return (
            <ol id='quiz-list'>
                {Object.keys(this.props.quizzes).map((id) => {
                    var quiz = this.props.quizzes[id];
                    return (
                        <li key={id} className='quiz'>
                            <button className='quiz-body' onClick={() => this.props.chooseQuiz(id)}>{unescapeHTML(quiz.name)}</button>
                            <button className="delete-button" onClick={() => this.deleteQuiz(id)}>&#10006;</button>
                            <button className="live-button" onClick={() => this.presentLive(id)}>L</button>
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
                <QuestionList questions={this.props.questions} />
            </div>
        );
    }
}

class QuestionList extends React.Component {
    render() {
        return (
            <ol id='question-list'>
                {Object.keys(this.props.questions).map((question_id) =>
                    (<Question key={question_id} question={this.props.questions[question_id]} />))}
            </ol>
        );
    }
}

class Question extends React.Component {
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
                                    readOnly={true}
                                    checked={this.props.question.correct == idx} />
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
