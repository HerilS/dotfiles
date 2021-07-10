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
/**
 - author: hasesanches
 - date: 27.09.16
 - http://hase.su
 **/

(function () {
    if (window.nimbusScrollBarWidth) return false;
    window.nimbusScrollBarWidth = true;

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        switch (request.operation) {
            case 'nsc_scrollbar_invisible' :
                addStyleSheet("nsc-disable-scroll-capture-body", "html::-webkit-scrollbar,body::-webkit-scrollbar{width: 0 !important; height: 0 !important}");
                addStyleSheet("nsc-disable-transition-capture", "*{transition: none !important; transition-delay: 0s !important; animation-duration: 0s !important; animation-delay: 0s !important;}");

                window.setTimeout(function () {
                    sendResponse({width: window.innerWidth, height: window.innerHeight, z: window.devicePixelRatio});
                }, 100);

                break;
            case 'nsc_scrollbar_visible' :
                removeStyleSheet("nsc-disable-scroll-capture-body");
                removeStyleSheet("nsc-disable-transition-capture");
                break;
        }

        return true;
    });
})();