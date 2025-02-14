var get = require('simple-get')
var util = require('./util')
var proxy = require('./proxy')

function findAssetId (opts, cb) {
  var downloadUrl = util.getDownloadUrl(opts)
  console.log("===findAssetId downloadUrl: ", downloadUrl);
  var apiUrl = util.getApiUrl(opts)
  console.log("===findAssetId apiUrl: ", apiUrl);
  var log = opts.log || util.noopLogger

  log.http('request', 'GET ' + apiUrl)
  // curl -H "Authorization: token TOKEN" https://api.github.com/repos/hellosivi/sivi-text-node/releases // this is the call to make
  var reqOpts = proxy({
    url: apiUrl,
    json: true,
    headers: {
      'User-Agent': 'simple-get',
      Authorization: 'token ' + opts.token
    }
  }, opts)

  console.log("Req Opts: ", JSON.stringify(reqOpts, null, 2));

  var req = get.concat(reqOpts, function (err, res, data) {
    if (err) return cb(err)
    log.http(res.statusCode, apiUrl)
    if (res.statusCode !== 200) return cb(err)

    // Find asset id in release
    for (var release of data) {
      if (release.tag_name === opts['tag-prefix'] + opts.pkg.version) {
        for (var asset of release.assets) {
          if (asset.browser_download_url === downloadUrl) {
            return cb(null, asset.id)
          }
        }
      }
    }

    cb(new Error('Could not find GitHub release for version'))
  })

  req.setTimeout(30 * 1000, function () {
    req.abort()
  })
}

module.exports = findAssetId
