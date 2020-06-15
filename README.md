# Liquid Arguments Parser

This module exists to parse the arguments string of a [custom Liquid JS tag](https://liquidjs.com/tutorials/register-filters-tags.html). 

```javascript
const parser = require(liquid-args);

parser(`foo "bar" 42`);

// [ 'foo', '"bar"', '42' ]
```

It supports key/value arguments, which it returns in an object as a last argument. The output mimics the standard arguments for custom Nunjucks tags.

```javascript
parser(`first_name last_name age=68 height=5.8`);

// [ 'first_name',
//   'last_name',
//   { __keywords: true, age: '68', height: '5.8' } ]
```

The parser also takes a function as an optional second argument, which will evaluate each value before returning the arguments. (At the moment this only supports syncronous functions.)

```javascript
const { Liquid } = require('liquidjs');
const engine = new Liquid();

const evalFunc = arg => engine.evalValueSync(arg, /* some context */)

parser(`foo "bar" 42`, evalFunc);

// [ fooValue, 'bar', 42 ]
```

There is a further `shortcode` convenience method, which returns a liquidjs tag configuration. It takes a function equivalent to the `render` function in the tag configuration, which exposes the parsed arguments through `this.args`.

## Usage Example

Here's an example of the parser being used to create a custom liquidjs tag:

```javascript
const parser = require('liquid-args');
const { Liquid } = require('liquidjs');
const engine = new Liquid();

engine.registerTag('jsonify', {
    parse: function (tagToken) {
        this.args = tagToken.args;
    },
    render: function (ctx, emitter, hash) {
        const evalValue = arg => this.liquid.evalValueSync.call(this.liquid, arg, ctx);
        this.args = parser(this.args, evalValue);
        return JSON.stringify(this.args);
    }
});
```

Or, using the `shortcode` method:

```javascript
const jsonify = parser.shortcode(function (ctx, emitter, hash) {
    return JSON.stringify(this.args);
});

engine.registerTag('jsonify', jsonify);
```
