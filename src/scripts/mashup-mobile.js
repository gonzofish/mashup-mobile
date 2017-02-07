'use strict';

(function(mashupMobile) {
    var activePanelType;
    var activeApp;
    var toolbarApps;
    var panels;
    var subscriptions = {};

    mashupMobile.init = function init(apps, toolbarOrder, targetArea) {
        var panelContainer;

        apps = apps || {};
        toolbarApps = [];
        toolbarOrder = toolbarOrder || [];

        targetArea = targetArea || document.body;
        panelContainer = createPanelContainer(targetArea);
        panels = createPanels(apps, panelContainer);

        createToolbar(panelContainer, toolbarOrder, targetArea);
        showPanel('center');
        setActiveAppByFrame(activeApp);
    };

    function createPanelContainer(targetArea) {
        var panelContainer = document.createElement('div');

        panelContainer.classList.add('panel-container');
        targetArea.appendChild(panelContainer);

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

        panel.classList.add('panel');
        panel.classList.add(panelType);

        return panel;
    }

    function createAppFrames(apps, panel) {
        return apps.reduce(function(frames, app) {
            var appFrame;

            if (!app.lazy) {
                appFrame = createAppFrame(app);
            } else {
                appFrame = {
                    app: app,
                    panel: panel
                };
            }

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
        iframe.setAttribute('width', '100%');

        if (app.active) {
            iframe.classList.add('active');
            activeApp = iframe;
        }

        if (!app.lazy) {
            iframe.setAttribute('src', app.url);
        }

        if (app.name) {
            iframe.dataset.appName = getAppCSSName(app.name);
        }

        if (app.static) {
            iframe.classList.add('static');
        }

        return iframe;
    }

    function addFramesToPanel(frames, panel) {
        ensureActiveFrame(frames);
        frames.forEach(function(frame) {
            if (typeof frame.appendChild === 'function') {
                panel.appendChild(frame);
            }
        });
    }

    function ensureActiveFrame(appFrames) {
        if (!checkHasActiveFrame(appFrames)) {
            appFrames[0].classList.add('active');
        }
    }

    function checkHasActiveFrame(frames) {
        return frames.reduce(function(hasActive, frame) {
            if (frame.classList && frame.classList.contains('active')) {
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
            if (typeof appFrame.addEventListener === 'function') {
                hammerifyFrame(appFrame, panelType);
            }
        });
    }

    function hammerifyFrame(appFrame, panelType, callback) {
        appFrame.addEventListener('load', function() {
            var appBody = appFrame.contentWindow.document.body;

            hammerifyElement(appBody, panelType);
            appBody.iframe = appFrame;
            appBody.panelType = panelType;

            if (!!appFrame.dataset.appName) {
                appBody.appName = appFrame.dataset.appName;
            }

            if (typeof callback === 'function') {
                callback();
            }
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
            showHidePanels(nextPanelType, currentPanelType);
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
        var activeFrame = element.querySelector('iframe.active');

        if (activeFrame && activeFrame.dataset.appName) {
            setToolbarAppActive(activeFrame.dataset.appName, 'remove');
        }

        element.classList.remove('active');
        panel.set({ active: false });
    }

    function showPanel(panelType) {
        var panel = panels[panelType];
        var element = panel.element;
        var activeFrame = element.querySelector('iframe.active');

        if (activeFrame && activeFrame.dataset.appName) {
            setToolbarAppActive(activeFrame.dataset.appName, 'add');
        }

        element.classList.add('active');
        panel.set({ active: true });
        activePanelType = panelType;
    }

    function setToolbarAppActive(appName, classListMethod) {
        var toolbar = document.querySelector('ul.toolbar');
        var appItem = toolbar.querySelector('li.' + appName);

        if (appItem) {
            appItem.classList[classListMethod]('active');
        }
    }

    function updateCenterPanel(panelType) {
        panels.center.element.classList.remove('bottom');
        panels.center.element.classList.remove('left');
        panels.center.element.classList.remove('right');
        panels.center.element.classList.remove('top');
        panels.center.element.classList.add(panelType);
    }

    function createToolbar(panelContainer, toolbarOrder, targetArea) {
        var toolbarDOM;

        if (toolbarApps.length > 0) {
            toolbarDOM = generateToolbarDOM(toolbarOrder);
            panelContainer.classList.add('toolbar');
            targetArea.insertBefore(toolbarDOM, panelContainer);
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
        toolbarApp.classList.add(getAppCSSName(app.name));
        toolbarApp.addEventListener('click', bringToolbarToFront);

        return toolbarApp;
    }

    function getAppCSSName(name) {
        return name.toLowerCase().replace(/[\s\.\#\?\!\*\\\~\@\$\%\^\&\(\)\+\=\,\/\'\;\:\"\>\<\[\]\{\}\|\`]+/g, '-');
    }

    function bringToolbarToFront(event) {
        if (!checkCurrentFrameIsStatic()) {
            if (event.target.appFrame && event.target.appFrame.contentWindow) {
                mashupMobile.bringToFront(event.target.appFrame.contentWindow.document.body);
            } else if (event.target.appFrame && event.target.appFrame.app) {
                event.target.appFrame = createToFront(event.target.appFrame);
            }
        }
    }

    function checkCurrentFrameIsStatic() {
        var activePanel = document.body.querySelector('.panel.active');
        var activeFrame = activePanel.querySelector('iframe.active');

        return activeFrame.classList.contains('static');
    }

    function createToFront(info) {
        var frame = createAppFrame(info.app);

        frame.setAttribute('src', info.app.url);
        hammerifyFrame(frame, getElementPanelType(info.panel), function() {
            updateToolbarApps(info.app, frame);
            mashupMobile.bringToFront(frame.contentWindow.document.body);
        });

        info.panel.appendChild(frame);

        return frame;
    }

    function updateToolbarApps(app, frame) {
        var matches = toolbarApps.filter(function(toolbarApp) {
            return toolbarApp.name === app.name;
        });

        if (matches.length > 0) {
            matches[0].frame = frame;
        }
    }

    mashupMobile.bringToFront = function bringToFront(appBody) {
        var panelType = appBody.panelType;
        var panel = panels[panelType].element;
        var frames = Array.from(panel.querySelectorAll('iframe'));

        setToolbarAppActive('active', 'remove');

        frames.forEach(function(frame) {
            frame.classList.remove('active');
        });

        frames.forEach(function(frame) {
            if (frame === appBody.iframe) {
                setActiveAppByFrame(frame);
                frame.classList.add('active');
            }
        });

        showHidePanels(panelType, activePanelType);
    };

    function setActiveAppByFrame(frame) {
        var matches = toolbarApps.filter(function(app) {
            return app.frame === frame;
        });
        var match = null;

        if (matches.length > 0) {
            match = matches[0];
        }

        activeApp = match;
    }

    mashupMobile.getActiveApp = function getActiveApp() {
        return Object.freeze(Object.assign({}, activeApp));
    };

    function showHidePanels(nextPanelType, currentPanelType) {
        updateCenterPanel(nextPanelType);
        hidePanel(currentPanelType);
        showPanel(nextPanelType);
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