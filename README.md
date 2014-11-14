# Blip

[![Build Status](https://travis-ci.org/tidepool-org/blip.png?branch=master)](https://travis-ci.org/tidepool-org/blip)

Blip is a web app for Type-1 Diabetes (T1D) built on top of the [Tidepool](http://tidepool.org/) platform. It allows patients and their "care team" (family, doctors) to visualize their device data and message each other.

Tech stack:

- [React](http://facebook.github.io/react)
- [Flux](http://facebook.github.io/flux/)
- [D3.js](http://d3js.org/)
- [LESS](http://lesscss.org/)

Table of contents:

- [Install](#install)
- [Quick start](#quick-start)
- [Config](#config)
- [Development](#development)
    - [Code organization](#code-organization)
    - [Flux](#flux)
    - [Webpack](#webpack)
    - [Config object](#config-object)
    - [Dependencies](#dependencies)
    - [Debugging](#debugging)
    - [Less](#less)
    - [Icons](#icons)
    - [JSHint](#jshint)
    - [Mock mode](#mock-mode)
- [Build and deployment](#build-and-deployment)

## Install

Requirements:

- [Node.js](http://nodejs.org/)

Clone this repo then install dependencies:

```bash
$ npm install
```

## Quick start

Start the development server (in "mock mode") with:

```bash
$ source config/mock.sh
$ npm start
```

Open your web browser and navigate to `http://localhost:3000/`. You can see the
mock data by logging in with email "**demo**" and password "**demo**".

## Config

Configuration values are set with environment variables (see `config/sample.sh`).

You can set environment variables manually, or use a bash script. For example:

```bash
source config/devel.sh
```

Ask the project owners to provide you with config scripts for different environments, or you can create one of your own. It is recommended to put them in the `config/` directory, where they will be ignored by Git.

## Development

The following snippets of documentation should help you find your way around and contribute to the app's code.

### Code organization

- **App** (`app/app.js`): Main app object and component; also contains the route definitions
- **Core** (`app/core`): Common utilities and styles shared by all app components
- **Api** (`app/core/api.js`): Service used to talk to the backend
- **Components** (`app/components`): Reusable React components, the building-blocks of the application
- **Pages** (`app/pages`): Higher-level React components that combine reusable components together
- **Actions** (`app/actions`): Called to make any changes to the app state
- **Stores** (`app/stores`): Contains the app state that components can read and listen to for changes

### Flux

Data flow in the app is organized around the [Flux](http://facebook.github.io/flux/) architecture. The implementation used here stays close to the examples from Facebook, and uses their [Dispatcher](https://github.com/facebook/flux).

### Webpack

We use [Webpack](http://webpack.github.io/) to package all source files into a bundle that can be distributed to the user's browser. We also use CommonJS to import any module or asset.

Require a JavaScript file, npm package, or JSON file like you would normally in Node:

```javascript
// app.js
var foo = require('./foo');
var React = require('react');
var pkg = require('../package.json');
```

You can also require a Less file, which will be added to the page as a `<style>` tag:

```javascript
// app.js
require('./style.less');
```

To use an image, the require statement will either return the URL to the image, or encode it directly as a string (depending on its size). Both are suitable for `src` or `href` attributes.

```javascript
// avatar.js
var imgSrc = require('./default-avatar.png');

var html = '<img src="' + imgSrc + '" />';
```

Assets, like fonts, can also be required in Less files (Webpack will apply the same logic described above for images in JS files):

```less
@font-face {
  font-family: 'Blip Icons';
  src: url('../fonts/blip-icons.eot');
}
```

### Config object

The `config.app.js` file will have its `process.env.FOO` statements replaced by the value of the corresponding environment variable when the build or development server is run. This is done thanks to [envify](https://github.com/hughsk/envify).

### Dependencies

All third-party dependencies are installed through npm, and need to be `require`able through the CommonJS format.

If a dependency is needed directly in the app, by the build step, or by the production server, it should go in `dependencies` in the `package.json`. This is because we use `npm install --production` when deploying.

All other dependencies used in development (testing, development server, etc.), can go in the `devDependencies`.

### Debugging

The app uses the [bows](http://latentflip.com/bows/) library to log debugging messages to the browser's console. It is disabled by default (which makes it production-friendly). To see the messages type `localStorage.debug = true` in the browser console and refresh the page. Create a logger for a particular module by giving it a name, such as:

```javascript
var Foo = {
  log: bows('Foo'),
  bar: function() {
    this.log('Walked into bar');
  }
};
```

### Less

For naming classes and variables, we try to follow the [SUIT CSS](http://suitcss.github.io/) naming convention. It is roughly summarized by:

```css
.MyComponent {}
.MyComponent.is-animating {}
.MyComponent--modifier {}

.MyComponent-part {}
.MyComponent-anotherPart {}
```

Keep styles in the same folder as the component, and import them in the main `app/style.less` stylesheet. If working on a "core" style, don't forget to import the files in `app/core/core.less`.

In organizing the core styles in different `.less` files, as well as naming core style classes, we more or less take inspiration from Twitter Bootstrap (see [https://github.com/twbs/bootstrap/tree/master/less](https://github.com/twbs/bootstrap/tree/master/less)).

If using class names to select elements from JavaScript (for tests, or using jQuery), prefix them with `js-`. That way style changes and script changes can be done more independently.

### Icons

We use an icon font for app icons (in `app/core/fonts/`). To use an icon, simply add the correct class to an element (convention is to use the `<i>` element), for example:

```html
<i class="icon-logout"></i>
```

Take a look at the `app/core/less/icons.less` file for available icons.

### JSHint

In a separate terminal, you can lint JS files with:

```bash
$ npm run jshint
```

You can also watch files and re-run JSHint on changes with:

```bash
$ npm run jshint-watch
```

### Mock mode

For local development, demoing, or testing, you can run the app in "mock" mode by setting the environment variable `MOCK=true` (to turn it off use `MOCK=''`). In this mode, the app will not make any calls to external services, and use dummy data contained in `.json` files.

All app objects (mostly app services) that make any external call should have their methods making these external calls patched by a mock. These are located in the `mock/` directory. To create one, return a `patchService(service)` function (see existing mocks for examples).

Mock data is generated from `.json` files, which are combined into a JavaScript object that mirrors the directory structure of the data files (for example `patients/11.json` will be available at `data.patients['11']`). See the [blip-mock-data](https://github.com/tidepool-org/blip-mock-data) repository for more details.

You can configure the behavior of mock services using **mock parameters**. These are passed through the URL query string (before the hash), for example:

```
http://localhost:3000/?auth.skip=11&api.patient.getall.delay=2000#/patients
```

With the URL above, mock services will receive the parameters:

```javascript
{
  'auth.skip': '11',
  'api.patient.getall.delay': 2000
}
```

Mock parameters are very useful in development (for example, you don't necessarily want to sign in every time you refresh). They are helpful when testing (manually or automatically) different behaviors: What happens if this API call returns an empty list? What is displayed while we are waiting for data to come back from the server? Etc.

To find out which mock parameters are available, please see the corresponding service and method in the `mock/` folder (look for calls to `getParam()`).

If you would like to build the app with mock parameters "baked-in", you can also use the `MOCK_PARAMS` environement variable, which works like a query string (ex: `$ export MOCK_PARAMS='auth.skip&api.delay=1000'`). If the same parameter is set in the URL and the environment variable, the URL's value will be used.

## Build and deployment

The app is built as a static site in the `dist/` directory.

We use [Shio](https://github.com/tidepool-org/shio) to deploy, so we separate the build in two.

Shio's `build.sh` script will take care of building the app itself with:

```bash
$ npm run build-app
```

Shio's `start.sh` script then builds the config from environment variables as a separate file with:

```bash
$ source config/env.sh
$ npm run build-config
```

After that, the app is ready to be served using the static web included in this repo:

```bash
$ npm run server
```

You can also build everything at once locally by simply running:

```bash
$ source config/mock.sh
$ npm run build
$ npm run server
```
