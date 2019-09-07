const fs = require('fs');
const path = require('path');
const {URL} = require('url');
const HLS = require('hls-parser');
const {mkdirP, tryCatch} = require('hlx-util');

const FIXTUREDIR = path.join(__dirname, '../fixture');
const TMPDIR = process.env.TMPDIR || `${FIXTUREDIR}/tmp`;

mkdirP(TMPDIR);

function removeSpaceFromLine(line) {
  let inside = false;
  let str = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inside = !inside;
    } else if (!inside && /\s/.test(ch)) {
      continue;
    }
    str += ch;
  }
  return str;
}

function strip(playlist) {
  playlist = playlist.trim();
  const filtered = [];
  playlist.split('\n').forEach(line => {
    line = removeSpaceFromLine(line);
    if (line.startsWith('#')) {
      if (line.startsWith('#EXT')) {
        filtered.push(line);
      }
    } else if (line) {
      filtered.push(line);
    }
  });
  return filtered.join('\n');
}

function equalPlaylist(expected, actual) {
  if (expected) {
    expected = strip(expected);
  }
  if (actual) {
    actual = strip(actual);
  }
  return expected === actual;
}

function compareDirectories(prefix) {
  const DESTDIR = `${TMPDIR}/${prefix}`;
  const SRCDIR = `${FIXTUREDIR}/${prefix}`;

  const listA = fs.readdirSync(DESTDIR).sort();
  const listB = fs.readdirSync(SRCDIR).sort();
  if (listA.length !== listB.length) {
    return false;
  }

  for (const [index, filename] of listA.entries()) {
    if (filename !== listB[index]) {
      return false;
    }
    if (fs.lstatSync(`${SRCDIR}/${filename}`).isDirectory()) {
      if (!compareDirectories(`${prefix}/${filename}`)) {
        return false;
      }
      continue;
    }
    const expected = fs.readFileSync(`${SRCDIR}/${filename}`, 'utf8');
    const actual = fs.readFileSync(`${DESTDIR}/${filename}`, 'utf8');
    if (!equalPlaylist(expected, actual)) {
      return false;
    }
  }
  return true;
}

function pushAllFiles(prefix, stream) {
  const SRCDIR = `${FIXTUREDIR}/${prefix}`;
  const FILELIST = [
    'master.m3u8',
    'playlists/low.m3u8',
    'playlists/mid.m3u8',
    'playlists/high.m3u8',
    'segments/low/first.ts',
    'segments/low/second.ts',
    'segments/low/third.ts',
    'segments/mid/first.ts',
    'segments/mid/second.ts',
    'segments/mid/third.ts',
    'segments/high/first.ts',
    'segments/high/second.ts',
    'segments/high/third.ts'
  ];
  for (const [index, filename] of FILELIST.entries()) {
    let data;
    if (filename.endsWith('.m3u8')) {
      data = HLS.parse(fs.readFileSync(`${SRCDIR}/${filename}`, 'utf8'));
      if (data.isMasterPlaylist) {
        data.uri = `file://${SRCDIR}/${filename}`;
        data.parentUri = '';
      } else {
        data.uri = filename;
        data.parentUri = `file://${SRCDIR}/${FILELIST[0]}`;
        for (const segment of data.segments) {
          segment.parentUri = `file://${SRCDIR}/${filename}`;
        }
      }
    } else {
      data = new HLS.types.Segment({uri: `../${filename}`, mediaSequenceNumber: (index - 4) % 3, discontinuitySequence: 0});
      data.parentUri = `file://${SRCDIR}/${FILELIST[Math.floor((index - 4) / 3) + 1]}`;
      data.data = fs.readFileSync(`${SRCDIR}/${filename}`);
    }
    stream.push(data);
  }
  stream.push(null);
}

function writeObj(prefix, obj, inputDir) {
  const DESTDIR = `${TMPDIR}/${prefix}`;
  const {uri, parentUri} = obj;
  // console.log(`writeObj: uri=${uri}, parentUri=${parentUri}, inputDir=${inputDir}, outputDir=${DESTDIR}`);
  let destPath;
  if (path.isAbsolute(uri)) {
    destPath = path.join(DESTDIR, uri);
  } else {
    const obj = tryCatch(
      () => new URL(uri),
      () => new URL(uri, parentUri),
      () => null
    );
    if (obj) {
      destPath = path.join(DESTDIR, path.relative(inputDir, obj.pathname));
    } else {
      destPath = path.join(DESTDIR, parentUri ? path.join(path.dirname(parentUri), uri) : uri);
    }
  }

  // console.log(`\tdestPath=${destPath}`);

  const dir = path.dirname(destPath);
  mkdirP(dir);

  if (obj.type === 'playlist') {
    return new Promise((resolve, reject) => {
      fs.writeFile(destPath, HLS.stringify(obj), 'utf8', err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }
  const stream = obj.data;
  return new Promise((resolve, reject) => {
    stream.on('data', data => {
      fs.writeFile(destPath, data, err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

module.exports = {
  compareDirectories,
  pushAllFiles,
  writeObj,
  TMPDIR
};
