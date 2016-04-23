'use strict';

(function(mashupMobile) {
    var activePanelType;
    var panels;
    var subscriptions = {};

    mashupMobile.init = function init(apps) {
        apps = apps || {};
        panels = createPanels(apps);

        showPanel('center');
    };

    function createPanels(apps) {
        return {
            bottom: createPanel('bottom', apps.bottom),
            center: createPanel('center', apps.center),
            left: createPanel('left', apps.left),
            right: createPanel('right', apps.right),
            top: createPanel('top', apps.top)
        };
    }

    function createPanel(panelType, apps) {
        var activeSet = false;
        var appFrames = [];
        var panel;
        var hammertime;

        if (checkHasApps(apps)) {
            panel = createPanelDOM(panelType);
            appFrames = createAppFrames(apps, panel);

            ensureActiveFrame(appFrames);
            appFrames.forEach(function(appFrame) {
                panel.appendChild(appFrame);
            });

            document.body.appendChild(panel);
            hammertime = hammerifyElement(panel, panelType);

            hammerifyFramesOnLoad(appFrames, panelType);
        }

        return hammertime;
    }

    function checkHasApps(apps) {
        return apps && apps instanceof Array && apps.length > 0;
    }

    function createPanelDOM(panelType) {
        var panel = document.createElement('div');

        panel.classList.add('panel', panelType);

        return panel;
    }

    function createAppFrames(apps) {
        return apps.reduce(function(frames, app) {
            var appFrame = createAppFrame(app);

            frames.push(appFrame);

            return frames;
        }, []);
    }

    function createAppFrame(app) {
        var iframe = document.createElement('iframe');

        iframe.classList.add('app-frame');
        iframe.setAttribute('frameborder', 0);
        iframe.setAttribute('height', '100%');
        iframe.setAttribute('src', app.url);
        iframe.setAttribute('width', '100%');

        if (app.active) {
            iframe.classList.add('active');
        }

        return iframe;
    }

    function ensureActiveFrame(appFrames) {
        if (!checkHasActiveFrame(appFrames)) {
            appFrames[0].classList.add('active');
        }
    }

    function checkHasActiveFrame(frames) {
        return frames.reduce(function(hasActive, frame) {
            if (frame.classList.contains('active')) {
                hasActive = true;
            }

            return hasActive;
        }, false);
    }

    function hammerifyFramesOnLoad(appFrames, panelType) {
        appFrames.forEach(function(appFrame) {
            appFrame.addEventListener('load', function() {
                var appBody = appFrame.contentWindow.document.body;

                hammerifyElement(appBody, panelType);
                appBody.iframe = appFrame;
                appBody.panelType = panelType;
            });
        });
    }

    function hammerifyElement(element, panelType) {
        var hammertime = new Hammer(element, {
            enable: true
        });
        hammertime.on('swipeleft swiperight swipeup swipedown', dragPanel);
        hammertime.get('swipe')
            .set({ direction: getPanelSwipeDirection(panelType) });

        return hammertime;
    }

    function getPanelSwipeDirection(panelType) {
        var directions = {
            bottom: 'DOWN',
            center: 'HORIZONTAL',
            left: 'LEFT',
            right: 'RIGHT',
            top: 'UP'
        };

        return Hammer['DIRECTION_' + directions[panelType]];
    }

    function dragPanel(event) {
        switch (event.type) {
            case 'swipedown':
                selectPanel(event.target, getElementDown);
                break;
            case 'swipeleft':
                selectPanel(event.target, getPreviousElement);
                break;
            case 'swiperight':
                selectPanel(event.target, getNextElement);
                break;
            case 'swipeup':
                selectPanel(event.target, getElementUp);
                break;
        }

        event.preventDefault();
    }

    function selectPanel(currentElement, getPanelType) {
        var currentPanelType = getElementPanelType(currentElement);
        var nextPanelType = getPanelType(currentPanelType);
        var nextPanel = panels[nextPanelType];

        if (nextPanel) {
            updateCenterPanel(nextPanelType);
            hidePanel(currentPanelType);
            showPanel(nextPanelType);
        }
    }

    function getElementPanelType(element) {
        var panel = element;

        if (checkElementIsAppFrame(element)) {
            panel = panels[element.panelType].element;
        }

        return panel.classList[1];
    }

    function checkElementIsAppFrame(element) {
        return !element.classList.contains('panel') && element.panelType;
    }

    function getElementDown(panelType) {
        var panelsUp = {
            bottom: 'center'
        };

        return panelsUp[panelType];
    }

    function getNextElement(panelType) {
        var nextPanels = {
            center: 'left',
            right: 'center'
        };

        return nextPanels[panelType];
    }

    function getPreviousElement(panelType) {
        var previousPanels = {
            center: 'right',
            left: 'center'
        };

        return previousPanels[panelType];
    }

    function getElementUp(panelType) {
        var panelsUp = {
            top: 'center'
        };

        return panelsUp[panelType];
    }

    function hidePanel(panelType) {
        var panel = panels[panelType];
        var element = panel.element;

        element.classList.remove('active');
        panel.set({ active: false });
    }

    function showPanel(panelType) {
        var panel = panels[panelType];
        var element = panel.element;

        element.classList.add('active');
        panel.set({ active: true });
        activePanelType = panelType;
    }

    function updateCenterPanel(panelType) {
        panels.center.element.classList.remove('bottom', 'left', 'right', 'top');
        panels.center.element.classList.add(panelType);
    }

    mashupMobile.bringToFront = function bringToFront(appBody) {
        var panelType = appBody.panelType;
        var panel = panels[panelType].element;
        var frames = Array.from(panel.querySelectorAll('iframe'));

        frames.forEach(function(frame) {
            frame.classList.remove('active');
        });

        frames.forEach(function(frame) {
            if (frame === appBody.iframe) {
                frame.classList.add('active');
            }
        });


        updateCenterPanel(panelType);
        hidePanel(activePanelType);
        showPanel(panelType);
    };

    function hideActivePanel() {

    }

    mashupMobile.messaging = {
        publish: publish,
        subscribe: subscribe
    };

    function publish(intent, dataType, payload) {
        var subscriptionKey = createSubscriptionKey(intent, dataType);
        var subscription = getSubscription(intent, dataType);

        subscription.subscriptions.forEach(function(callback) {
            callback(payload);
        });
        subscription.lastPayload = payload;
    }

    function subscribe(intent, dataType, callback) {
        var subscriptionKey = createSubscriptionKey(intent, dataType);
        var subscription = getSubscription(intent, dataType);

        if (subscription.subscriptions.indexOf(callback) === -1) {
            subscription.subscriptions.push(callback)

            if (subscription.lastPayload !== undefined) {
                callback(subscription.lastPayload);
            }
        }
    }

    function getSubscription(intent, dataType) {
        var subscriptionKey = createSubscriptionKey(intent, dataType);

        subscriptions[subscriptionKey] = subscriptions[subscriptionKey] || { subscriptions: [], lastPayload: undefined };
        return subscriptions[subscriptionKey];
    }

    function createSubscriptionKey(intent, dataType) {
        return intent + ':' + dataType;
    }

})(window.mashupMobile = window.mashupMobile || {});