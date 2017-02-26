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
            showConfirm: null,
            currentLiveQuiz: null
        };

        socket.on('questions', (data) => this.setState({ questions: data }));
        socket.on('quizzes', (data) => this.setState({ quizzes: data }));
    }

    presentLive(quizId) {
        this.setState({ currentLiveQuiz: this.state.quizzes[quizId] });
    }

    hideLiveQuiz() {
        this.setState({ currentLiveQuiz: null });
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
                {(this.state.currentLiveQuiz || this.state.showConfirm)
                    && (<div id='overlay'></div>)}

                {this.state.currentLiveQuiz &&
                    <LiveQuizPanel
                        quiz={this.state.currentLiveQuiz}
                        questions={this.state.questions}
                        hideLiveQuiz={this.hideLiveQuiz.bind(this)} />}

                {this.state.showConfirm &&
                    <ConfirmBox hide={() => this.hideConfirm()} {...this.state.showConfirm} />}

                <div className={(this.state.currentLiveQuiz || this.state.showConfirm) && 'blur'}>
                    <HeaderPanel />

                    <QuizPanel
                        showConfirm={this.showConfirm.bind(this)}
                        questions={this.state.questions}
                        quizzes={this.state.quizzes}
                        presentLive={this.presentLive.bind(this)} />

                    <QuestionPanel
                        showConfirm={this.showConfirm.bind(this)}
                        questions={this.state.questions} />
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
                    <a href="settings" className='header-nav-link'>Settings</a>
                    <a href='statistics' className='header-nav-link'>Statistics</a>
                    <a href='./' className='header-nav-link' id='selected'>Home</a>
                </nav>
            </div>
        );
    }
}

class LiveQuizPanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentLiveQuestion: null,
            onLoginFunc: (success) => {
                if(this.state.currentLiveQuestion != null)
                    socket.send('broadcast_live_question', this.state.currentLiveQuestion)
            }
        };

        socket.on('login', this.state.onLoginFunc);
    }

    componentWillUnmount() {
        socket.remove('login', this.state.onLoginFunc);
        socket.send('end_live_question');
    }

    presentLiveQuestion(id) {
        this.setState({ currentLiveQuestion: id });
        socket.send('broadcast_live_question', id)
    }

    render() {
        return (
            <div id='live-quiz'>
                <ol id='live-questions-list'>
                    {this.props.quiz.questions.map((id) => {
                        return (
                            <Question key={id} question={this.props.questions[id]}>
                                <button
                                    className={'presenting-live-button' +
                                        (id == this.state.currentLiveQuestion
                                            ? ' presenting-live-button-selected' : '')}
                                    onClick={() => this.presentLiveQuestion(id)}>L</button>
                            </Question>
                        )
                    })}
                </ol>
                
                <button onClick={this.props.hideLiveQuiz} className='delete-button'>&#10006;</button>
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
                {this.props.type == 'yesno' ?
                    (<div>
                        <button onClick={() => this.clicked(false)} className='cancel-button'>{this.props.noText || 'No'}</button>
                        <button onClick={() => this.clicked(true)} className='confirm-button'>{this.props.yesText || 'Yes'}</button>
                    </div>) :
                    (<button onClick={() => this.clicked()} id='ok-button'>{this.props.okText || 'Ok'}</button>)}
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

    chooseQuiz(id) {
        this.setState({ editQuiz: this.props.quizzes[id] });
    }

    toggleQuizEditor() {
        this.setState((prevState) => ({editQuiz: prevState.editQuiz ? null : {}}));
    }

    hideQuizEditor() {
        this.setState({ editQuiz: null });
    }

    render() {
        return (
            <div id='quiz-panel'>
                <button className="option-button" onClick={() => this.toggleQuizEditor()}>
                    {this.state.editQuiz ? 'Cancel' : 'Create Quiz'}
                </button>

                {this.state.editQuiz
                    ? (<QuizEditor
                        quiz={this.state.editQuiz}
                        questions={this.props.questions}
                        hideQuizEditor={this.hideQuizEditor.bind(this)}
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

        this.state = {
            id: props.quiz.id,
            name: props.quiz.name || '',
            questions: props.quiz.questions || [],
        };

        this.questionsDOM = {};
    }

    onNameChange(e) {
        this.setState({ name: e.target.value });
    }

    submitQuiz() {
        var callback = (err) => {
            if(err) {
                this.props.showConfirm({
                    type: 'ok',
                    title: err
                });
            } else {
                this.props.hideQuizEditor();
            }
        }

        if(this.state.id) {
            socket.send('update_quiz', { id: this.state.id, name: this.state.name, questions: this.state.questions }, callback);
        } else {
            socket.send('create_quiz', { name: this.state.name, questions: this.state.questions }, callback);
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
        this.setState({ dragOver: null });

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

        if(dragOverId != this.state.dragOver) {
            this.setState({ dragOver: dragOverId });
        }
    }

    render() {
        return (
            <div id="quiz-creator">
                <div id="quiz-creator-header">
                    <div id="quiz-name">
                        Name: <input type="text" id="quiz-name-field" value={this.state.name} onChange={this.onNameChange.bind(this)}/>
                    </div>
                    <div id="submit-quiz">
                        <button id="submit-quiz-button" onClick={this.submitQuiz.bind(this)}>{this.state.id ? 'Update' : 'Submit'}</button>
                    </div>
                </div>
                <ol id="quiz-question-list" onDrop={this.onDrop.bind(this)} onDragOver={this.onDragOver.bind(this)}>
                    {this.state.questions.length > 0
                        ? this.state.questions.map((id) => (
                            <Question key={id}
                                question={this.props.questions[id]}
                                draggable
                                onDragStart={this.onDragStart.bind(this, id)}
                                draggedOver={this.state.dragOver == id}>

                                <button className='delete-button' onClick={() => this.removeQuestion(id)}>&#10006;</button>
                            </Question>))
                        : (<p style={{ textAlign: 'center' }}>Drag questions here!</p>)
                    }
                </ol>
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
                socket.send('delete_quiz', this.props.quiz.id, (err, data) => {
                    this.props.showConfirm({
                        type: 'ok',
                        title: err || 'Quiz deleted'
                    });
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
    render() {
        return (
            <div id='question-panel'>
                <QuestionList questions={this.props.questions} showConfirm={this.props.showConfirm} />
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
                    this.props.showConfirm({
                        type: 'ok',
                        title: err || 'Question deleted'
                    });
                });
            }
        }});
    }

    onDragStart(id, e) {
        e.dataTransfer.setData('question-id', id);
    }

    render() {
        return (
            <ol id='question-list'>
                {Object.keys(this.props.questions).map((id) => (
                    <Question key={id} question={this.props.questions[id]} draggable onDragStart={this.onDragStart.bind(this, id)}>
                        <button className='delete-button' onClick={() => this.deleteQuestion(id)}>&#10006;</button>
                    </Question>
                ))}
            </ol>
        );
    }
}

class Question extends React.Component {
    render() {
        return (
            <li data-id={this.props.question.id}
                className={'question' + (this.props.draggable ? ' draggable' : '') + (this.props.draggedOver ? ' drag-over' : '')}
                draggable={this.props.draggable}
                onDragStart={this.props.onDragStart}>
                <div className='question-body' style={this.props.question.image ? {width: '70%'} : {}}>
                    <p className='question-name'>{unescapeHTML(this.props.question.name)}</p>
                    <ol className='answer-list'>
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
                    </ol>
                </div>
                <img className='question-image' src={this.props.question.image || null} />
                {this.props.children}
            </li>
        );
    }
}
