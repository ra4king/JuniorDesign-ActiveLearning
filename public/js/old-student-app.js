var questions = {};
var quizzes = {};

var current_quiz_id = null;

var liveState = true;

var get_questions = function(data) {
    questions = data;

    if(current_quiz_id != null) {
        chooseQuiz(current_quiz_id);
    }
}

var get_quizzes = function(data) {
    quizzes = data;
    updateQuizzes();

    if(current_quiz_id != null) {
        if(quizzes[current_quiz_id]) {
            chooseQuiz(current_quiz_id);
        } else {
            $('#choose-quiz-msg').css('display', 'block');
            $('#question-list').css('text-align', 'center').html('');
            $('#quiz-title').html('Quiz');
        }
    }
}

var get_live_question = function(data) {
    if(data) {
        populateLiveQuestion(data);
    } else if(data === null) {
        $('#live-question-msg').css('display', 'block');
        $('#live-question').css('display', 'none');
    }
}

socket.on('login', function(success) {
    if(success) {
        socket.send('get_quizzes', function(err, data) {
            if(!err) {
                get_quizzes(data);
            }
        });
        socket.send('get_questions', function(err, data) {
            if(!err) {
                get_questions(data);
            }
        });
        socket.send('get_live_question', function(err, data) {
            if(!err) {
                get_live_question(data);
            }
        });
    }
});

socket.on('questions', get_questions);

socket.on('quizzes', get_quizzes);

socket.on('live_question', get_live_question);

function toggleLiveQuiz() {
    var e1 = document.getElementById('live-quiz');
    e1.style.display = e1.style.display == 'block' ? 'none' : 'block';
    if(liveState) {
        myBlurFunction(1);
        liveState = false;

        socket.send('live_question', function(err, data) {
            if(!err) {
                get_live_question(data);
            }
        });
    } else {
        myBlurFunction(0);
        liveState = true;
    }
}

var confirmState = true;
function toggleConfirmBox(submitState) {
    var e1 = document.getElementById('confirm-box');
    e1.style.display = e1.style.display == 'block' ? 'none' : 'block';
    if(confirmState) {
        myBlurFunction(1);
        confirmState = false;
        getConfirmMessage();
    } else {
        myBlurFunction(0);
        confirmState = true;
        if (!submitState) {
            toggleConfirmationButtons(false);
        }
    }
}

function getConfirmMessage() {
    if(current_quiz_id != null) {
        var numNulls = 0;
        quizzes[current_quiz_id].questions.forEach(function(question_id) {
            var answer = null;
            var answers_list = document.getElementsByName('answers-' + question_id);
            for(var i = 0; i < answers_list.length; i++) {
                if (answers_list[i].checked) {
                    answer = i;
                    break;
                }
            }
            if (answer == null) {
                numNulls++;
            }
        });
        var numQuestions = quizzes[current_quiz_id].questions.length;
        var numAnswers = numQuestions - numNulls;
        var confirmed = false;
        var confirmMsg = "";
        if (numAnswers < numQuestions) {
            confirmMsg = "Are you sure you want to submit this quiz? You only answered " 
                + numAnswers + " of the " + numQuestions + " questions. All unanswered questions will be marked as incorrect.";
        } else {
            confirmMsg = "Are you sure you want to submit this quiz? Your answers will be recorded.";
        }
        document.getElementById('confirm-msg').innerHTML = confirmMsg;
    }
}

function toggleConfirmationButtons(submitState) {
    document.getElementById('confirm-msg').innerHTML = "Your answers have been submitted.";
    var ok = document.getElementById('ok-button');
    var sub = document.getElementById('submit-confirm');
    var cancel = document.getElementById('cancel-confirm');

    if (submitState) {
        ok.style.display = 'block';
        sub.style.display = 'none';
        cancel.style.display = 'none';
    } else {
        ok.style.display = 'none';
        sub.style.display = 'block';
        cancel.style.display = 'block';
    }
}

function myBlurFunction(state) {
    /* state can be 1 or 0 */
    var containerElement = document.getElementById('main-container');
    var overlayElement = document.getElementById('overlay');

    if (state) {
        overlayElement.style.display = 'block';
        containerElement.setAttribute('class', 'blur');
    } else {
        overlayElement.style.display = 'none';
        containerElement.setAttribute('class', null);
    }
}

function populateLiveQuestion(question) {
    var html = '<div class="question-body"' + (question.image ? '' : ' style="width: 80%"') + '>';
    html += '<p class="question-name"> ' + question.name + '</p>'
    html += '<ol class="answer-list">';
    question.answers.forEach(function(answer, idx) {
        html += '<li id="live-question-' + idx + '" class="answer"><input type="radio" name="live-answers-' + question.id + '">' + answer + '</input></li>';
    });
    html += '</ol>';
    html += '</div>';

    if(question.image) {
        html += '<img class="question-image" src="' + question.image + '" />';
    }

    // var submit_div = document.createElement('div');
    // submit_div.setAttribute('id', 'submit-div-live');
    // submit_div.setAttribute('class', 'submit-div');
    // var submit_button = document.createElement('button');
    // submit_button.setAttribute('id', 'submit-live');
    // submit_button.setAttribute('class', 'submit-button')
    // submit_button.innerHTML += 'Submit';
    // submit_button.setAttribute('onClick', 'checkQuestion("'+question.id+'", \'live-answers-\')'); 
    // submit_div.innerHTML = submit_button.outerHTML;
    // html += submit_div.outerHTML;

    $('#live-question-msg').css('display', 'none');
    $('#live-question').css('display', 'block').css('text-align', 'left').html(html);
}

function submitQuiz() {
    if(current_quiz_id != null) {
        var submission = {
            quiz_id: current_quiz_id,
            answers: {}
        };
        quizzes[current_quiz_id].questions.forEach(function(question_id) {
            var answer = null;
            var answers_list = document.getElementsByName('answers-' + question_id);
            for(var i = 0; i < answers_list.length; i++) {
                if (answers_list[i].checked) {
                    answer = i;
                    break;
                }
            }
            submission.answers[question_id] = answer;
        });
        
        socket.send('submit_quiz', submission, function(err, data) {
            if(err) {
                alert('Failed to submit, please trying again. Error: ' + err);
            } else {
                toggleConfirmationButtons(true);
            }
        });
    }
}
