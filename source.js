const {Readable} = require('stream');
const {createReadStream} = require('hlx-file-reader');
const {createUrlRewriter} = require('hlx-url-rewriter');

function createSource(location, options = {}) {
  const urlRewriter = createUrlRewriter(options);
  let head;
  if (location instanceof Readable) {
    head = location;
  } else {
    const defaultOpts = {rawResponse: true};
    head = createReadStream(location, Object.assign(defaultOpts, options));
  }
  return head.pipe(urlRewriter);
}

module.exports = createSource;
