const parser = require('./parser.js');

function promisifyKwargs (kwargs) {
    const asyncKwargs = Object.entries(kwargs).map(e => Promise.all(e));
    return Promise.all(asyncKwargs)
        .then(entries =>
            entries.reduce((obj, [key, val]) => {
                obj[key] = val;
                return obj;
            }, {}));
}

module.exports = function (args, evalFunc) {
    if (evalFunc)
        parser.eval = evalFunc;

    let results = parser.parse(args);
    if (!results.length)
        return results;

    let arg1 = results[0]
    if (arg1 && arg1.__keywords === true)
        arg1 = arg1[Object.keys(arg1).find(k => k !== '__keywords')];

    if (arg1 instanceof Promise) {
        for (let i = 0; i < results.length; i++) {
            if (results[i].__keywords === true) {
                results[i] = promisifyKwargs(results[i]);
                break;
            }
        }
    }

    return results;
}
