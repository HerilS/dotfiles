class nscChromeCore {
    constructor() {
        this.log = true;
    }

    async tabRemove(tabId) {
        chrome.tabs.remove(tabId);
    }

    async tabGet(tabId) {
        return new Promise(function (resolve, reject) {
            chrome.tabs.get(tabId, resolve)
        });
    }

    async tabQuery(query) {
        return new Promise(function (resolve, reject) {
            chrome.tabs.query(query, resolve);
        });
    }

    async tabActive() {
        return new Promise(async (resolve, reject) => {
            const [tab] = (await this.tabQuery({active: true, currentWindow: true}));

            if(!tab) return reject('Not search page');
            if (!/^chrome/.test(tab.url) && !/chrome.google.com\/webstore/.test(tab.url)) {
                resolve(tab)
            } else {
                reject('Is chrome page or webstore page')
            }
        });
    }

    async sendTabMessage(tab, data) {
        if (!tab) tab = (await this.tabActive());

        // console.info(`send tab message tab ${tab.id}, title ${tab.title}`, data)
        if (tab) chrome.tabs.sendMessage(tab.id, data, {});
    }

    async sendAllTabMessage(data, notId) {
        let _self = this;

        return new Promise(async function (resolve) {
            const tabs = await _self.tabQuery({});
            // console.info(`send all tab message,  not id ${notId}`, tabs, data)
            for (let tab of tabs) if (+tab.id !== +notId) await _self.sendTabMessage(tab, data);
            resolve(tabs)
        });
    }

    async sendMessage(data) {
        return new Promise(async function (resolve) {
            chrome.runtime.sendMessage(data, resolve);
        });
    }

    async executeScript(file) {
        // console.info(`execute script ${file}`);
        return new Promise(async (resolve, reject) => {
            await this.tabActive().then((tab) => {
                if (/\.js/.test(file)) chrome.tabs.executeScript(tab.id, {file: file}, resolve);
                else chrome.tabs.executeScript(tab.id, {code: file}, resolve);
            }).catch(reject);
        });
    }

    async executeFiles(files) {
        if (!Array.isArray(files)) files = [files];

        return new Promise(async (resolve, reject) => {
            await this.tabActive().then(async (tab) => {
                for (let file of files) {
                    if (/\.css$/.test(file)) {
                        chrome.tabs.insertCSS(tab.id, {file: file});
                    } else {
                        await this.executeScript(file)
                    }
                }
                resolve(tab);
            }).catch(reject);
        });
    };

    async checkContentReady() {
        return new Promise(async (resolve, reject) => {
            await this.executeScript('js/content-check-content-ready.js').catch(reject)
            await this.sendTabMessage(null, {operation: 'nsc_content_check_ready'}).then(resolve).catch(reject)
        });
    }

    async setTimeout(timeout) {
        if (timeout === undefined) timeout = 0;
        return new Promise(function (resolve, reject) {
            window.setTimeout(resolve, timeout)
        });
    };

    async tabCreate(option) {
        return new Promise(function (resolve, reject) {
            chrome.tabs.create(option, resolve);
        });
    };

    async windowCreate(url, param) {
        param = Object.assign({}, {
            type: 'popup',
            left: screen.width / 4,
            top: screen.height / 4,
            width: screen.width / 2,
            height: screen.height / 2,
        }, param)

        return new Promise(function (resolve, reject) {
            // console.log('windows create', url, param)
            chrome.windows.create({
                url: url,
                ...param
            }, resolve);
        });
    };

    async windowRemove(window) {
        return new Promise(function (resolve, reject) {
            // console.log('windows remove', window)
            chrome.windows.remove(window.id, resolve)
        });
    };

    async commandsGetAll() {
        return new Promise((resolve) => {
            chrome.commands.getAll(resolve);
        });
    };

    async storageGet(key) {
        return new Promise((resolve) => {
            chrome.storage.sync.get(key ? [key] : null, (storage) => {
                resolve(key ? storage[key] : storage)
            })
        });
    };

    async storageSet(data) {
        chrome.storage.sync.set(data);
    };

    async onMessage(cb) {
        chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
            await cb(request)/*.then(sendResponse)*/;
            return true;
        });
    };

    async oneMessage(operation) {
        return new Promise(async function (resolve, reject) {
            // let timeout = setTimeout(function () {
            //     reject(false);
            // }, 1000 * 60 * 30); // timeout error 30 min

            function onMessage(request) {
                switch (request.operation) {
                    case operation:
                        // clearInterval(timeout);
                        chrome.runtime.onMessage.removeListener(onMessage);
                        resolve(request);
                        break;
                }
            }

            chrome.runtime.onMessage.addListener(onMessage);

            chrome.runtime.sendMessage({operation: operation + '_is'}, function (request) {
                // clearInterval(timeout);
                chrome.runtime.onMessage.removeListener(onMessage);
                resolve(request)
            });
        });
    };
}

const nscCore = new nscChromeCore();
