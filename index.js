const path = require('path');
const p = (...args) => path.join(__dirname, ...args);

const parser = require(p('parser.js'));

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
        results = results.map(arg => {
            if (arg.__keywords === true) {
                let asyncKwargs = Object.entries(arg).map(e => Promise.all(e));
                return Promise.all(asyncKwargs)
                    .then(kwargs =>
                        kwargs.reduce((obj, [key, val]) => {
                            obj[key] = val;
                            return obj;
                        }, {}));
            }
            return arg; // don't need to do this in a map. just find the kwargs if it exists
        });
        results = Promise.all(results);
    }

    return results;
}
