function clearQuestionForm() {
    document.getElementById('question').value = "";
    document.getElementById('answer1').value = "";
    document.getElementById('answer2').value = "";
    document.getElementById('answer3').value = "";
    document.getElementById('answer4').value = "";
    document.getElementById('file-input').value = "";
    document.getElementById('image-input').style.display = "none";

    var buttons = document.getElementsByName('correct');
    for (var i = 0; i < buttons.length; ++i) {
        buttons[i].checked = i == 0;
    }
}

function toggleQuestionForm() {
    clearQuestionForm();

    var e1 = document.getElementById('question-creator');
    e1.style.display = e1.style.display == 'block' ? 'none' : 'block';

    var e2 = document.getElementById('question-list');
    e2.style.display = e2.style.display == 'none' ? 'block' : 'none';

    var b = document.getElementById('create-button');
    b.innerHTML = b.innerHTML != 'Create Question' ? 'Create Question' : 'Cancel' ;
}

var current_quiz = { id: null, questions: [] };

function clearQuizForm() {
    current_quiz = { id: null, questions: [] };
    $('#quiz-name-field').val('');
    $('#quiz-question-list').css('text-align', 'center')
                            .html('<p id="drag-questions-msg">Drag questions here!</p>');
}

function toggleQuizForm() {
    clearQuizForm();

    var e1 = $('#quiz-creator');

    var toggle = e1.css('display') == 'none';

    e1.css('display', toggle ? 'block' : 'none');
    $('#quiz-list').css('display', toggle ? 'none' : 'block');

    for(var id in questions) {
        var elem = $('#question-' + id).attr('draggable', toggle);
        if(toggle) {
            elem.addClass('draggable');
        } else {
            elem.removeClass('draggable');
        }
    }

    $('#create-quiz').html(toggle ? 'Cancel' : 'Create Quiz');
    $('#submit-quiz-button').html('Submit');
}

function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            $('#image-input')
                .css('display', 'block')
                .css('max-width', '80%')
                .attr('src', e.target.result);
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        $('#image-input').css('display', 'none');
    }
}

function allowDrop(ev) {
    ev.preventDefault();
    // do something?
}

function drag(ev) {
    if(ev.target.id && ev.target.id.startsWith('question-')) {
        ev.dataTransfer.setData('question-id', ev.target.id);
    }
}

function addQuizQuestion(id, elem) {
    if(current_quiz.questions.indexOf(id) != -1) {
        return;
    }

    current_quiz.questions.push(id);

    $('#drag-questions-msg').css('display', 'none');
    $('#quiz-question-list').css('text-align', 'left');

    var list = document.getElementById('quiz-question-list');
    elem.id = 'quiz-question-' + id;
    elem.setAttribute('draggable', false);
    elem.classList.remove('question', 'draggable');
    elem.classList.add('quiz-question');
    elem.childNodes.forEach(function(child) {
        if(child.classList.contains("delete-button")) {
            child.setAttribute('onclick', 'removeQuizQuestion(\'' + id + '\')');
        }
        if(child.classList.contains("live-button")) {
            child.style.display = 'none';
        }
    });

    list.innerHTML += elem.outerHTML;
}

function removeQuizQuestion(id, confirmed) {
    var list = document.getElementById('quiz-question-list');
    var nodes = list.childNodes;
    var index = -1;
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].id.endsWith(id)) {
            index = i;
        }
    }
    if (index != -1 && (confirmed || confirm('Are you sure you want to remove this question from the quiz?'))) {
        list.removeChild(nodes[index]);

        var idx = current_quiz.questions.indexOf(id);
        current_quiz.questions.splice(idx, 1);

        if(list.childNodes.length == 1) {
            $('#drag-questions-msg').css('display', 'block');
            $('#quiz-question-list').css('text-align', 'center');
        }
    }
}

function drop(ev) {
    ev.preventDefault();
    var id = ev.dataTransfer.getData('question-id');
    var elem = document.getElementById(id).cloneNode(true);

    var question_id = id.substring('question-'.length);
    addQuizQuestion(question_id, elem);
}

var questions = {};
var quizzes = {};

function createQuestionElement(id, in_question_list) {
    var element = document.createElement('li');
    //<li id="" class="question" ondragstart="drag(event)">
    element.setAttribute('id', 'question-' + id);
    element.setAttribute('class', 'question');
    if(in_question_list) {
        var draggable = $('#create-quiz').html() == 'Cancel';

        element.setAttribute('draggable', draggable);
        if(draggable) {
            element.classList.add('draggable');
        }
    }
    element.setAttribute('ondragstart', 'drag(event)');

    var question = questions[id];

    var html = '<div class="question-body"' + (question.image ? '' : ' style="width: 90%"') + '>';
    html += '<p class="question-name"> ' + question.name + '</p>'
    html += '<ol class="answer-list">';
    question.answers.forEach(function(answer, idx) {
        var checked = idx == question.correct ? 'checked' : '';
        html += '<li class="answer"><input type="radio" name="answers-' + id + '" ' + checked + '>' + answer + '</input></li>';
    });
    html += '</ol>';
    html += '</div>';

    if(question.image) {
        html += '<img class="question-image" src="' + question.image + '" />';
    }

    html += '<button class="delete-button" onclick="deleteQuestion(\'' + id + '\')">&#10006;</button>';

    if(in_question_list) {
        html += '<button class="live-button" onclick="presentLiveQuiz([\'' + id + '\']) & presentLiveQuestion(\'' + id + '\')">L</button>';
    }

    element.innerHTML = html;

    return element;
}

function chooseQuiz(id) {
    toggleQuizForm();

    current_quiz_id = id;

    var quiz = quizzes[id];

    $('#submit-quiz-button').html('Update');
    $('#quiz-name-field').val(quiz.name);

    quiz.questions.forEach(function(question_id) {
        addQuizQuestion(question_id, createQuestionElement(question_id, false));
    });
}

function updateQuestions(new_questions) {
    questions = new_questions;

    var html = '';
    for(var id in questions) {
        html += createQuestionElement(id, true).outerHTML;
    };

    if(!html) {
        html = 'Create a question to get started.';
        $('#question-list').css('text-align', 'center');
    } else {
        $('#question-list').css('text-align', 'left');
    }

    $('#question-list').html(html);
}

function updateQuizzes(new_quizzes) {
    quizzes = new_quizzes;

    var html = '';
    for(var id in quizzes) {
        var quiz = quizzes[id];
        html += '<li id="quiz-' + id + '" class="quiz"><button class="quiz-body" onclick="chooseQuiz(\'' + id + '\')">' + quiz.name + '</button><button class="delete-button" onclick="deleteQuiz(\'' + id + '\')">&#10006;</button><button class="live-button" onclick="presentLiveQuiz(quizzes[\'' + id + '\'].questions)">L</button></li>';
    }

    if(!html) {
        html = 'Create a quiz to get started.';
        $('#quiz-list').css('text-align', 'center');
    } else {
        $('#quiz-list').css('text-align', 'left');
    }

    $('#quiz-list').html(html);
}

function createQuestion(name, answers, correct, image) {
    var cleaned_answers = [];
    answers.forEach(function(elem) {
        elem = elem.trim();
        if(elem) {
            cleaned_answers.push(elem);
        }
    });

    if(cleaned_answers.length < 2) {
        alert('Cannot have less than 2 answers.');
        return;
    }

    if(correct >= cleaned_answers.length) {
        alert('Cannot have blank answer as correct answer.');
        return;
    }

    socket.send('create_question', { name: name, answers: cleaned_answers, correct: correct, image: image });
    toggleQuestionForm();
}

function deleteQuestion(id) {
    if (confirm("Are you sure you want to delete this question?")) {
        socket.send('delete_question', id);

        removeQuizQuestion(id, true);
    }
}

function createQuiz() {
    var name = $('#quiz-name-field').val();
    var quiz = { name: name, questions: current_quiz.questions };

    if($('#submit-quiz-button').html() == 'Submit') {
        socket.send('create_quiz', quiz);
    } else {
        quiz.id = current_quiz_id;
        socket.send('update_quiz', quiz);
    }

    toggleQuizForm();
}

function deleteQuiz(id) {
    if (confirm("Are you sure you want to delete this quiz?")) {
        socket.send('delete_quiz', id);
    }
}

function presentLiveQuiz(live_questions) {
    toggleLiveQuiz();
    var list = document.getElementById('live-questions-list');
    list.innerHTML = '';
    live_questions.forEach(function(question_id, index) {
        var element = document.createElement('li');
        element.setAttribute('id', 'live-question-' + question_id);
        element.setAttribute('class', 'question');
        var question = questions[question_id];
        var html = '<div class="question-body"' + (question.image ? '' : ' style="width: 90%"') + '>';
        html += '<p class="question-name"> ' + question.name + '</p>'
        html += '<ol class="answer-list">';
        question.answers.forEach(function(answer, idx) {
            html += '<li id="live-answer-' + question_id + '-' + idx + '" class="answer"><input type="radio" name="answers-' + question_id + '">' + answer + '</input></li>';
        });
        html += '</ol>';
        html += '</div>';
        if(question.image) {
            html += '<img class="question-image" src="' + question.image + '" />';
        }
        html += '<button id="presenting-live-button-' + question_id + '" class="presenting-live-button" onclick="presentLiveQuestion(\'' + question_id + '\')">L</button>';
        element.innerHTML = html;
        list.appendChild(element)
    });
}

function presentLiveQuestion(id) {
    if (curr_live_id != null) {
        $('#presenting-live-button-' + curr_live_id).removeClass('presenting-live-button-selected');
    }

    $('#presenting-live-button-' + id).addClass('presenting-live-button-selected');

    if(curr_live_id != id) {
        socket.send('broadcast_live_question', id);
    }

    curr_live_id = id;
}

var state = true;
function toggleLiveQuiz() {
    curr_live_id = null;
    
    var e1 = document.getElementById('live-quiz');
    e1.style.display = e1.style.display == 'block' ? 'none' : 'block';
    if(state) {
        myBlurFunction(1);
        state = false;
    } else {
        myBlurFunction(0);
        state = true;

        socket.send('end_live_question');
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