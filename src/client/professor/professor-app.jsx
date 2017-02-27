var IndexLink = ReactRouter.IndexLink;

window.onload = () => {
    socket.on('login', (success) => {
        if(success) {
            socket.send('get_quizzes', (err, data) => !err && socket.emit('quizzes', data));
            socket.send('get_questions', (err, data) => !err && socket.emit('questions', data));
        }
    });

    var Router = ReactRouter.Router;
    var Route = ReactRouter.Route;
    var IndexRoute = ReactRouter.IndexRoute;
    var browserHistory = ReactRouter.browserHistory;

    ReactDOM.render(
        <Router history={browserHistory}>
            <Route path='/active-learning/' component={App}>
                <IndexRoute component={Panels} page='home' />
                <Route path='/active-learning/statistics' component={StatisticsPanels} page='statistics' />
                <Route path='/active-learning/settings' component={SettingsPanels} page='settings' />
            </Route>
        </Router>,
        document.getElementById('panels'));
}

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            questions: {},
            quizzes: {},
            showConfirm: null,
            currentLiveQuiz: null
        };

        socket.on('login', (user) => {
            if(user) {
                this.setState({ user: user });
            }
        });
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
                    <HeaderPanel user={this.state.user} page={this.state.page} />

                    {React.Children.map(this.props.children, (child) =>
                        React.cloneElement(child, {
                            user: this.state.user,
                            showConfirm: this.showConfirm.bind(this),
                            questions: this.state.questions,
                            quizzes: this.state.quizzes,
                            presentLive: this.presentLive.bind(this)
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
                    <IndexLink to='/active-learning/settings' className='header-nav-link' activeClassName='selected'>Settings</IndexLink>
                    <IndexLink to='/active-learning/statistics' className='header-nav-link' activeClassName='selected'>Statistics</IndexLink>
                    <IndexLink to='/active-learning/' className='header-nav-link' activeClassName='selected'>Home</IndexLink>
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

class Panels extends React.Component {
    render() {
        return (
            <div>
                <QuizPanel
                    showConfirm={this.props.showConfirm}
                    questions={this.props.questions}
                    quizzes={this.props.quizzes}
                    presentLive={this.props.presentLive} />

                <QuestionPanel
                    showConfirm={this.props.showConfirm}
                    questions={this.props.questions} />
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
                <button className='option-button' onClick={() => this.toggleQuizEditor()}>
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
                        Name: <input type='text' id='quiz-name-field' value={this.state.name} onChange={this.onNameChange.bind(this)}/>
                    </div>
                    <div id='submit-quiz'>
                        <button id='submit-quiz-button' onClick={this.submitQuiz.bind(this)}>{this.state.id ? 'Update' : 'Submit'}</button>
                    </div>
                </div>
                <ol id='quiz-question-list' onDrop={this.onDrop.bind(this)} onDragOver={this.onDragOver.bind(this)}>
                    {this.state.questions.length > 0
                        ? [this.state.questions.map((id) => (
                            <Question key={id}
                                question={this.props.questions[id]}
                                draggable
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
            editQuestion: null
        };
    }

    toggleQuestionEditor() {
        this.setState((prevState) =>  {
            return { editQuestion: prevState.editQuestion ? null : {}};
        });
    }

    hideQuestionEditor() {
        this.setState({ editQuestion: null });
    }

    render() {
        return (
            <div id='question-panel'>
                <button className='option-button' onClick={this.toggleQuestionEditor.bind(this)}>
                    {this.state.editQuestion ? 'Cancel' : 'Create Question'}
                </button>

                {this.state.editQuestion
                    ? (<QuestionEditor
                            question={this.state.editQuestion}
                            hideQuestionEditor={this.hideQuestionEditor.bind(this)}
                            showConfirm={this.props.showConfirm} />)
                    : (<QuestionList questions={this.props.questions} showConfirm={this.props.showConfirm} />)
                }
            </div>
        );
    }
}

class QuestionEditor extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            title: props.question.name || '',
            answers: props.question.answers || ['', '', '', ''],
            correct: props.question.correct || null,
            image: props.question.image || null,
        }
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
                    this.setState({ image: image });
                } else {
                    this.props.showConfirm({
                        type: 'ok',
                        title: 'Invalid image file'
                    });
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        } else {
            this.setState({ image: null });
        }
    }

    clearImage() {
        this.setState({ image: null });
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

        socket.send('create_question', {
            name: this.state.title,
            answers: answers,
            correct: String(this.state.correct),
            image: this.state.image || undefined
        }, (err) => {
            if(err) {
                this.props.showConfirm({
                    type: 'ok',
                    title: 'Error submitting question: ' + err
                });
            } else {
                this.props.hideQuestionEditor();
            }
        });
    }

    render() {
        return (
            <div id='question-creator'>
                <label className='question-creator-row'>
                    <span className='question-creator-title'>Question: </span>
                    <input type='text' value={this.state.title} size='75' onChange={this.changeTitle.bind(this)} />
                </label>

                <ol className='answer-list'>
                    {this.state.answers.map((answer, idx) => {
                        return (
                            <li key={idx} className='answer'>
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

                <div className='question-creator-row'>
                    <button onClick={this.addAnswer.bind(this)}>Add answer</button>
                </div>

                <div className='question-creator-row'>
                    <input type='file' onChange={this.imageSelected.bind(this)} />
                    {this.state.image &&
                        <input className='option-button' type='button' value='Clear image' onClick={this.clearImage.bind(this)} />}
                </div>

                {this.state.image &&
                    (<div className='question-creator-row'><img id='image-input' src={this.state.image} /></div>)}

                <div className='question-creator-row'><button className='option-button' onClick={this.submitQuestion.bind(this)}>Submit</button></div>
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
            <ul id='question-list'>
                {Object.keys(this.props.questions).map((id) => (
                    <Question key={id} question={this.props.questions[id]} draggable onDragStart={this.onDragStart.bind(this, id)}>
                        <button className='delete-button' onClick={() => this.deleteQuestion(id)}>&#10006;</button>
                    </Question>
                ))}
            </ul>
        );
    }
}

class Question extends React.Component {
    render() {
        if(!this.props.question) {
            return null;
        }

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
                {this.props.question.image && (<img className='question-image' src={this.props.question.image} />)}
                {this.props.children}
            </li>
        );
    }
}
