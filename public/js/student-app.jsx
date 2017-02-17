class QuestionList extends React.Component {
    constructor(props) {
        super(props);

        //this.markAnswer = this.markAnswer.bind(this);
    }

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
                    <p className='question-name'>{question.name}</p>
                    <ol className='answer-list'>
                        {question.answers.map(function(answer, idx) {
                            return (
                                <li key={idx} className='answer'>
                                    <input type='radio' name={'answers-' + this.props.id} /><span dangerouslySetInnerHTML={ {__html: answer} }></span>
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

function renderQuestionList(quiz, parent) {
    ReactDOM.render(<QuestionList quiz={quiz}/>, parent);
}
