'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.unescapeHTML = unescapeHTML;
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
    if (str == null) return '';

    var newStr;
    while ((newStr = decodeURIComponent(str).replace(__unescape_regex, function (match) {
        return chars[match];
    })) != str) {
        str = newStr;
    }

    return str;
};