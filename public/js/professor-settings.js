function createButton(name, functionName, id) {
    parent = document.getElementById(id);
    
    button = document.createElement('BUTTON');
    button.setAttribute('onclick', functionName +'(\'' + name +'\')');
    button.setAttribute('class', 'list-button');
    text = document.createTextNode(unescapeHTML(name));
    button.appendChild(text);

    col = document.createElement('TD');
    col.appendChild(button);

    row = document.createElement('TR');
    row.appendChild(col);
    
    parent.appendChild(row);
}

function displayPermissions(str) {
    document.getElementById('permission-panel').innerHTML = "<p>Clicked " + str + "'s name."
}

$(window).bind('load', function() {
    users.forEach(function(user) {
        createButton(user.username, 'displayPermissions', (user.admin ? 'ta' : 'student') + '-buttons');
    });
});
