const path = require('path');
const p = (...args) => path.join(__dirname, ...args);

const parser = require(p('parser.js'));

const parse = function (args, evalFunc) {
    if (evalFunc)
        parser.eval = evalFunc.bind(this);
    return parser.parse(args);
}

module.exports = parse;

module.exports.shortcode = function (renderFunc) {
    return {
        parse: function (tagToken) {
            this.args = tagToken.args;
        },
        render: function (ctx, emitter, hash) {
            const evalValue = arg => this.liquid.evalValueSync.call(this.liquid, arg, ctx);
            this.args = parse(this.args, evalValue);
            return renderFunc.call(this, ctx, emitter, hash);
        }
    }
}
