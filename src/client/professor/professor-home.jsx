import React from 'react';
import socket from '../socket.jsx';
import Datetime from 'react-datetime';
import moment from 'moment';


export default class HomePanels extends React.Component {
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
                    selectedTerm={this.props.selectedTerm}
                    questions={this.props.questions}
                    quizzes={this.props.quizzes}
                    submissions={this.props.submissions}
                    setCreatingQuiz={this.setCreatingQuiz.bind(this)}
                    getResource={this.props.getResource}
                    showConfirm={this.props.showConfirm} />

                <QuestionPanel
                    user={this.props.user}
                    selectedTerm={this.props.selectedTerm}
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

    componentWillReceiveProps(newProps) {
        this.setState((prevState) => {
            if(prevState.editQuiz && prevState.editQuiz._id) {
                return { editQuiz: newProps.quizzes[prevState.editQuiz._id] || null };
            }
        });
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
                        selectedTerm={this.props.selectedTerm}
                        quiz={this.state.editQuiz}
                        questions={this.props.questions}
                        submissions={this.props.submissions}
                        hideQuizEditor={this.hideQuizEditor.bind(this)}
                        getResource={this.props.getResource}
                        showConfirm={this.props.showConfirm} />)
                    : (<QuizList
                        showConfirm={this.props.showConfirm}
                        quizzes={this.props.quizzes}
                        chooseQuiz={this.chooseQuiz.bind(this)} />)
                }
            </div>
        );
    }
}

class QuizEditor extends React.Component {
    constructor(props) {
        super(props);

        this.state = this.getNewState({}, props);
    }

    componentWillReceiveProps(newProps) {
        this.setState((prevState) => this.getNewState(prevState, newProps));
    }

    getNewState(prevState, newProps) {
        let m1 = moment();
        let m2 = moment();

        let settings = newProps.quiz.settings || prevState.settings || {};

        return {
            _id: newProps.quiz._id,
            name: newProps.quiz.name || prevState.name || '',
            is_published: newProps.quiz.is_published || prevState.is_published || false,
            is_live: newProps.quiz.is_live || prevState.is_live || false,
            questions: newProps.quiz.questions || prevState.questions || [],
            settings: {
                live_question: settings.live_question,
                open_date: new Date(settings.open_date || m1.seconds(0).milliseconds(0).minutes(Math.floor(m1.minutes() / 5) * 5).toDate()),
                close_date: new Date(settings.close_date || m2.seconds(0).milliseconds(0).minutes(Math.floor(m2.minutes() / 5) * 5).days(m2.days() + 7).toDate()), // 1 week
                max_submission: settings.max_submission || 0,
                allow_submission_review: settings.allow_submission_review || false,
                submission_review_after_close: settings.submission_review_after_close !== false,
                allow_score_review: settings.allow_score_review || false,
                score_review_after_close: settings.score_review_after_close !== false,
                allow_correct_review: settings.allow_correct_review || false,
                correct_review_after_close: settings.correct_review_after_close !== false,
                choose_highest_score: settings.choose_highest_score !== false
            }
        };
    }

    onNameChange(e) {
        this.setState({ name: e.target.value });
    }

    onOpenDateChange(moment) {
        if(typeof moment === 'string') {
            var value = new Date(moment);
        } else {
            var value = moment.toDate();
        }

        this.setState((prevState) => {
            var newSettings = {}
            Object.assign(newSettings, prevState.settings);

            newSettings.open_date = value;
            return { settings: newSettings };
        });
    }

    onCloseDateChange(moment) {
        if(typeof moment === 'string') {
            var value = new Date(moment);
        } else {
            var value = moment.toDate();
        }

        this.setState((prevState) => {
            var newSettings = {}
            Object.assign(newSettings, prevState.settings);

            newSettings.close_date = value;
            return { settings: newSettings };
        });
    }

    onMaxSubmissionChange(e) {
        let value = Math.floor(Math.max(e.target.value, 0));

        this.setState((prevState) => {
            var newSettings = {}
            Object.assign(newSettings, prevState.settings);

            newSettings.max_submission = value;
            return { settings: newSettings };
        });
    }

    submitQuiz(publish, confirmed) {
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

        if(!this.state.name.trim()) {
            return this.props.showConfirm({
                type: 'ok',
                title: 'Name is required'
            });
        }

        if(publish && !confirmed) {
            return this.props.showConfirm({
                type: 'yesno',
                title: 'Are you sure you want to publish this quiz?',
                onAction: (confirm) => confirm && this.submitQuiz(true, true)
            });
        }

        if(this.state._id) {
            socket.send('updateQuiz', {
                _id: this.state._id,
                name: this.state.name,
                is_published: publish,
                is_live: this.state.is_live,
                questions: this.state.questions,
                settings: this.state.settings
            }, callback);
        } else {
            socket.send('createQuiz', {
                name: this.state.name,
                is_published: publish,
                is_live: this.state.is_live,
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
                {this.state.presentLive && <div id='overlay'></div>}
                {this.state.presentLive &&
                    <LiveQuizPresenter
                        closePresenter={() => this.setState({ presentLive: false })}
                        quiz={this.props.quiz}
                        questions={this.props.questions}
                        submissions={this.props.submissions}
                        getResource={this.props.getResource}
                        showConfirm={this.props.showConfirm} /> }

                {!this.state.is_published &&
                    <div id='quiz-creator-buttons'>
                        <button id='save-quiz-button' onClick={() => this.submitQuiz(false)}>Save</button>
                        <button id='publish-quiz-buton' onClick={() => this.submitQuiz(true)}>Publish</button>
                    </div>}
                {this.state.is_published && this.state.is_live &&
                    <div id='quiz-creator-buttons'>
                        <button id='present-live-button' onClick={() => this.setState({ presentLive: true })}>Present Live</button>
                    </div>}
                <div id='quiz-creator-header'>
                    <div id='quiz-creator-table'>
                        <div className='quiz-table-row'>
                            <div id='quiz-name' className='quiz-table-cell'>
                                Name: {this.state.is_published
                                            ? this.state.name
                                            : (<input
                                                type='text'
                                                id='quiz-name-field'
                                                value={this.state.name}
                                                onChange={this.onNameChange.bind(this)}/>)}
                            </div>
                        </div>
                        <div className='quiz-table-row'>
                            <div className='quiz-creator-header-entry quiz-table-cell'>Open Date:&nbsp;
                                {this.state.is_published
                                    ? this.state.settings.open_date.toLocaleString()
                                    : <Datetime
                                        value={this.state.settings.open_date}
                                        onChange={this.onOpenDateChange.bind(this)}
                                        isValidDate={(date) => typeof date === 'string' || date.toDate() <= this.state.settings.close_date}
                                        timeConstraints={{ minutes: { step: 5 }}} />}</div>
                            <div className='quiz-creator-header-entry quiz-table-cell'>Close Date:&nbsp;
                                {this.state.is_published
                                    ? this.state.settings.close_date.toLocaleString()
                                    : <Datetime
                                        value={this.state.settings.close_date}
                                        onChange={this.onCloseDateChange.bind(this)}
                                        isValidDate={(date) => typeof date === 'string' || date.toDate() >= this.state.settings.open_date}
                                        timeConstraints={{ minutes: { step: 5 }}} />}</div>
                        </div>
                        <div className='quiz-table-row'>
                            <div className='quiz-table-cell'>
                                <div className='quiz-table-cell-contents'>
                                    <label className="switch">
                                        <input
                                            type='checkbox'
                                            checked={this.state.is_live}
                                            onChange={() => !this.state.is_published && this.setState((prevState) => ({ is_live: !prevState.is_live }))} />
                                        <div className="slider"></div>
                                    </label>
                                    Live Quiz
                                </div>
                            </div>
                            {!this.state.is_live &&
                                <div className='quiz-creator-header-entry quiz-table-cell'>
                                    <div>Submissions allowed: {this.state.is_published
                                                                ? (this.state.settings.max_submission || 'Unlimited')
                                                                : <input
                                                                    type='number'
                                                                    min='0'
                                                                    value={this.state.settings.max_submission}
                                                                    onChange={this.onMaxSubmissionChange.bind(this)} />}</div>
                                    {!this.state.is_published && <div>0 for unlimited</div>}
                                </div>}
                        </div>
                        <div className='quiz-table-row'>
                            <div className='quiz-table-cell'>
                                <input
                                    type='checkbox'
                                    checked={this.state.settings.allow_submission_review}
                                    onChange={(e) => !this.state.is_published && this.setState((prevState) => {
                                        var newSettings = Object.assign({}, prevState.settings);
                                        newSettings.allow_submission_review = !newSettings.allow_submission_review;
                                        return { settings: newSettings };
                                    })}  />
                                Allow submission review
                            </div>
                            <div className='quiz-table-cell'>
                                <input
                                    type='checkbox'
                                    checked={this.state.settings.submission_review_after_close}
                                    onChange={(e) => !this.state.is_published && this.setState((prevState) => {
                                        var newSettings = Object.assign({}, prevState.settings);
                                        newSettings.submission_review_after_close = !newSettings.submission_review_after_close;
                                        return { settings: newSettings };
                                    })}  />
                                Release submissions after close
                            </div>
                        </div>
                        <div className='quiz-table-row'>
                            <div className='quiz-table-cell'>
                                <input
                                    type='checkbox'
                                    checked={this.state.settings.allow_score_review}
                                    onChange={(e) => !this.state.is_published && this.setState((prevState) => {
                                        var newSettings = Object.assign({}, prevState.settings);
                                        newSettings.allow_score_review = !newSettings.allow_score_review;
                                        return { settings: newSettings };
                                    })}  />
                                Allow score review
                            </div>
                            <div className='quiz-table-cell'>
                                <input
                                    type='checkbox'
                                    checked={this.state.settings.score_review_after_close}
                                    onChange={(e) => !this.state.is_published && this.setState((prevState) => {
                                        var newSettings = Object.assign({}, prevState.settings);
                                        newSettings.score_review_after_close = !newSettings.score_review_after_close;
                                        return { settings: newSettings };
                                    })}  />
                                Release scores after close
                            </div>
                        </div>
                        <div className='quiz-table-row'>
                            <div className='quiz-table-cell'>
                                <input
                                    type='checkbox'
                                    checked={this.state.settings.allow_correct_review}
                                    onChange={(e) => !this.state.is_published && this.setState((prevState) => {
                                        var newSettings = Object.assign({}, prevState.settings);
                                        newSettings.allow_correct_review = !newSettings.allow_correct_review;
                                        return { settings: newSettings };
                                    })}  />
                                Allow correct answer review
                            </div>
                            <div className='quiz-table-cell'>
                                <input
                                    type='checkbox'
                                    checked={this.state.settings.correct_review_after_close}
                                    onChange={(e) => !this.state.is_published && this.setState((prevState) => {
                                        var newSettings = Object.assign({}, prevState.settings);
                                        newSettings.correct_review_after_close = !newSettings.correct_review_after_close;
                                        return { settings: newSettings };
                                    })}  />
                                Release correct answers after close
                            </div>
                        </div>
                        <div className='quiz-table-row'>
                            <div className='quiz-table-cell'>
                                <input
                                    type='checkbox'
                                    checked={this.state.settings.choose_highest_score}
                                    onChange={(e) => !this.state.is_published && this.setState((prevState) => {
                                        var newSettings = Object.assign({}, prevState.settings);
                                        newSettings.choose_highest_score = !newSettings.choose_highest_score;
                                        return { settings: newSettings };
                                    })}  />
                                Choose highest score
                            </div>
                        </div>
                    </div>
                </div>
                <ol id='quiz-question-list' onDrop={this.onDrop.bind(this)} onDragOver={this.onDragOver.bind(this)}>
                    {this.state.questions.length > 0
                        ? [this.state.questions.map((id, idx) => (
                            <Question key={id}
                                question={this.props.questions[id]}
                                getResource={this.props.getResource}
                                draggable={!this.state.is_published}
                                onDragStart={this.onDragStart.bind(this, id)}
                                draggedOver={this.state.dragOverId == id}>

                                {!this.state.is_published && <button className='delete-button' onClick={() => this.removeQuestion(id)}>&#10006;</button>}
                            </Question>)),
                            (<li key='hidden' style={{ visibility: 'hidden', height: '100px' }}></li>)]
                        : (<li style={{ listStyleType: 'none', textAlign: 'center' }}>Drag questions here!</li>)}
                </ol>
            </div>
        );
    }
}

class LiveQuizPresenter extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            statistics: this.getStatistics(props.submissions)
        };
    }

    componentWillReceiveProps(newProps) {
        this.setState({ statistics: this.getStatistics(newProps.submissions) }, this.setupChart.bind(this));
    }

    getStatistics(submissions) {
        var statistics = {};
        for(var id in submissions) {
            var submission = submissions[id];

            if(!(submission.username in statistics)) {
                statistics[submission.username] = {};
            }

            statistics[submission.username][submission.quiz_id] = {
                name: submission.quiz_name,
                answers: submission.answers
            };
        }
        return statistics;
    }

    presentLive(id) {
        var idx = this.props.quiz.questions.indexOf(id);
        if(idx != -1) {
            socket.send('updateLiveQuiz', { quiz_id: this.props.quiz._id, question_idx: idx }, (err) => {
                if(err) {
                    console.error('Error when presenting live.');
                    console.error(err);
                }
            });
        }
    }

    closePresenter() {
        socket.send('updateLiveQuiz', { quiz_id: this.props.quiz._id, question_idx: -1 }, (err) => {
            if(err) {
                console.error('Error when ending live quiz.');
                console.error(err);
            }

            this.props.closePresenter();
        });
    }

    setupChart(canvas) {
        this.canvas = this.canvas || canvas;

        var max = 0;
        var title = '';
        var choices = [];
        var selections = [];

        if(this.props.quiz.settings.live_question >= 0) {
            var live_question_id = this.props.quiz.questions[this.props.quiz.settings.live_question];

            var statistics = this.state.statistics;

            for(var username in statistics) {
                for(var quiz_id in statistics[username]) {
                    if(quiz_id == this.props.quiz._id) {
                        statistics[username][quiz_id].answers.forEach((question) => {
                            if(question.question_id == live_question_id) {
                                if(choices.length == 0) {
                                    title = question.title;
                                    choices = Array.from(new Array(question.options || 0)).map((_, idx) => String.fromCharCode('A'.charCodeAt(0) + idx));
                                    selections = Array.from(new Array(question.options || 0)).map(() => 0);
                                }

                                if(question.answer >= 0) {
                                    selections[question.answer]++;

                                    if(selections[question.answer] > max) {
                                        max = selections[question.answer];
                                    }
                                }
                            }
                        });
                    }
                }
            }
        }

        var info = {
            labels: choices,
            datasets: [{
                label: title,
                data: selections,
                backgroundColor: 'rgba(100, 129, 237, 0.5)',
                borderColor: 'rgba(200, 200, 200, 1)',
                borderWidth: 2
            }]
        };


        if(this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(this.canvas, {
            type: 'bar', 
            data: info,
            options: {
                maintainAspectRatio: false,
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero:true,
                            max: max
                        }
                    }]
                }
            }
        });
    }

    render() {
        return (
            <div id='live-quiz-presenter'>
                <button className='delete-button' onClick={this.closePresenter.bind(this)}>&#10006;</button>

                <div id='live-quiz-questions'>
                    <p id='live-quiz-name'>{this.props.quiz.name}</p>
                    <ol id='live-quiz-question-list'>
                        {this.props.quiz.questions.map((id, idx) => (
                            <Question key={id} question={this.props.questions[id]} getResource={this.props.getResource}>
                                <button
                                    className={'live-button' + (this.props.quiz.settings.live_question == idx ? ' is-live' : '')}
                                    onClick={() => this.presentLive(id)}>L</button>
                            </Question>))}
                    </ol>
                </div>

                <div id='live-quiz-stats'>
                    <canvas ref={this.setupChart.bind(this)} id='live-quiz-chart'></canvas>
                </div>
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
                        .filter((id) => this.props.quizzes[id].is_published && this.props.quizzes[id].is_live)
                        .sort((id1, id2) => this.props.quizzes[id1].settings.open_date - this.props.quizzes[id2].settings.open_date)
                        .map((id) => {
                            var quiz = this.props.quizzes[id];
                            return (
                                <Quiz key={id}
                                    quiz={quiz}
                                    chooseQuiz={() => this.props.chooseQuiz(id)}
                                    showConfirm={this.props.showConfirm} />
                            );
                        })}
                </ol>
                <p>Published quizzes</p>
                <ol className='quiz-list'>
                    {Object.keys(this.props.quizzes)
                        .filter((id) => this.props.quizzes[id].is_published && !this.props.quizzes[id].is_live)
                        .sort((id1, id2) => this.props.quizzes[id1].settings.open_date - this.props.quizzes[id2].settings.open_date)
                        .map((id) => {
                            var quiz = this.props.quizzes[id];
                            return (
                                <Quiz key={id}
                                    quiz={quiz}
                                    chooseQuiz={() => this.props.chooseQuiz(id)}
                                    showConfirm={this.props.showConfirm} />
                            );
                        })}
                </ol>
                <p>Unpublished quizzes</p>
                <ol className='quiz-list'>
                    {Object.keys(this.props.quizzes)
                        .filter((id) => !this.props.quizzes[id].is_published)
                        .sort((id1, id2) => this.props.quizzes[id1].settings.open_date - this.props.quizzes[id2].settings.open_date)
                        .map((id) => {
                            var quiz = this.props.quizzes[id];
                            return (
                                <Quiz key={id}
                                    quiz={quiz}
                                    chooseQuiz={() => this.props.chooseQuiz(id)}
                                    showConfirm={this.props.showConfirm} />
                            );
                        })}
                </ol>
            </div>
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
                    socket.send('deleteQuiz', this.props.quiz._id, (err, data) => {
                        if(err) {
                            this.props.showConfirm({
                                type: 'ok',
                                title: String(err)
                            });
                        }
                    });
                }
            }});
    }

    render() {
        return (
            <li className='quiz'>
                <button className={'quiz-body' + (this.props.quiz.is_live ? ' is-live-quiz-body' : '')} onClick={this.props.chooseQuiz}>{this.props.quiz.name}</button>
                <button className='delete-button' onClick={this.deleteQuiz.bind(this)}>&#10006;</button>
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
            searchTag: '',
            shownQuestions: props.questions
        };
    }

    componentWillReceiveProps(newProps) {
        this.updateShownQuestions(newProps.questions);
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

        return [{ name: this.props.user ? this.props.selectedTerm.course.name : '',
                children: tags.sort((a,b) => a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'})) }];
    }

    updateShownQuestions(questions = this.props.questions) {
        var { searchTerm, searchTag } = this.state;

        if(searchTerm || searchTag) {
            var filtered = {};
            for (var key in questions) {
                if(!searchTag || questions[key].tags.indexOf(searchTag) != -1) {
                    var match = !searchTerm || questions[key].title.toLowerCase().indexOf(searchTerm) != -1;

                    if (match) {
                        filtered[key] = questions[key];
                    }
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
                            <input type='text' id='search-input'
                                onChange={(e) => this.setState({ searchTerm: e.target.value.toLowerCase() }, this.updateShownQuestions) } />
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
                            <Hierarchy tags={this.getFolderHierarchy()} searchTag={(tag) => this.setState({ searchTag: tag }, this.updateShownQuestions) } />
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
                socket.send('createResource', this.state.image, sendQuestion);
            } else if(this.props.question.image_id) {
                socket.send('deleteResource', this.props.question.image_id, sendQuestion);
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
                        Select image
                        <input type='file' onChange={this.imageSelected.bind(this)} />
                    </label>
                    {this.state.image &&
                        <button id='clear-image-button' className='option-button' onClick={this.clearImage.bind(this)}>Clear image</button>}
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
                socket.send('deleteQuestion', id, (err, data) => {
                    if(err) {
                        this.props.showConfirm({
                            type: 'ok',
                            title: String(err)
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
            hideAnswers: true
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
                    <p className='question-title'>{this.props.question.title}</p>
                    {!this.state.hideAnswers &&
                        (<ol className='answer-list'>
                            {this.props.question.answers.map((answer, idx) => (
                                <li key={answer + idx} className='answer'>
                                    <input
                                        type='radio'
                                        value={idx}
                                        readOnly
                                        checked={this.props.question.correct == idx} />{answer}</li>
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
            tags: this.formatTags(props.tags),
            selectedTag: '',
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
                    isOpen: true,
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

    recursivelyOpen(treeArray, root) {
        var listItems = []
        treeArray.map((element, idx) => {
            if(root || element.children && element.children.length > 0) {
                var curr = [<li className='parent-node tree-node' key={element.name + element.id} onClick={() => this.openParentNode(element)}>{element.name}</li>]
                if (element.isOpen) {
                    curr = curr.concat(this.recursivelyOpen(element.children));
                }
                listItems.push(<ul key={element.name + idx} className='parent-holder'>{curr}</ul>);
            } else {
                listItems.push(<li
                                className={'leaf-node tree-node' + (this.state.selectedTag == element.name ? ' leaf-node-selected' : '')}
                                key={element.name + element.id}
                                onClick={() => this.openLeafNode(element)}>{element.name}</li>);
            }
        });
        return listItems;
    }

    openParentNode(node) {
        // node.isOpen = !node.isOpen;
        // this.forceUpdate();
    }

    openLeafNode(leaf) {
        this.setState((prevState) => {
            var tag = leaf.name == prevState.selectedTag ? '' : leaf.name;
            this.props.searchTag(tag);
            return { selectedTag: tag };
        });
    }

    render() {
        return(
            <div id='hierarchy-panel'>{this.recursivelyOpen(this.state.tags, true)}</div>
        )
    }
}
