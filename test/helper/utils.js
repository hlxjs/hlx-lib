const fs = require('fs');
const path = require('path');
const HLS = require('hls-parser');

const FIXTUREDIR = path.join(__dirname, '../fixture');
const TMPDIR = process.env.TMPDIR || `${FIXTUREDIR}/tmp`;

const FILELIST = [
  'master.m3u8',
  'low/first.ts',
  'low/second.ts',
  'low/third.ts'
];

if (!fs.existsSync(TMPDIR) || !fs.lstatSync(TMPDIR).isDirectory()) {
  fs.mkdirSync(TMPDIR);
}

function removeSpaceFromLine(line) {
  let inside = false;
  let str = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inside = !inside;
    } else if (!inside && ch === ' ') {
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
    } else {
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
  for (const [index, filename] of FILELIST.entries()) {
    let data;
    if (filename.endsWith('.m3u8')) {
      data = HLS.parse(fs.readFileSync(`${SRCDIR}/${filename}`, 'utf8'));
      data.uri = filename;
    } else {
      data = new HLS.types.Segment({uri: filename, mediaSequenceNumber: index, discontinuitySequence: 0});
      data.data = fs.readFileSync(`${SRCDIR}/${filename}`);
    }
    stream.push(data);
  }
  stream.push(null);
}

function writeObj(prefix, obj) {
  const DESTDIR = `${TMPDIR}/${prefix}`;
  let {uri} = obj;
  if (path.isAbsolute(uri) && fs.existsSync(uri)) {
    uri = path.basename(uri);
  }
  const destPath = path.join(DESTDIR, uri);
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir) || !fs.lstatSync(dir).isDirectory()) {
    fs.mkdirSync(dir);
  }
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
