(function(mashupUtil, mashupMobile) {
    mashupUtil.bringToFront = function() {
        if (mashupMobile && typeof mashupMobile.bringToFront === 'function') {
            mashupMobile.bringToFront(document.body);
        }
    };

    mashupUtil.messaging = {
        publish: publish,
        subscribe: subscribe
    };

    function publish(intent, datatype, payload) {
        mashupMobile.messaging.publish(intent, datatype, payload);
    }

    function subscribe(intent, datatype, callback) {
        mashupMobile.messaging.subscribe(intent, datatype, callback);
    }
})(window.mashupUtil = {}, window.top.mashupMobile);