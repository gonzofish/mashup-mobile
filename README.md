# Mashup Mobile

The [Ozone Widget Framework](http://ozone-development.github.io/ozone-website/ "Ozone") is something I've worked with at my job
quite a bit. One problem I've had with it is that it can't be used on a mobile device--the way the frames are laid
out just isn't conducive to a small screen.

So I took this opportunity to leverage [Hammer.js](http://hammerjs.github.io/ "HammerJS") to create a similar idea that fits
for a mobile device.

## Compatibility

This framework was developed with the future in mind. This means that if you need to support browsers that do not fully
support modern JavaScript, you will need to include a shim of some sort. In the examples, we use the
[ES6 Shim](https://github.com/paulmillr/es6-shim "ES6 Shim").

## How's it Work?

There are 5 "panels"--center, bottom, left, right, and top. The outer 4 panels (bottom, left, right, and top) are hidden when
the Mashup loads up. By swiping or sending pubsub messages, panels can be brought into view. Because vertical scrolling and swiping
are similar motions, the center pane can only swipe left and right. That being said, **apps which need to be accessed by swiping should
be placed in the left, right, or center panels**.

Additionally, each panel can support multiple apps. Hopefully, the diagram below better explains how everything works:


                         ------------------------------------------
                         |                                        |
                         |                                        |
                         |                                        |
                         |                TOP                     |
                         |          (swipe down only)             |
                         |                                        |
                         |                                        |
                         |                                        |
    ------------------------------------------------------------------------------------
    |                    |                                        |                    |
    |                    |                                        |                    |
    |                    |                                        |                    |
    |                    |                                        |                    |
    |                    |                                        |                    |
    |      LEFT          |               CENTER                   |       RIGHT        |
    | (swipe right only) |       (swipes left and right)          | (swipe left only)  |
    |                    |                                        |                    |
    |                    |                                        |                    |
    |                    |                                        |                    |
    |                    |                                        |                    |
    ------------------------------------------------------------------------------------
                         |                                        |
                         |                                        |
                         |                                        |
                         |                                        |
                         |               BOTTOM                   |
                         |           (swipe up only)              |
                         |                                        |
                         |                                        |
                         |                                        |
                         ------------------------------------------

# The API

- `mashupMobile.init(apps, toolbarOrder)`: initialize the mashup.
    - `apps`: _Object_; understands 5 keys (below); each value is an array of App Definition Objects:
        - `bottom`
        - `center` (required)
        - `left`
        - `right`
        - `top`
    - `toolbarOrder`: _Array<String>_; if applications are given names, a toolbar is created, those
    names can be provided in this array to specify the order they appear in the toolbar. If a name
    is ommitted, it will be added to the end of the list at random.
- `mashupMobile.setMessagingProtocol(messagingProtocol)`: replace Mashup Mobile's default messaging
protocol with your own. At minimum, a `.publish` and `.subscribe` method must be present on the passed
in protocol.
- `mashupMobile.messaging`
    - `.publish(type, action, payload)`: Send a pubsub message of the `type` and
    `action` with some data (`payload`)
    - `.subscribe(type, action, callback)`: Listen for messages of a `type` and
    `action`. The `callback` will be called when a `.publish` is called for the
    specified `type` and `action`.
- `mashupMobile.bringToFront(appBody)`: Mashup Mobile tacks on references to the
  panel type and iframe each app lives in to the body of that app. By sending a
  reference to that app's body, the Mobile Mashup will bring the application's
  IFRAME and panel into view. The Mashup Utility (see below) can help with this.
- `mashupMobile.bringToFronBy(value, type)`: allows ability to bring an application
  to the front by using its URL or name. Valid values for `type` are `name` and
  `url` (case-sensitive).

# App Definition Object:

The App Definition Object structure:

- `url` (required): _String_; the URL of the application for the IFRAME
- `active`: _Boolean_; bring to front when the app loads; if ommitted, the first app
in the array specified during `init` is brought to front.
- `name`: _String_; the name of the app. Specifying this will create a toolbar and place
a clickable element to bring the app into view.
- `static`: _Boolean_; if set to true, when the app is brought to front, swiping is
turned off for the panel.

## A Note on Static Apps
When an app is declared `static`, if it is in view, the toolbar and swiping will both become
unresponsive. The only way to leave an static app is by sending an intent to another app which
then, in turn, tells the framework to bring it into view through `bringToFront(appBody)`. That
being said, just know that calling `bringToFront` assumes that when it is called, it has no
restrictions on changing frames or panels.

#The Toolbar
The toolbar is an optional feature that is created just by giving one or more apps a name. The
toolbar is placed at the top of the view and the height of the panels adjusts automatically to
accomodate the smaller screen real estate.

**As of now (2016-04-23), the toolbar cannot scroll, so try to limit the number of apps
specified!**


# Mashup Utility

The file `mashup-util.js` can be placed in each app to allow them to to interact
with Mashup Mobile. It provides the following methods:

- `mashupUtil.messaging`: provides access to the same methods as `mashupMobile`
- `mashupUtil.bringToFront()`: provides access to `mashupMobile` without needing
to specify the app's body.

# Examples

## Initialization
### Basic
```javascript
window.mashupMobile.init({
    center: [{ url: 'first.html' }, { url: 'second.html' }],
    left: [{ static: true, url: 'images.html' }],
    right: [{ url: 'colors.html' }, { active: true, url: 'numbers.html' }]
});
```

### With Toolbar & Toolbar Order
```javascript
window.mashupMobile.init({
    center: [{ name: 'Main', url: 'first.html' }, { url: 'second.html' }],
    left: [{ static: true, url: 'images.html' }],
    right: [{ name: 'Colors', url: 'colors.html' }, { name: 'Numbers', active: true, url: 'numbers.html' }]
}, ['Center', 'Numbers', 'Colors']);
```

## Messaging
### Subscribing
```javascript
window.mashupMobile.subscribe('party', 'planning', reactToPlanning);
function reactToPlanning(payload) {
    console.info(payload);
}
```

### Publishing
```javascript
var partyDetails = {guests: 12, location: 'The Pizza Palace' };
window.mashupMobile.publish('party', 'planning', partyDetails);
```

### Changing Protocol
```javascript
var consoleProtocol = {
    publish: function() { console.info('PUBLISHED:', arguments); },
    subscribe: function() { console.info('SUBSCRIBED:', arguments); }
};
window.mashupMobile.setMessagingProtocol(consoleProtocol);
```

### Bringing to Front By Name
```javascript
window.mashupMobile.bringToFrontBy('Numbers', 'name');
```

### Bringing to Front by URL
```javascript
window.mashupMobile.bringToFrontBy('first.html', 'url');
```

