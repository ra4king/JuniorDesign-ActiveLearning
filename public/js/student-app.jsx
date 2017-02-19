class QuestionList extends React.Component {
    render() {
        return (
            <ol>
                {this.props.quiz.questions.map(function(question_id) {
                    return (<Question key={question_id} id={question_id} />);
                }, this)}
            </ol>
        );
    }
}

class Question extends React.Component {
    render() {
        var question = questions[this.props.id];

        return (
            <li id={'question-' + this.props.id} className='question'>
                <div className='question-body' style={question.image ? {width: '70%'} : {}}>
                    <p className='question-name'>{unescapeHTML(question.name)}</p>
                    <ol className='answer-list'>
                        {question.answers.map(function(answer, idx) {
                            return (
                                <li key={idx} className='answer'>
                                    <input type='radio' name={'answers-' + this.props.id} />{unescapeHTML(answer)}
                                </li>
                            );
                        }, this)}
                    </ol>
                </div>
                <img className='question-image' src={question.image || null} />
            </li>
        );
    }
}

function chooseQuiz(id) {
    current_quiz_id = id;

    var quiz = quizzes[id];

    $('#choose-quiz-msg').css('display', 'none');
    $('#question-list').css('text-align', 'left');
    $('#quiz-title').html(quiz.name);
    $('#submit-all').css('display', 'block');

    ReactDOM.render(<QuestionList quiz={quiz}/>, document.getElementById('questions-root'));
}

class QuizList extends React.Component {
    render() {
        return (
            <ol id="quiz-list">
                {Object.keys(quizzes).map(function(id) {
                    var quiz = quizzes[id];
                    var chooseQuizId = chooseQuiz.bind(null, id);
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

function updateQuizzes() {
    ReactDOM.render(<QuizList />, document.getElementById('quizzes-root'));
}
