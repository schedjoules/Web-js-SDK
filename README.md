# SchedJoules' SDK for web

## Introduction
This repository contains the SchedJoules' SDK for web. With this SDK you can quickly integrate SchedJoules' services in your web-app. You can use this code as an example or use it as a basis for your implementation and expand on it.

Check out the included demo to see all options.

The API documentation can be found here: https://github.com/schedjoules/calendar-store-api

## Getting started
 - Download schedjoules-websdk.zip or checkout the repository
 - Read the Documentation at [https://github.com/schedjoules/Web-js-SDK/](https://github.com/schedjoules/Web-js-SDK)
 - Take a look at the demo
 - Read the "about the demo" section below

## Next up
 - Get an API key for your app
 - Integrate schedjoules.js in your app
 - Set first page to load (since pageIDs are different per location you need to set the first page to load manually, see Location below)
 - Make sure the endpoints integrate with your UI and app appropriately

## About the demo
We've build this demo to show what you can do with the service and the SDK. The SDK is build as vanilla as possible so it doesn't generate much HTML. The demo.js file is a perfect place to start and check how to work with the SDK.

For the demo we integrated some features you might not need or want it to be available on other places (like on a profile or settings page). For example you can switch between locales and locations. Most of the time this is something you want to set from your app.
We also added a simple UI as a base so it's pretty clear what possibilities the SDK has.

Check out the demo! The code is nicely commented for you to see what's possible.

## Endpoints
There 2 "endpoints" in the SDK that trigger an event to update the UI.

The first is when a page is loaded. In our demo we made a function called "get_page". This calls the SDK to load a new page and on callback we call some other functions within our demo.js file to set up the desired page.
In the demo we call the steps (bullet navigation) and event handlers to trigger appropriately.

Then there's the real endpoint, when a visitor selects a calendar the function "get_calendar" in our demo handles this call. For the demo we've added a _call to action_ button since we use a test API key.
This is the point where the real magic happens. You probably want a button that follows up on the action calendar link from the API. At this point you probably want to go on and integrate the next step within your own app, subscribing to this calendar for example.

## Location
Every country has it's own first page with it's own ID. That means you'll need to call this first page_id manually. It also initialises the SDK.

You can find the page_id for the desired country by calling:
```
curl -L 'https://api.schedjoules.com/countries/' -v -H 'Authorization: Token token="0443a55244bb2b6224fd48e0416f0d9c"'
```