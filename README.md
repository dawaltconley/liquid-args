# Liquid Arguments Parser

This module exists to parse the arguments string of a [custom Liquid JS tag](https://liquidjs.com/tutorials/register-filters-tags.html), though it does not depend on `liquidjs` and could also be used in other contexts.

## Basic Usage

```javascript
const parser = require(liquid-args);

parser(`foo "bar" 42`);

// [ 'foo', '"bar"', '42' ]
```

It supports key/value arguments, which it returns in an object as a last argument. The output mimics the standard arguments for custom Nunjucks tags.

```javascript
parser(`first_name last_name age=68 height="5' 7\\""`);

// [ 'first_name',
//   'last_name',
//   { __keywords: true, age: '68', height: '"5\' 7\\""' } ]
```

The parser also takes a function as an optional second argument, which will evaluate each value before returning the arguments.

```javascript
const { Liquid } = require('liquidjs');
const engine = new Liquid();

const evalFunc = arg => engine.evalValueSync(arg, /* some context */)

parser(`foo "bar" 42`, evalFunc);

// [ fooValue, 'bar', 42 ]
```

If the function is async or returns a Promise, then the parser will return an array of Promises, which each resolve to the corresponding evaluated argument (or keywords arg object).

## Example

Here's an example of the parser being used to create a custom `liquidjs` tag:

```javascript
const parser = require('liquid-args');
const { Liquid } = require('liquidjs');
const engine = new Liquid();

engine.registerTag('jsonify', {
    parse: function (tagToken) {
        this.args = tagToken.args;
    },
    render: async function (ctx, emitter, hash) {
        const evalValue = arg => this.liquid.evalValue(arg, ctx);
        this.args = parser(this.args, evalValue);
        return JSON.stringify(await Promise.all(this.args));
    }
});
```

### TypeScript 

When using TypeScript, the parser optionally accepts two generics, one defining positional arguments and another defining an object of keyword arguments.

```typescript
import parser from 'liquid-args';

let args: string[] = parser(`foo "bar" 42`);

let kwargs = parser<[string, string], { age: string, height: string }>(
  `first_name last_name age=68 height="5' 7\\""`
);

// pass a function if you want to specify non-string return types
let evaluated = parser<[], { age: number, height: string }>(
  `age=68 height="5' 7\\""`,
  (arg: string) => Number(arg) || arg
);
```
