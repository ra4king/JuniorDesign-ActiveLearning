var chars = {
    '&apos;': '\'',
    '&#39;': '\'',
    '&amp;': '&',
    '&gt;': '>',
    '&lt;': '<',
    '&quot;': '"'
};

var __unescape_regex = new RegExp('(' + Object.keys(chars).join('|') + ')', 'g');

export function unescapeHTML(str) {
    if(str == null)
        return '';

    var newStr;
    while((newStr = decodeURIComponent(str).replace(__unescape_regex, function(match) { return chars[match]; })) != str) {
        str = newStr;
    }

    return str;
};

export function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i].trim();
        if (c.indexOf(nameEQ) == 0) return decodeURIComponent(c.substring(nameEQ.length,c.length));
    }
    return null;
}
