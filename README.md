[![Build Status](https://travis-ci.org/hlxjs/hlx-lib.svg?branch=master)](https://travis-ci.org/hlxjs/hlx-lib)
[![Coverage Status](https://coveralls.io/repos/github/hlxjs/hlx-lib/badge.svg?branch=master)](https://coveralls.io/github/hlxjs/hlx-lib?branch=master)
[![Dependency Status](https://david-dm.org/hlxjs/hlx-lib.svg)](https://david-dm.org/hlxjs/hlx-lib)
[![Development Dependency Status](https://david-dm.org/hlxjs/hlx-lib/dev-status.svg)](https://david-dm.org/hlxjs/hlx-lib#info=devDependencies)
[![Known Vulnerabilities](https://snyk.io/test/github/hlxjs/hlx-lib/badge.svg)](https://snyk.io/test/github/hlxjs/hlx-lib)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

# hlx-lib
A library for processing HLS streams in Node.js

## Features
* It exposes [`gulp`](https://www.npmjs.com/package/gulp) like interface for processing an HLS stream as Node's [object mode](https://nodejs.org/api/stream.html#stream_object_mode) stream.
* The stream is represented as a series of `data` events of [`hls-parser`](https://github.com/kuu/hls-parser) objects.
* To process the stream, users just need to insert their own [`Transform`](https://nodejs.org/api/stream.html#stream_class_stream_transform) stream between the `src` and `dest`.

## Install
[![NPM](https://nodei.co/npm/hlx-lib.png?mini=true)](https://nodei.co/npm/hlx-lib/)

## Usage

### Example 1 - Default source / destination
```js
const hlx = require('hlx'); // hlx-lib can be transparently referenced via hlx module
const {createDecryptor} = require('hlx-decryptor');
const decryptor = createDecryptor('AES-128');

// Store all decrypted files in /var/www/media/
hlx.src('https://foo.bar/sample.m3u8')
.pipe(decryptor)
.pipe(hlx.dest('/var/www/media/'));
```

### Example 2 - Custom source
```js
const hlx = require('hlx');
const {createReadStream} = require('hlx-src-webdav-pull');
const reader = createReadStream({
  url: 'http://foo.bar/webdav',
  user: {WebDAV user},
  pass: {WebDAV password}
});

// Store all decrypted files in /var/www/media/
hlx.src(reader)
.pipe(decryptor)
.pipe(hlx.dest('/var/www/media/'));
```

### Example 3 - Custom destination
```js
const hlx = require('hlx');
const {createReadStream} = require('hlx-dest-http-server');
const writer = createWriteStream({
  port: 8080,
  prefix: 'media',
  rootPath: '/var/www/media/'
});

// Host the stream at http://localhost:8080/media/sample.m3u8
hlx.src('https://foo.bar/sample.m3u8')
.pipe(decryptor)
.pipe(hlx.dest(writer));
```
## API

### `src(location)`
Creates a new `stream.Readable` object.

#### params
| Name    | Type   | Required | Default | Description   |
| ------- | ------ | -------- | ------- | ------------- |
| location     | string or stream.Readable | Yes      | N/A     | It should be either of a local file path, a url of the playlist, or a custom source object.  |


#### return value
An instance of `stream.Readable`.
When the `location` is a local file path or a url, the `hlx-file-reader` stream will be created. Otherwise, the passed readable stream will be returned back.

### `dest(location)`
Creates a new `stream.Writable` object.

#### params
| Name    | Type   | Required | Default | Description   |
| ------- | ------ | -------- | ------- | ------------- |
| location     | string or stream.Writable | Np      | null     | It should be either of a local file path or a custom destination object.  |

#### return value
When the `location` is a local file path, the `hlx-file-writer` stream will be created. Otherwise, the passed writable stream will be returned back.
