const path = require('path');
const p = (...args) => path.join(__dirname, ...args);

const parser = require(p('parser.js'));

function evalArg(arg, evalFunc) {
    if (arg.__keywords === true) {
        delete arg.__keywords;
        for (const key in arg) {
            arg[key] = evalArg(arg[key], evalFunc);
        }
        arg.__keywords = true;
        return arg;
    }
    return evalFunc(arg);
}

const parse = parser.parse.bind(parser);

const evaluate = (args, evalFunc) => {
    return args.map(a => evalArg(a, evalFunc));
}

module.exports = function (render) {
    return {
        parse: function (tagToken) {
            this.args = parse(tagToken.args);
        },
        render: function (ctx, emitter, hash) {
            const evalValue = arg => this.liquid.evalValueSync.call(this.liquid, arg, ctx);
            this.args = evaluate(this.args, evalValue);
            return render.call(this, ctx, emitter, hash);
        }
    }
}

module.exports.parser = parse;

module.exports.eval = evaluate;
