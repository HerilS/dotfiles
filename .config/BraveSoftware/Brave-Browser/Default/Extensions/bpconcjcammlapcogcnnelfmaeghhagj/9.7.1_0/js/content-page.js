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

(function () {
    if (window.__nscContentScriptPage) return;
    window.__nscContentScriptPage = true;

    let nsc_page_setting = {
        cancel: false,
        stop: false,
    };

    const enableFixedPosition = (enableFlag, scrolledElement) => {
        if (!actionHideFixedElements) return false;
        if (enableFlag) {
            if (!document.body.classList.contains('nsc_enable_fixed_position')) {
                document.body.classList.add("nsc_enable_fixed_position");
                fixedElements.push({element: document.body, cssText: document.body.style.cssText});

                document.body.style.scrollBehavior = "smooth";
            }
            let node;
            for (node of getNodes()) {
                if (isFly(node)) {
                    if (!node.classList.contains('nsc_enable_fixed_position')) {
                        node.classList.add("nsc_enable_fixed_position");
                        fixedElements.push({element: node, cssText: node.style.cssText});
                    }
                    if (location.host === 'www.lowes.com' || location.host === 'airsset.com' || location.host === 'nimbusweb.me' || scrolledElement) {
                        node.style.cssText = node.style.cssText + "opacity: 0!important; animation: unset!important; transition-duration: 0s!important;";
                    } else {
                        node.style.cssText = node.style.cssText + "position:" + ("fixed" === getStyle(node).position ? "absolute!important" : "relative!important");
                    }
                }
            }
        } else {
            for (let elem of fixedElements) {
                elem.element.classList.remove("nsc_enable_fixed_position");
                elem.element.style.cssText = elem.cssText;
            }
            fixedElements = []
        }
    }

    const disableScroll = () => {
        window.onscroll = (e) => e.stopImmediatePropagation()
        window.onwheel = (e) => e.preventDefault();
        window.ontouchmove = (e) => e.preventDefault();
        document.onkeydown = (e) => {
            const keys = {37: 1, 38: 1, 39: 1, 40: 1};
            if (keys[e.code]) e.preventDefault();
        }
    }

    const enableScroll = () => {
        window.onscroll = null;
        window.onwheel = null;
        window.ontouchmove = null;
        document.onkeydown = null;
    }

    const getStyle = (elem) => {
        const style = document.defaultView.getComputedStyle(elem, "");
        return {
            position: style.getPropertyValue("position"),
            overflow: style.getPropertyValue("overflow"),
            overflowY: style.getPropertyValue("overflow-y"),
            overflowX: style.getPropertyValue("overflow-x"),
            display: style.getPropertyValue("display"),
            visibility: style.getPropertyValue("visibility"),
            opacity: style.getPropertyValue("opacity"),
        }
    }

    const getNodes = () => {
        let node, current, nodes = [];
        for (node = document.createNodeIterator(document.body, NodeFilter.SHOW_ELEMENT, null, false);
             (current = node.nextNode()) !== null;) nodes.push(current)
        return nodes;
    }

    function getRects(elem) {
        const rects = elem.getClientRects();
        return {
            x: rects[0].left,
            y: rects[0].top,
            w: rects[0].width,
            h: rects[0].height
        }
    }

    const getScrollSize = () => {
        const {
            scrollHeight,
            offsetHeight,
            clientHeight,
            scrollWidth,
            offsetWidth,
            clientWidth,
        } = document.documentElement;
        // return {
        //     height: offsetHeight,
        //     width: offsetWidth
        // }
        return {
            height: Math.max(scrollHeight, offsetHeight, clientHeight),
            width: Math.max(scrollWidth, offsetWidth, clientWidth)
        }
    }

    const isScrollable = (elem) => {
        const style = getStyle(elem);
        return (style.overflow === "scroll" || style.overflow === "auto"
            || style.overflowY === "scroll" || style.overflowY === "auto"
            || style.overflowX === "scroll" || style.overflowX === "auto")
            && style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0"
    }

    const isFly = (elem) => {
        const style = getStyle(elem);
        return (style.position === "fixed" || style.position === "sticky")
            && style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0"
    }

    const searchScrolled = () => {
        const scrollSize = getScrollSize();
        const nodes = getNodes();
        for (let node of nodes) {
            if (isScrollable(node) &&
                node.scrollWidth > 0 && node.scrollHeight > 0 &&
                (node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight) && (
                    node.scrollWidth > scrollSize.width && node.scrollHeight > .5 * scrollSize.height ||
                    node.scrollHeight > scrollSize.height && node.scrollWidth > .5 * scrollSize.width ||
                    node.clientWidth > .7 * scrollSize.width && node.clientHeight > .7 * scrollSize.height
                )) {
                return {node: node, rects: getRects(node)}
            }
        }
        return false;
    }

    const sendScreenData = async (data) => {
        console.log('Content page, send data', data)
        return new Promise((resolve) => {
            window.setTimeout(() => {
                chrome.runtime.sendMessage(data, resolve);
            }, window.actionEntirePageScrollDelay);
        });
    }

    let scroll = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        crop: false
    };
    let fragment = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        crop: false
    };

    let actionHideFixedElements = false;
    let fixedElements = [];
    let tik = null;
    let endCapture = function () {
        enableFixedPosition(false);

        window.clearTimeout(tik);
        tik = null;

        beforeClearCapture(scroll.crop, fragment.crop);
        enableScroll();
    };

    function getPositions() {
        afterClearCapture(scroll.crop, fragment.crop);
        disableScroll();

        const scrollSize = getScrollSize();

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        let totalWidth = scrollSize.width;
        let totalHeight = scrollSize.height;
        let arrangements = [];
        let yPos = 0;
        let xPos = 0;

        if (scroll.crop) {
            window.scrollTo(0, scroll.y);
            totalWidth = scroll.width;
            totalHeight = scroll.height;
            yPos = scroll.y + scroll.height;
            while (yPos >= scroll.y) {
                yPos -= windowHeight;
                xPos = scroll.x;
                while (xPos < scroll.x + scroll.width) {
                    arrangements.push({
                        x: xPos,
                        x_crop: scroll.x,
                        x_shift: 0,
                        y: yPos >= scroll.y ? yPos : scroll.y,
                        y_crop: yPos - scroll.y < 0 ? 0 : yPos - scroll.y,
                        y_shift: window.pageYOffset >= scroll.y ? 0 : scroll.y - window.pageYOffset,
                        w: scroll.width,
                        h: scroll.height >= windowHeight ? windowHeight : scroll.height,
                        elem: null
                    });
                    xPos += windowWidth;
                }
            }
        } else if (fragment.crop) {
            let elem = null;
            if (window.captureFragment && window.captureFragment.data.elem) {
                elem = window.captureFragment.data.elem;
                window.captureFragment.data.elem = null;
            } else {
                elem = window.captureFragmentScroll.data.elem;
                window.captureFragmentScroll.data.elem = null;
            }

            totalWidth = fragment.width;

            if (elem.scrollHeight > elem.clientHeight + 20 || location.host === 'mail.google.com') {
                elem.scrollTo(0, 0);
                elem.classList.add("nsc-capture-fragment-scroll-disable");

                totalHeight = elem.scrollHeight;

                for (let y = 0; y <= totalHeight; y += fragment.height) {
                    arrangements.push({
                        x: fragment.x,
                        x_crop: fragment.x,
                        x_shift: 0,
                        y: fragment.y,
                        y_crop: y,
                        y_shift: window.pageYOffset >= fragment.y ? 0 : fragment.y - window.pageYOffset,
                        w: fragment.width,
                        h: fragment.height,
                        elem: {
                            elem: elem,
                            x: 0, y: y
                        }
                    });
                }
            } else {
                window.scrollTo(0, fragment.y);

                totalHeight = fragment.height;

                yPos = fragment.y + fragment.height;
                while (yPos >= fragment.y) {
                    yPos -= windowHeight;
                    xPos = fragment.x;
                    while (xPos < fragment.x + fragment.width) {
                        arrangements.push({
                            x: xPos,
                            x_crop: fragment.x,
                            x_shift: 0,
                            y: yPos >= fragment.y ? yPos : fragment.y,
                            y_crop: yPos - fragment.y < 0 ? 0 : yPos - fragment.y,
                            y_shift: window.pageYOffset >= fragment.y ? 0 : fragment.y - window.pageYOffset,
                            w: fragment.width,
                            h: fragment.height >= windowHeight ? windowHeight : fragment.height,
                            elem: null
                        });
                        xPos += windowWidth;
                    }
                }
            }
        } else {
            async function stepCapture(offsetX, offsetY) {
                const z = window.nimbus_core.is_chrome ? window.devicePixelRatio : 1;
                const scrollSize = getScrollSize();
                const progressX = offsetX + window.innerWidth < scrollSize.width &&
                    (offsetX + window.innerWidth) * z < 32767 &&
                    (offsetY + window.innerHeight) * (offsetX + window.innerWidth) * z < 268435456;
                const progressY = offsetY + window.innerHeight < scrollSize.height - 1 &&
                    (offsetY + window.innerHeight) * z < 32767 &&
                    (offsetY + window.innerHeight) * (offsetX + window.innerWidth) * z < 268435456;

                const scrolledElement = searchScrolled();
                if (scrolledElement) {
                    const classId = '.' + scrolledElement.node.className.split(' ').join('.');
                    addStyleSheet("nsc-disable-scroll-" + classId, `${classId}{scrollbar-width: none !important} ${classId}::-webkit-scrollbar{width: 0 !important; height: 0 !important}`);
                }

                let data = {
                    operation: 'content_capture_area',
                    status: 'progress',
                    x: 0,
                    y: 0,
                    x2: offsetX * z,
                    y2: offsetY * z,
                    w: window.innerWidth * z,
                    h: window.innerHeight * z,
                    pageWidth: scrollSize.width * z,
                    pageHeight: scrollSize.height * z,
                    scrolledElement: false
                };

                if (nsc_page_setting.cancel) {
                    nsc_page_setting.cancel = false;
                    await window.nimbus_core.pageScroll(offsetX, offsetY);
                    data.status = 'cancel';
                } else if (nsc_page_setting.stop) {
                    nsc_page_setting.stop = false;
                    await window.nimbus_core.pageScroll(offsetX, offsetY);
                    data.status = 'finish';
                    data.pageWidth = data.w + data.x2;
                    data.pageHeight = data.h + data.y2;
                } else if (progressX || progressY) {
                    await window.nimbus_core.pageScroll(offsetX, offsetY);
                } else if (scrolledElement) { // TODO: only vertical scroll
                    data.scrolledElement = true;
                    data.pageHeight = (scrolledElement.node.scrollHeight + scrolledElement.rects.y) * z;

                    if (scrolledElement.rects.y > offsetY) { // header
                        data.h = scrolledElement.rects.y;
                        await window.nimbus_core.pageScroll(offsetX, offsetY);
                    }/* else if (scrolledElement.rects.y + scrolledElement.rects.h <= offsetY) { // footer
                        data.y = (scrolledElement.rects.y + scrolledElement.rects.h) * z;
                        data.h = (window.innerHeight - scrolledElement.rects.y + scrolledElement.rects.h) * z;
                        window.nimbus_core.pageScroll(offsetX, offsetY);
                    } */ else { // content
                        data.y = scrolledElement.rects.y * z;
                        data.h = scrolledElement.rects.h * z;

                        await window.nimbus_core.pageScroll(offsetX, offsetY - scrolledElement.rects.y, scrolledElement.node);
                        if (scrolledElement.node.scrollHeight < offsetY + scrolledElement.rects.h) {
                            data.status = 'finish';
                        }
                    }
                } else {
                    await window.nimbus_core.pageScroll(offsetX, offsetY);
                    // console.log(offsetX, window.pageXOffset, offsetY, window.pageYOffset)
                    // data.x = Math.max(0, offsetX - window.pageXOffset);
                    // data.y = Math.max(0, offsetY - window.pageYOffset);
                    data.status = 'finish';
                }
                const clearFixed = async (timeout) => {
                    await window.nimbus_core.timeout(timeout);
                    if (data.scrolledElement) {
                        enableFixedPosition(scrolledElement.node.scrollTop > 0, true);
                    } else {
                        enableFixedPosition(offsetY !== 0);
                    }
                    await window.nimbus_core.timeout(timeout * 2);
                }

                await clearFixed(50)
                await clearFixed(200);
                await sendScreenData(data);

                if (data.status !== 'finish' && data.status !== 'cancel') {
                    if (data.scrolledElement) {
                        if (scrolledElement.rects.y > offsetY) { // start offset
                            offsetY = scrolledElement.rects.y;
                        } else if (scrolledElement.node.scrollHeight >= offsetY + scrolledElement.rects.h) { // content offset
                            offsetY += scrolledElement.rects.h;
                        } else { // finish offset
                            offsetY += scrolledElement.rects.h;
                        }
                    } else if (scrollSize.width > offsetX + window.innerWidth) {
                        offsetX = Math.min(offsetX + window.innerWidth, scrollSize.width - window.innerWidth);
                    } else {
                        offsetX = 0;
                        offsetY = Math.min(offsetY + window.innerHeight, scrollSize.height - window.innerHeight - 1);
                    }
                    return stepCapture(offsetX, offsetY);
                } else {
                    if (scrolledElement) {
                        const classId = '.' + scrolledElement.node.className.split(' ').join('.');
                        removeStyleSheet("nsc-disable-scroll-" + classId);
                    }
                    return endCapture();
                }
            }

            return stepCapture(0, 0,);
        }

        let last_elem, last_elem_overflow;
        let count_parts = arrangements.length;

        (function scrollTo() {
            let next = arrangements.shift();

            let data = {
                operation: 'content_capture',
                scroll_crop: scroll.crop,
                fragment: fragment.crop,
                x: next.x,
                y: next.y,
                x_crop: next.x_crop || 0,
                y_crop: next.y_crop || 0,
                x_shift: next.x_shift || 0,
                y_shift: next.y_shift || 0,
                w: next.w,
                h: next.h,
                totalWidth: totalWidth,
                totalHeight: totalHeight,
                windowWidth: windowWidth,
                windowHeight: windowHeight,
                z: window.nimbus_core.is_chrome ? window.devicePixelRatio : 1,
                count_parts: count_parts
            };

            // console.log(next, data);

            if (next.elem) {
                next.elem.elem.scrollTo({top: next.elem.y});
            } else {
                window.scrollTo(next.x, next.y);
            }

            window.setTimeout(function () {
                enableFixedPosition(true);
                // enableFixedPosition(data.y !== (fragment.crop || scroll.crop ? (fragment.crop ? fragment.y : scroll.y) : 0)); // 15.05.2020 (5)
                window.setTimeout(function () {
                    chrome.runtime.sendMessage(data, function () {
                        if (last_elem) {
                            last_elem.style.overflow = last_elem_overflow;
                            last_elem = last_elem_overflow = null;
                        }

                        if (!arrangements.length) {
                            if (next.elem) next.elem.elem.classList.remove("nsc-capture-fragment-scroll-disable");

                            endCapture();
                        } else {
                            scrollTo()
                        }
                    });
                }, window.actionEntirePageScrollDelay);
            }, 10); // js change css
        })();
    }

    chrome.runtime.onMessage.addListener(function (request, sender, callback) {
        // console.log(request, nsc_page_setting)
        if (request.operation === 'content_scroll_page') {
            scroll.crop = request.scroll_crop;
            fragment.crop = request.fragment;
            actionHideFixedElements = request.hide_fixed_elements;

            if (scroll.crop === true) {
                scroll.x = request.x;
                scroll.y = request.y;
                scroll.width = request.width;
                scroll.height = request.height;
            }
            if (fragment.crop === true) {
                fragment.x = request.x;
                fragment.y = request.y;
                fragment.width = request.width;
                fragment.height = request.height;
            }
            getPositions(callback);
            return true;
        }
        if (request.operation === 'content_stop_capture') {
            nsc_page_setting.stop = true;
        }
    });

    window.onkeydown = (e) => {
        if (e.key !== "Escape") return;
        if (scroll.crop || fragment.crop) endCapture();
        else nsc_page_setting.cancel = true;
    };

    document.oncontextmenu = () => {
        if (scroll.crop || fragment.crop) endCapture();
        else nsc_page_setting.cancel = true;
        return true;
    };
})();
