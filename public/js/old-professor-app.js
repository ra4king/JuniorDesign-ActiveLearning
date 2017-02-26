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
