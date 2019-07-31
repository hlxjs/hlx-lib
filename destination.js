const {Writable} = require('stream');
const {createWriteStream} = require('hlx-file-writer');
const {createTerminator} = require('hlx-terminator');

function createDestination(location, options = {}) {
  const terminator = createTerminator();
  if (location instanceof Writable) {
    return location;
  }
  if (typeof location === 'string') {
    const params = Object.assign(options, {outputDir: location, storePlaylist: true});
    const writer = createWriteStream(params);
    writer.pipe(terminator);
    return writer;
  }
  return terminator;
}

module.exports = createDestination;
