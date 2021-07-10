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

'use strict';

const browserAction = (function () {
    let timer = null;

    function getPath(a) {
        return {
            path: {
                16: "images/icons/16x16" + a,
                24: "images/icons/24x24" + a,
                32: "images/icons/32x32" + a
            }
        }
    }

    function setPopup(popup) {
        chrome.browserAction.setPopup({popup: popup});
    }

    function setIcon(type) {
        chrome.browserAction.setIcon(getPath(type));
    }

    function setUpdate() {
        Logger.info('Extension popup: update');
        setPopup('');
        setIcon('new.png');
    }

    function setDefault() {
        Logger.info('Extension popup: default');
        if (timer) {
            clearInterval(timer);
            timer = null;
        }

        setPopup('popup.html');
        showBadge('');
        setIcon('.png');
    }

    function setRec() {
        Logger.info('Extension popup: rec');
        setIcon('rec.png');
    }

    function setPause() {
        Logger.info('Extension popup: pause');
        setIcon('paused.png');
    }

    function setLoading(i) {
        timer = setTimeout(setLoading.bind(null, !i), 500);

        setIcon('progress' + (i ? '0' : '') + '.png');
    }

    function hidePopup() {
        Logger.info('Extension popup: hide');
        setPopup('');
    }

    function showBadge(t) {
        chrome.browserAction.setBadgeText({text: t.toString()});
        chrome.browserAction.setBadgeBackgroundColor({color: '#000'});
    }

    return {
        setUpdate: setUpdate,
        setDefault: setDefault,
        setRec: setRec,
        setPause: setPause,
        setLoading: setLoading,
        hidePopup: hidePopup
    }
})();