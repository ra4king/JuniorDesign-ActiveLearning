function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    console.log(tabcontent.length);
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "table";
    evt.currentTarget.className += " active";
}

var chars = {
    '&apos;': '\'',
    '&#39;': '\'',
    '&amp;': '&',
    '&gt;': '>',
    '&lt;': '<',
    '&quot;': '"'
};

var __unescape_regex = new RegExp('(' + Object.keys(chars).join('|') + ')', 'g');

function unescapeHTML(str) {
    if(str == null)
        return '';

    return decodeURIComponent(str).replace(__unescape_regex, function(match) {
        return chars[match];
    });
};
