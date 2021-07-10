/*
 * "This work is created by NimbusWeb and is copyrighted by NimbusWeb. (c) 2017 NimbusWeb.
 * You may not replicate, copy, distribute, or otherwise create derivative works of the copyrighted
 * material without prior written permission from NimbusWeb.
 *
 * Certain parts of this work contain code licensed under the MIT License.
 * https://www.webrtc-experiment.com/licence/ THE SOFTWARE IS PROVIDED "AS IS",
 * WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * */

// var overflow_clear_capture = document.defaultView.getComputedStyle(document.documentElement, "").getPropertyValue("overflow-x");

// let position_body = document.body.style.position;

function addStyleSheet(id, css) {
    if (!document.getElementById(id)) {
        let head = document.head || document.getElementsByTagName('head')[0];
        let style = document.createElement('style');
        style.type = 'text/css';
        style.id = id;
        head.appendChild(style);
        style.appendChild(document.createTextNode(css));
    }
}

function removeStyleSheet(id) {
    let styleSheet = document.getElementById(id);
    styleSheet && styleSheet.parentNode.removeChild(styleSheet);
}

function afterClearCapture(scroll, fragment) {
    // !hidden && (document.documentElement.style.overflow = "hidden");

    // document.body.style.scrollBehavior = "smooth";
    // document.body.style.position = "relative";

    addStyleSheet("nsc-disable-scroll-capture-body", ":root{scrollbar-width: none !important} html::-webkit-scrollbar,body::-webkit-scrollbar{width: 0 !important; height: 0 !important} html,body{overflow: visible;}");
    addStyleSheet("nsc-disable-transition-capture", "*{transition: none !important; transition-delay: 0s !important; animation-duration: 0s !important; animation-delay: 0s !important;}");

    if (location.host === 'docs.google.com' && document.getElementsByClassName('kix-zoomdocumentplugin-outer').length) {
        document.getElementsByClassName('kix-zoomdocumentplugin-outer')[0].parentNode.style.height = document.getElementsByClassName('kix-zoomdocumentplugin-outer')[0].style.height;
        document.getElementsByClassName('kix-document-top-shadow')[0].style.display = 'none'
    }

    if (location.host === 'www.surveymonkey.com') {
        document.body.style.height = 'auto';
    }

    if (location.host === '4pda.ru' && document.querySelectorAll('.fixed-menu').length) {
        document.querySelectorAll('.h-frame')[0].classList.remove('fixed-menu');
    }

    let $vk_layer_wrap = document.querySelectorAll('#wk_layer_wrap');
    let $trello_window = document.querySelectorAll('.window');
    let $trello_board = document.querySelectorAll('#board');

    if (location.host === 'vk.com' && $vk_layer_wrap.length && $vk_layer_wrap[0].style.display === 'block') {
        let scroll_fix = document.querySelectorAll('.scroll_fix');
        scroll_fix.length && (scroll_fix[0].style.cssText += 'display: none !important;');
    }

    if (location.host === 'trello.com') {
        if ($trello_board.length && ($trello_window[0].style.display === 'none' || $trello_window[0].style.display === '')) {
            $trello_board[0].style.cssText += 'position: relative; overflow: visible !important;';
            document.querySelectorAll('.board-wrapper')[0].style.cssText += 'position: static !important;';
            document.querySelectorAll('.board-menu')[0].style.cssText += 'display: none !important;';
            document.getElementById('content').style.cssText += 'overflow: visible !important;';
            document.getElementById('surface').style.cssText += 'height: auto !important;';
            document.body.style.cssText += 'height: auto !important; overflow: visible !important; background: rgb(176, 64, 69) !important;';
        } else if ($trello_board.length && $trello_window[0].style.display === 'block') {
            document.getElementById('surface').style.cssText += 'display: none !important;';
            document.querySelectorAll('.window-overlay')[0].style.cssText += 'position: relative !important;';
            document.body.style.cssText += 'height: auto !important; overflow: auto !important;';
        }
    }

    if (location.host === "twitter.com" && document.querySelectorAll('.permalink-container').length) {
        document.body.style.cssText += 'margin-right: 0 !important; overflow: visible !important; background: rgba(0,0,0,0.55) !important;';
        document.getElementById('doc').style.cssText += 'display: none !important;';
        document.getElementById('permalink-overlay').style.cssText += 'overflow: visible !important; background: none !important; position: absolute !important;';
    }

    if (!scroll && !fragment && location.host === "mail.google.com") {
        document.documentElement.style.overflowY = 'visible';
        document.documentElement.style.height = 'auto';
        document.body.style.overflowY = 'visible!important';
        document.body.style.height = 'auto';
        document.getElementById(":3").style.overflowY = 'visible!important';
        document.getElementById(":3").style.height = 'auto';
    }

    if (location.host === "pre-pg.com") {
        document.getElementById("mainScreenContent").style.overflow = 'visible';
    }

    // if (location.host === "www.facebook.com") {
    //     document.body.style.cssText += 'width: ' + document.body.offsetWidth + 'px;';
    // }
}

function beforeClearCapture(scroll, fragment) {
    // !hidden && (document.documentElement.style.overflow = overflow_clear_capture);
    // document.body.style.scrollBehavior = "auto";
    // document.body.style.position = position_body;

    removeStyleSheet("nsc-disable-scroll-capture-body");
    removeStyleSheet("nsc-disable-transition-capture");

    let $vk_layer_wrap = document.querySelectorAll('#wk_layer_wrap');
    let $trello_window = document.querySelectorAll('.window');
    let $trello_board = document.querySelectorAll('#board');

    if (location.host === 'vk.com' && $vk_layer_wrap.length && $vk_layer_wrap[0].style.display === 'block') {
        let scroll_fix = document.querySelectorAll('.scroll_fix');
        scroll_fix.length && (scroll_fix[0].style.cssText = scroll_fix[0].style.cssText.replace(/display.+?;/, ''));
    }

    if (location.host === 'trello.com') {
        if ($trello_board.length && ($trello_window[0].style.display === 'none' || $trello_window[0].style.display === '')) {
            $trello_board[0].style.cssText = $trello_board[0].style.cssText.replace(/position.+?; overflow.+?;/, '');
            document.querySelectorAll('.board-wrapper')[0].style.cssText = document.querySelectorAll('.board-wrapper')[0].style.cssText.replace(/position.+?;/, '');
            document.querySelectorAll('.board-menu')[0].style.cssText = document.querySelectorAll('.board-menu')[0].style.cssText.replace(/display.+?;/, '');
            document.getElementById('content').style.cssText = document.getElementById('content').style.cssText.replace(/overflow.+?;/, '');
            document.getElementById('surface').style.cssText = document.getElementById('surface').style.cssText.replace(/height.+?;/, '');
            document.body.style.cssText = document.body.style.cssText.replace(/height.+?; overflow.+?; background.+?;/, '');
            document.body.style.cssText += 'background-image: url(https://d2k1ftgv7pobq7.cloudfront.net/images/backgrounds/orange-blur.png);';
        } else if ($trello_board.length && $trello_window[0].style.display == 'block') {
            document.getElementById('surface').style.cssText = document.getElementById('surface').style.cssText.replace(/display.+?;/, '');
            document.querySelectorAll('.window-overlay')[0].style.cssText = document.querySelectorAll('.window-overlay')[0].style.cssText.replace(/position.+?;/, '');
            document.body.style.cssText = document.body.style.cssText.replace(/height.+?; overflow.+?;/, '');
        }
    }

    if (location.host === "twitter.com" && document.querySelectorAll('.permalink-container').length) {
        document.body.style.cssText = document.body.style.cssText.replace(/margin-right.+?; overflow.+?; background.+?;/, '');
        document.getElementById('doc').style.cssText = document.getElementById('doc').style.cssText.replace(/display.+?;/, '');
        document.getElementById('permalink-overlay').style.cssText = document.getElementById('permalink-overlay').style.cssText.replace(/overflow.+?; background.+?; position.+?;/, '');
    }

    if (!scroll && !fragment && location.host === "mail.google.com") {
        document.documentElement.style.overflowY = 'hidden';
        document.documentElement.style.height = '100%';
        document.body.style.overflowY = 'hidden!important';
        document.body.style.height = '100%';
        document.getElementById(":3").style.overflowY = 'scroll';
        document.getElementById(":3").style.height = 'auto';

        // location.reload();
        // var body = document.querySelectorAll('#nimbus_copy_body body')[0].cloneNode(true);
        // document.body.style.cssText = document.body.style.cssText.replace(/height.+?;/, '');
        // document.body.innerHTML = body.innerHTML;
    }

    if (location.host === "pre-pg.com") {
        document.getElementById("mainScreenContent").style.overflow = 'scroll';
    }

    window.dispatchEvent(new Event('resize'));
}
