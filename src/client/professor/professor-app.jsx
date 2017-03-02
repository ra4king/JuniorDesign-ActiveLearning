import React from 'react';
import ReactDOM from 'react-dom';
import socket from '../socket.jsx';
import { unescapeHTML } from '../utils.jsx';
import StatisticsPanels from './professor-statistics.jsx';
import SettingsPanels from './professor-settings.jsx';

import { Router, Route, IndexRoute, IndexLink, browserHistory } from 'react-router';

window.onload = () => {
    ReactDOM.render(
        <Router history={browserHistory}>
            <Route path='/active-learning/' component={App}>
                <IndexRoute component={Panels} />
                <Route path='/active-learning/statistics' component={StatisticsPanels} />
                <Route path='/active-learning/settings' component={SettingsPanels} />
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
            currentLiveQuiz: null
        };

        socket.on('login', (user) => {
            if(user) {
                this.setState({ user: user });
            }
        });
        socket.on('questions', (data) => this.setState({ questions: data }));
        socket.on('quizzes', (data) => this.setState({ quizzes: data }));

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
    }

    componentWillUnmount() {
        socket.remove('login', this.refresh);
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

                <div className={(this.state.currentLiveQuiz || this.state.showConfirm) && 'blur'}>
                    <HeaderPanel user={this.state.user} page={this.state.page} />

                    {React.Children.map(this.props.children, (child) =>
                        React.cloneElement(child, {
                            user: this.state.user,
                            questions: this.state.questions,
                            quizzes: this.state.quizzes,
                            getResource: this.getResource.bind(this),
                            showConfirm: this.showConfirm.bind(this),
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
                            <Question key={id} question={this.props.questions[id]} getResource={this.props.getResource}>
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
                    questions={this.props.questions}
                    quizzes={this.props.quizzes}
                    getResource={this.props.getResource}
                    showConfirm={this.props.showConfirm}
                    presentLive={this.props.presentLive} />

                <QuestionPanel
                    getResource={this.props.getResource}
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
                                getResource={this.props.getResource}
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
        return ([
            {
                name: "menu1",
                id: 1,
                isOpen: false,
                children: [
                    {
                        name: "submenu1",
                        id: 2,
                        isOpen: false,
                        children: [
                            {
                                name: "item1-1",
                                id: 3
                            },
                            {
                                name: "item1-2",
                                id: 4
                            }
                        ]
                    },
                    {
                        name: "submenu2",
                        id: 5,
                        isOpen: false,
                        children: [
                            {
                                name:"subsubmenu2",
                                id:5.5,
                                isOpen:false,
                                children: [{
                                    name: "item2-1",
                                    id: 6
                                }]
                            }
                        ]
                    }
                ]
            },
            {
                name: "menu2",
                id: 7,
                isOpen: false,
                children: [
                    {
                        name: "item3-1",
                        id: 8
                    }
                ]
            }
        ]);
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
                            getResource={this.props.getResource}
                            hideQuestionEditor={this.hideQuestionEditor.bind(this)}
                            showConfirm={this.props.showConfirm} />)
                    : ( [<div key='hierarcy' id='hierarchy-panel'>
                            <Hierarchy data={this.getFolderHierarchy()} />
                        </div>,
                        <QuestionList key='questions'
                            questions={this.props.questions}
                            getResource={this.props.getResource}
                            chooseQuestion={this.chooseQuestion.bind(this)}
                            showConfirm={this.props.showConfirm} />])
                }
            </div>
        );
    }
}

class QuestionEditor extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            id: props.question.id,
            title: props.question.name || '',
            answers: props.question.answers || ['', '', '', ''],
            correct: props.question.correct || 0,
            image_id: props.question.image_id || null,
            tags: props.question.tags || [],
            tag: ''
        }
    }

    componentWillMount() {
        if(this.state.image_id) {
            this.props.getResource(this.state.image_id, (err, resource) => this.setState({ image: resource }));
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

        var send_question = (err, resource_id) => {
            if(err) {
                this.props.showConfirm({
                    type: 'ok',
                    title: 'Error uploading image: ' + err
                });
            } else {
                if(this.state.id) {
                    socket.send('update_question', {
                        id: this.state.id,
                        name: this.state.title,
                        answers: answers,
                        correct: String(this.state.correct),
                        image_id: resource_id,
                        tags: this.state.tags
                    }, callback);
                } else {
                    socket.send('create_question', {
                        name: this.state.title,
                        answers: answers,
                        correct: String(this.state.correct),
                        image_id: resource_id,
                        tags: this.state.tags
                    }, callback);
                }
            }
        }

        if(this.state.image && !this.state.image_id) {
            socket.send('create_resource', this.state.image, send_question);
        } else {
            send_question(null, this.state.image_id);
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

                <div className='question-creator-row'>
                    <b>Tags:</b>
                    <ol>
                        {this.state.tags.map((tag, indx) => {
                            return (
                                <li key={indx}>
                                    {this.state.tags[indx]}
                                </li>
                                );
                            })
                        }
                    </ol>
                    <input type='text' size='15' value={this.state.tag} onChange={this.changeTag.bind(this)} onKeyPress={(e) => e.key === 'Enter' && this.addTag()} />
                    <button className='add-tag-button' onClick={this.addTag.bind(this)}>Add Tag</button>
                </div>
                <div className='question-creator-row'>
                    <button className='option-button' onClick={this.submitQuestion.bind(this)}>
                        {this.state.id ? 'Update' : 'Submit'}
                    </button>
                </div>
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
                    <Question
                        key={id}
                        question={this.props.questions[id]}
                        getResource={this.props.getResource}
                        draggable
                        onDragStart={this.onDragStart.bind(this, id)}>

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
            image: null
        };
    }

    componentWillMount() {
        if(this.props.question.image_id && !this.state.image) {
            this.props.getResource(this.props.question.image_id, (err, resource) => this.setState({ image: resource }));
        }
    }

    render() {
        if(!this.props.question) {
            return null;
        }

        return (
            <li data-id={this.props.question.id}
                className={'question' + (this.props.draggable ? ' draggable' : '') + (this.props.draggedOver ? ' drag-over' : '')}
                draggable={this.props.draggable}
                onDragStart={this.props.onDragStart}>
                <div className='question-body' style={this.state.image || this.props.question.image_id ? {width: '70%'} : {}}>
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
                {this.state.image
                    ? (<img className='question-image' src={this.state.image} />)
                    : this.props.question.image_id && (<p className='question-image'>Loading image</p>)}
                {this.props.children}
            </li>
        );
    }
}

class Hierarchy extends React.Component {
    recursivelyOpen(that, treeArray) {
        var listItems = []
        treeArray.map(function(element) {
            if(element.children && element.children.length > 0) {
                var curr = [<li className='parent-node tree-node' key={element.name + element.id} onClick={() => that.openParentNode(element)}>{element.name}</li>]
                if (element.isOpen) {
                    curr = curr.concat(that.recursivelyOpen(that, element.children));
                }
                listItems.push(<ul key={element.name + element.id} className='parent-holder'>{curr}</ul>);
            } else {
                listItems.push(<li className='leaf-node tree-node' key={element.name + element.id} onClick={() => that.openLeafNode(element)}>{element.name}</li>);
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
            <ul className="outer-tree"> {this.recursivelyOpen(this, this.props.data)}</ul>
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
