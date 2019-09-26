/*global document: false */
/*global window: false */

// Mute a singular HTML5 element
function muteMe(elem) {
    "use strict";
    elem.muted = true;
    elem.pause();
}

// Try to mute all video and audio elements on the page
function mutePage() {
    "use strict";
    var elems = document.querySelectorAll("video, audio");
    [].forEach.call(elems, function (elem) { muteMe(elem); });
}

window.onload = function () {
    "use strict";
    mutePage();
};