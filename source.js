const {Readable} = require('stream');
const {createReadStream} = require('hlx-file-reader');
const {createUrlRewriter} = require('hlx-url-rewriter');

function createSource(location, options = {}) {
  const urlRewriter = createUrlRewriter();
  let head;
  if (location instanceof Readable) {
    head = location;
  } else {
    head = createReadStream(location, Object.assign(options, {rawResponse: true}));
  }
  return head.pipe(urlRewriter);
}

module.exports = createSource;
