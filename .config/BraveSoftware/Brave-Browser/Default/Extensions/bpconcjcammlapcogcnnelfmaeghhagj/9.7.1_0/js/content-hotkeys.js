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

if (!window.EXT_HOTKEY_JS_INSERTED) {
    window.EXT_HOTKEY_JS_INSERTED = true;

    try {
        chrome.runtime.sendMessage({operation: 'get_hotkeys'}, function (response) {
            let hotkeys = JSON.parse(response.hotkeys);

            function sendToChrome(type) {
                chrome.runtime.sendMessage({operation: 'activate_hotkey', value: type});
            }

            window.addEventListener('keydown', function (e) {
                const k = e.keyCode;
                if (e.shiftKey && e.ctrlKey) {
                    if (k === +hotkeys.entire) sendToChrome('capture-entire');
                    if (k === +hotkeys.fragment) sendToChrome('capture-fragment');
                    if (k === +hotkeys.selected) sendToChrome('capture-selected');
                    if (k === +hotkeys.scroll) sendToChrome('capture-scroll');
                    if (k === +hotkeys.visible) sendToChrome('capture-visible');
                    if (k === +hotkeys.window) sendToChrome('capture-window');
                }
            }, false);
        });
    } catch (e) {
    }
}

// var event = new KeyboardEvent('keydown', {keyCode: "52", ctrlKey: true, shiftKey: true}); window.dispatchEvent(event);
