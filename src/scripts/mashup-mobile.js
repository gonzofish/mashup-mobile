'use strict';

(function(mashupMobile) {
    var activePanelType;
    var toolbarApps;
    var panels;
    var subscriptions = {};

    mashupMobile.init = function init(apps, toolbarOrder) {
        var panelContainer;

        apps = apps || {};
        toolbarApps = [];
        toolbarOrder = toolbarOrder || [];

        panelContainer = createPanelContainer();
        panels = createPanels(apps, panelContainer);

        createToolbar(panelContainer, toolbarOrder);
        showPanel('center');
    };

    function createPanelContainer() {
        var panelContainer = document.createElement('div');

        panelContainer.classList.add('panel-container');
        document.body.appendChild(panelContainer);

        return panelContainer;
    }

    function createPanels(apps, panelContainer) {
        return {
            bottom: createPanel('bottom', apps.bottom, panelContainer),
            center: createPanel('center', apps.center, panelContainer),
            left: createPanel('left', apps.left, panelContainer),
            right: createPanel('right', apps.right, panelContainer),
            top: createPanel('top', apps.top, panelContainer)
        };
    }

    function createPanel(panelType, apps, panelContainer) {
        var activeSet = false;
        var appFrames = [];
        var panel;
        var hammertime;

        if (checkHasApps(apps)) {
            panel = createPanelDOM(panelType);
            appFrames = createAppFrames(apps, panel);

            addFramesToPanel(appFrames.frames, panel);
            addAppsToToolbar(appFrames.toolbar);

            panelContainer.appendChild(panel);
            hammertime = hammerifyElement(panel, panelType);

            hammerifyFramesOnLoad(appFrames.frames, panelType);
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

            frames.frames.push(appFrame);
            if (app.name) {
                frames.toolbar.push({
                    name: app.name,
                    frame: appFrame
                });
            }

            return frames;
        }, { frames: [], toolbar: []});
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

        if (app.static) {
            iframe.classList.add('static');
        }

        return iframe;
    }

    function addFramesToPanel(frames, panel) {
        ensureActiveFrame(frames);
        frames.forEach(function(frame) {
            panel.appendChild(frame);
        });
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

    function addAppsToToolbar(appsForToolbar) {
        toolbarApps = toolbarApps.concat(appsForToolbar);
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
        if (!checkCurrentFrameIsStatic()) {
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
        var panel;

        if (checkElementIsAppFrame(element)) {
            panel = panels[element.panelType].element;
        } else if (!checkElementIsPanel(element)) {
            element = getBodyFromChild(element);
            panel = panels[element.panelType].element;
        } else {
            panel = element;
        }

        return panel.classList[1];
    }

    function checkElementIsAppFrame(element) {
        return !checkElementIsPanel(element) && !!element.panelType;
    }

    function checkElementIsPanel(element) {
        return element.classList.contains('panel');
    }

    function getBodyFromChild(element) {
        var appBody = element;
        var panelType;

        while (appBody && appBody.tagName !== 'BODY') {
            appBody = appBody.parentNode;
        }

        return appBody;
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

    function createToolbar(panelContainer, toolbarOrder) {
        var toolbarDOM;

        if (toolbarApps.length > 0) {
            toolbarDOM = generateToolbarDOM(toolbarOrder);
            panelContainer.classList.add('toolbar');
            document.body.insertBefore(toolbarDOM, panelContainer);
        }
    }

    function generateToolbarDOM(toolbarOrder) {
        var toolbar = document.createElement('ul');
        var orderedToolbarApps = sortToolbarApps(toolbarApps, toolbarOrder);

        toolbar.classList.add('toolbar');
        orderedToolbarApps.forEach(function(app) {
            toolbar.appendChild(generateToolbarAppDOM(app));
        });

        return toolbar;
    }

    function sortToolbarApps(apps, order) {
        var toolbarAppsCopy = apps.slice();
        var appsByName = {};
        var orderedApps = [];

        apps.forEach(function(app) {
            appsByName[app.name] = app;
        });

        order.forEach(function(appName) {
            var app = appsByName[appName];
            var appIndex = toolbarAppsCopy.indexOf(app);

            orderedApps.push(app);
            toolbarAppsCopy.splice(appIndex, 1);
        });

        return orderedApps.concat(toolbarAppsCopy);
    }

    function generateToolbarAppDOM(app) {
        var toolbarApp = document.createElement('li');

        toolbarApp.appFrame = app.frame;
        toolbarApp.innerHTML = app.name;
        toolbarApp.addEventListener('click', bringToolbarToFront);

        return toolbarApp;
    }

    function bringToolbarToFront(event) {
        if (!checkCurrentFrameIsStatic()) {
            mashupMobile.bringToFront(event.target.appFrame.contentWindow.document.body);
        }
    }

    function checkCurrentFrameIsStatic() {
        var activePanel = document.body.querySelector('.panel.active');
        var activeFrame = activePanel.querySelector('iframe.active');

        return activeFrame.classList.contains('static');
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

    mashupMobile.setMessagingProtocol = function setMessagingProtocol(messagingProtocol) {
        if (checkMessagingProtocol(messagingProtocol)) {
            mashupMobile.messaging = messagingProtocol;
        } else {
            console.error('The messaging protocol requires at least a `publish` and `subscribe` method. MashupMobile will use its default messaging mechanism.');
        }
    };

    function checkMessagingProtocol(messagingProtocol) {
        return messagingProtocol &&
            typeof messagingProtocol.publish === 'function' &&
            typeof messagingProtocol.subscribe === 'function';
    }

})(window.mashupMobile = window.mashupMobile || {});