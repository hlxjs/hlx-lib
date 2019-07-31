const {Readable, Writable} = require('stream');
const path = require('path');
const test = require('ava');
// const {createLogger} = require('hlx-logger');
const utils = require('../helper/utils');
const hlx = require('../..');

const FIXTUREDIR = path.join(__dirname, '../fixture');

test.cb('local-copy', t => {
  const SOURCEDIR = `${FIXTUREDIR}/local-copy/`;
  const DESTDIR = `${utils.TMPDIR}/local-copy/`;

  hlx.src(`file://${SOURCEDIR}/master.m3u8`, {rootPath: SOURCEDIR})
  // .pipe(createLogger())
  .pipe(hlx.dest(DESTDIR, {inputDir: SOURCEDIR}))
  .on('finish', () => {
    t.true(utils.compareDirectories('local-copy'));
    t.end();
  });
});

test.cb('custom-source', t => {
  const SOURCEDIR = `${FIXTUREDIR}/custom-source/`;
  const DESTDIR = `${utils.TMPDIR}/custom-source/`;
  // Dummy source
  class DummyReadable extends Readable {
    constructor() {
      super({objectMode: true});
    }

    _read() {
      utils.pushAllFiles('custom-source', this);
    }
  }
  const dummy = new DummyReadable();

  hlx.src(dummy, {rootPath: SOURCEDIR})
  // .pipe(createLogger())
  .pipe(hlx.dest(DESTDIR, {inputDir: SOURCEDIR}))
  .on('finish', () => {
    t.true(utils.compareDirectories('custom-source'));
    t.end();
  });
});

test.cb('custom-destination', t => {
  const SOURCEDIR = `${FIXTUREDIR}/custom-destination/`;
  // Dummy destination
  class DummyWritable extends Writable {
    constructor() {
      super({objectMode: true});
    }

    _write(data, _, cb) {
      utils.writeObj('custom-destination', data, SOURCEDIR)
      .then(cb)
      .catch(cb);
    }
  }
  const dummy = new DummyWritable();

  hlx.src(`file://${SOURCEDIR}/master.m3u8`, {rootPath: SOURCEDIR})
  // .pipe(createLogger())
  .pipe(hlx.dest(dummy))
  .on('finish', () => {
    t.true(utils.compareDirectories('custom-destination'));
    t.end();
  });
});
