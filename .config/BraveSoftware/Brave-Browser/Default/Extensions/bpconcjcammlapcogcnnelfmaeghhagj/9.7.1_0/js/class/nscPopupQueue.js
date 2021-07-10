class nscPopupQueue {
    constructor(options) {
        const default_options = {};
        default_options.log = false;

        options = Object.assign({}, default_options, options)

        this.log = options.log;

        this.popupQueue = [];
    }

    addToQueue(popup) {
        if (!popup) return;
        if (!$(popup).hasClass('nsc-popup')) return;

        $(popup).find('.nsc-popup-close button, a').on('click', () => {
            this.stepQueue()
        });
        this.popupQueue.push(popup);
        if (this.popupQueue.length === 1) $(popup).removeClass('nsc-hide');
    };

    stepQueue() {
        if (!this.popupQueue.length) return;
        const [firstPopup, twoPopup, ...popups] = this.popupQueue;

        firstPopup && $(firstPopup).addClass('nsc-hide');
        if (twoPopup) {
            $(twoPopup).removeClass('nsc-hide');
            this.popupQueue = [twoPopup, ...popups];
        } else this.popupQueue = [];
    };
}

const nscPopup = new nscPopupQueue();

