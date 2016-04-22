'use strict';

(function(mashupMobile) {
    var panels;

    mashupMobile.init = function init() {
        panels = createPanels();
    };

    function createPanels() {
        return {
            center: createPanel('center')
        };
    }

    function createPanel(panelType) {
        var panel = document.createElement('iframe');

        panel.classList.add('panel', panelType);
        panel.setAttribute('frameborder', 0);
        panel.setAttribute('height', '100%');
        panel.setAttribute('src', 'center.html');
        panel.setAttribute('width', '100%');

        document.body.appendChild(panel);
    }

})(window.mashupMobile = window.mashupMobile || {});