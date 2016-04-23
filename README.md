#Mashup Mobile

The [Ozone Widget Framework](http://ozone-development.github.io/ozone-website/) is something I've worked with at my job
quite a bit. One problem I've had with it is that it can't be used on a mobile device--the way the frames are laid
out just isn't conducive to a small screen.

So I took this opportunity to leverage [Hammer.js](http://hammerjs.github.io/) to create a similar idea that fits
for a mobile device.

##How's it Work?

There are 5 "panels"--center, bottom, left, right, and top. The outer 4 panels (bottom, left, right, and top) are hidden when
the Mashup loads up. By swiping or sending pubsub messages, each panel can be brought into view. Additionally, each panel can
support multiple apps. Hopefully, the diagram below better explains how everything works:


    ------------------------------------------------------------------------------------

                                        TOP
                                  (swipe down only)

    ------------------------------------------------------------------------------------
    |                    |                                        |                    |
    |                    |                                        |                    |
    |                    |                                        |                    |
    |                    |                                        |                    |
    |                    |                                        |                    |
    |      LEFT          |               CENTER                   |       RIGHT        |
    | (swipe right only) |        (swipes any direction)          | (swipe left only)  |
    |                    |                                        |                    |
    |                    |                                        |                    |
    |                    |                                        |                    |
    |                    |                                        |                    |
    ------------------------------------------------------------------------------------

                                        Bottom
                                    (swipe up only)

    ------------------------------------------------------------------------------------

#The API

- `mashupMobile.init(apps)`: The `apps` parameter is an object that understands
5 keys; each value is an array of App Definition Objects (see below):
    - `bottom`
    - `center` (required)
    - `left`
    - `right`
    - `top`
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

#App Definition Object:

The App Definition Object structure:

- `url` (required): _String_; the URL of the application for the IFRAME
- `active`: _Boolean_; bring to front when the app loads; if ommitted, the first app
in the array specified during `init` is brought to front.
- `static`: _Boolean_; if set to true, when the app is brought to front, swiping is
turned off for the panel.


#Mashup Utility

The file `mashup-util.js` can be placed in each app to allow them to to interact
with Mashup Mobile. It provides the following methods:

- `mashupUtil.messaging`: provides access to the same methods as `mashupMobile`
- `mashupUtil.bringToFront()`: provides access to `mashupMobile` without needing
to specify the app's body.

#Examples

##Initialization
```javascript
window.mashupMobile.init({
    center: [{ url: 'first.html' }, { url: 'second.html' }],
    left: [{ static: true, url: 'images.html' }],
    right: [{ url: 'colors.html' }, { active: true, url: 'numbers.html' }]
});
```

##Messaging
###Subscribing
```javascript
window.mashupMobile.subscribe('party', 'planning', reactToPlanning);
function reactToPlanning(payload) {
    console.info(payload);
}
```

##Publishing
```javascript
var partyDetails = {guests: 12, location: 'The Pizza Palace' };
window.mashupMobile.publish('party', 'planning', partyDetails);
```
