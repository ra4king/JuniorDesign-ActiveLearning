var questions = {};
var quizzes = {};

var current_quiz_id = null;

var socket = null;

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i].trim();
        if (c.indexOf(nameEQ) == 0) return decodeURIComponent(c.substring(nameEQ.length,c.length));
    }
    return null;
}

function connect() {
    var session_id = readCookie('session_id');
    if(session_id == null) {
        console.error('Could not find session_id cookie?!');
        return;
    }

    console.log('Connecting...');
    var s = new WebSocket('wss://www.roiatalla.com/active-learning/api');
    s.onopen = function() {
        socket = s;
        console.log('Connected to server!');
        socket.send(JSON.stringify({
            session_id: session_id
        }));
    };
    s.onmessage = function(msg) {
        var data = JSON.parse(msg.data);

        if(data.login_success) {
            refresh();
        } else if(data.login_success === false) {
            console.error('Failed to authenticate to API.');
        }

        if(data.questions) {
            questions = data.questions;

            if(current_quiz_id != null) {
                chooseQuiz(current_quiz_id);
            }
        }

        if(data.quizzes) {
            quizzes = data.quizzes;
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

        if(data.live_question) {
            populateLiveQuestion(data.live_question);
        } else if(data.live_question === null) {
            $('#live-question-msg').css('display', 'block');
            $('#live-question').css('display', 'none');
        }
        if(data.answer_question) {
            if(data.answer_question.responce) {
                window.alert("Correct answer!");
            } else {
                window.alert("Incorrect");
            }
        }
    };
    s.onclose = function() {
        socket = null;
        console.log('Connection closed.');
        setTimeout(connect, 1000);
    };
}

function isSocketAvailable() {
    if(socket == null) {
        alert('No connection to the server. Attemping to reconnect.');
        return false;
    }

    return true;
}

connect();

function refresh() {
    if(isSocketAvailable()) {
        socket.send(JSON.stringify({ get_quizzes: true }));
        socket.send(JSON.stringify({ get_questions: true }));
        socket.send(JSON.stringify({ get_live_question: true }));
    }
}

var state = true;

function toggleLiveQuiz() {
    var e1 = document.getElementById('live-quiz');
    e1.style.display = e1.style.display == 'block' ? 'none' : 'block';
    if(state) {
        myBlurFunction(1);
        state = false;

        if(isSocketAvailable()) {
            socket.send(JSON.stringify({ get_live_question: true }));
        }
    } else {
        myBlurFunction(0);
        state = true;
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

        if(isSocketAvailable()) {
            socket.send(JSON.stringify({ submit_quiz: submission }));
        }
    }
}
