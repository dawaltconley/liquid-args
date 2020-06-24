const { Liquid } = require('liquidjs');
const randomString = require('randomstring');
const assert = require('assert').strict;
const path = require('path');
const p = (...args) => path.join(__dirname, ...args);

require(p('build.js'));
const parser = require(p('index.js'));

const chars = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-,./;'[]=<>?:"{}+!@#$%^&*()~`;
const vChars = chars.slice(0, 64);
const genFlt = (max, min=0) => ((max - min) * Math.random()) + min;
const genInt = (max, min=0) => Math.round(genFlt(max, min));
const genStr = () => randomString.generate({ length: genInt(40), charset: chars  });
const genVar = randomString.generate({ length: genInt(12), charset: vChars });
const genSep = (str=' ') => str.replace(/\s/g, randomString.generate({ length: genInt(4), charset: ' \n\t\r' }));

const padNum = (num, [pre,dot]) => {
    let z = [...Array(2)].map(() => randomString.generate({ length: genInt(2), charset: '0' }));
    return pre + z[0] + num.toString() + dot + z[1];
}

const qt = (content=genStr(), q='"') => {
    let qr = new RegExp(q, 'g');
    return q + content.replace(qr, `\\${q}`) + q;
}

const args = {
    _: {
        func: genSep,
        args: [', ', ',', ' '],
    },
    str: {
        func: genStr,
        args: ["'", '"'],
    },
    int: {
        args: [ ['',''], ['','.'], ['-',''], ['-','.'] ],
        func: padNum.bind(this, genInt(200)),
    },
    flt: {
        args: [ ['',''], ['-',''] ],
        func: padNum.bind(this, genFlt(200)),
    },
};

const genCtx = (varName, value) => {
    if (!varName) return value;
    let vars = varName.split('.');
    let ctx = {};
    ctx[vars.pop()] = value;
    return genCtx(vars.join('.'), ctx);
}

// const expandKwargs = {
//
// }
//
// class Test extends Object {
//     constructor (output) {
//         super();
//         this.input = [];
//         this.output = JSON.stringify(output);
//         
//     }
//
//     add (input, ctx=null) {
//         this.input.push([ input, ctx ])
//     }
// }
//
// new Test('str', 'int', 'flt');

const tests = (/* _, q, str, num, float */) => {
    const tests = [
        {
            input: [
                [ `{% test %}` ]
            ],
            output: '[]',
        }
    ];
    let next, _, q, str, num, float, varName;
    let [ foo, bar, baz ] = [...Array(3)].map(() => genVar());
    let fooBar = foo + '.' + bar;
    let fooBarBaz = fooBar + '.' + baz;
    //
    // str = genStr();
    // next = new Test({ output: `[${qt(str,'"')}]` });
    // vars.forEach(v => {
    //     ['"', "'"].forEach(q => {
    //         next.add(`{% test ${qt(str,q)} %}`);
    //         next.add(`{% assign ${v} = ${qt(str,q)} %}{% test ${v} %}`);
    //     });
    // });
    // varName = vars.join('.');
    // next.add(`{% test ${varName} %}`, genCtx(varName, str))
    //
    // tests.push(next)
    //

    str = genStr();
    tests.push({
            input: [
                [ `{% test ${qt(str,q)} %}` ],
                [ `{% assign ${foo} = ${qt(str,q)} %}{% test ${foo} %}` ],
                [ `{% test ${fooBar} %}`, genCtx(fooBar, str) ]
            ],
            output: `[${qt(str,'"')}]`
        })

    return [
        // {
        //     input: [
        //         [ `{% test %}` ]
        //     ],
        //     output: '[]',
        // },
        {
            input: [
                [ `{% test ${qt(str,q)} %}` ],
                [ `{% assign str = ${qt(str,q)} %}{% test str %}` ],
                [ `{% test ${fooBar} %}`, genCtx(fooBar, str) ]
            ],
            output: `[${qt(str,'"')}]`
        },
        {
            input: [
                [ `{% test 45 'foo' %}` ],
                [ `{% test 45. "foo" %}` ],
                [ `{% test 45.0, 'foo' %}` ],
                [ `{% test 0045, 'foo' %}` ],
                [ `{% assign foo = 45 %}{% test foo, "foo" %}` ],
                [ `{% test foo.num, foo.str %}`, {foo:{num:45,str:"foo"}} ]
            ],
            output: '[45,"foo"]'
        },
        {
            input: [
                [ `{% test 0.42 %}` ],
                [ `{% test 000.42 %}` ],
                [ `{% test 0.4200 %}` ],
                [ `{% assign n = 0.42 %}{% test n %}` ],
                [ `{% test foo.n %}`, {foo:{n:.42}} ],
            ],
            output: '[0.42]'
        },
        {
            input: [
                [ `{% test "O'Malley", age=68 %}` ],
                [ `{% test 'O\\'Malley', age=68.0 %}` ],
                [ `{% test name, age=age %}`, {name:"O'Malley",age:68} ],
                [ `{% test person.name, age=person.age %}`, {person:{name:"O'Malley",age:68}} ],
            ],
            output: `["O'Malley",{"__keywords":true,"age":68}]`
        },
        {
            input: [
                [ `{% test name="O'Malley", age=68 %}` ],
                [ `{% test name='O\\'Malley' age=68.0 %}` ],
                [ `{% test name=name, age=age %}`, {name:"O'Malley",age:68} ],
                [ `{% test name=person.name age=person.age %}`, {person:{name:"O'Malley",age:68}} ],
            ],
            output: `[{"__keywords":true,"name":"O'Malley","age":68}]`
        },
        {
            input: [
                [ `{% test 'foo', 'bar', "baz" name="O'Malley", age=68 %}` ],
                [ `{% test 'foo' "bar" baz name='O\\'Malley' age=68.0 %}`, {baz:'baz'} ],
                [ `{% test a1, a2, a3, name=name, age=age %}`, {a1:'foo',a2:'bar',a3:'baz',name:"O'Malley",age:68} ],
                [ `{% test a.foo a.bar a.baz name=person.name age=person.age %}`, {a:{foo:'foo',bar:'bar',baz:'baz'},person:{name:"O'Malley",age:68}} ],
            ],
            output: `["foo","bar","baz",{"__keywords":true,"name":"O'Malley","age":68}]`
        },
        {
            input: [
                [ `{% test 'foo', "bar", "foo,bar,baz" %}` ]
            ],
            output: `["foo","bar","foo,bar,baz"]`
        }
    ]
};

const runTests = async (name, tagConfig) => {
    const engine = new Liquid();
    engine.registerTag('test', tagConfig);
    for (const { input, output } of tests) {
        for (const i of input) {
            try {
                const parsed = await engine.parseAndRender(...i);
                assert.equal(parsed, output);
            } catch (e) {
                console.error(`Error while testing ${name}`);
                throw e;
            }
        }
    }
}

const sync = runTests('sync', {
    parse: function (tagToken) {
        this.args = tagToken.args;
    },
    render: function (ctx) {
        const evalValue = arg => this.liquid.evalValueSync(arg, ctx);
        this.args = parser(this.args, evalValue);
        return JSON.stringify(this.args);
    }
});

const async = runTests('async', {
    parse: function (tagToken) {
        this.args = tagToken.args;
    },
    render: async function (ctx) {
        const evalValue = arg => this.liquid.evalValue(arg, ctx);
        this.args = await Promise.all(parser(this.args, evalValue));
        return JSON.stringify(this.args);
    }
});

Promise.all([ sync, async ])
    .then(() => console.log('All tests passed.'));
