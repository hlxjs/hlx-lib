const {Writable} = require('stream');
const {createWriteStream} = require('hlx-file-writer');
const {createTerminator} = require('hlx-terminator');

function createDestination(location) {
  const terminator = createTerminator();
  if (location instanceof Writable) {
    return location;
  }
  if (typeof location === 'string') {
    const writer = createWriteStream({rootPath: location, storePlaylist: true});
    writer.pipe(terminator);
    return writer;
  }
  return terminator;
}

module.exports = createDestination;
