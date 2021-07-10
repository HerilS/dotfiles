class nscLogger {
    constructor() {
        this.background = {
            log: '#616161',
            info: '#3E6018',
            change: '#003E59',
            warning: '#732f25',
            error: '#8C0004',
        }

        this.color = {
            log: '#fff',
            info: '#fff',
            change: '#fff',
            warning: '#fff',
            error: '#fff',
        }
    }

    outputToConsole(header, text, background, color) {
        console.log(header, `background: ${background}; color: ${color}`, new Date().toISOString().substring(0, 19).replace('T', ' '), text);
    }

    log(text) {
        this.outputToConsole(`%c LOG: `, text, this.background.log, this.color.log);
    };

    info(text) {
        this.outputToConsole(`%c INFO: `, text, this.background.info, this.color.info);
    };

    // change(text) {
    //     this.outputToConsole(`%c CHANGE: `, text, this.background.change, this.color.change);
    // };

    warning(text) {
        this.outputToConsole(`%c WARNING: `, text, this.background.warning, this.color.warning);
    };

    error(text) {
        this.outputToConsole(`%c ERROR: `, text, this.background.error, this.color.error);
    };
}

const Logger = new nscLogger();

