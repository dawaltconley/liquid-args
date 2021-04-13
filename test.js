const { Liquid } = require('liquidjs');
const assert = require('assert').strict;
const path = require('path');
const p = (...args) => path.join(__dirname, ...args);

require(p('build.js'));
const parser = require(p('index.js'));

const tests = [
    {
        input: [
            [ `{% test %}` ]
        ],
        output: '[]',
    },
    {
        input: [
            [ `{% test 'foobar' %}` ],
            [ `{% test "foobar" %}` ],
            [ `{% assign str = 'foobar' %}{% test str %}` ],
            [ `{% test foo.bar %}`, {foo:{bar:'foobar'}} ]
        ],
        output: '["foobar"]'
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
            [ `{% test 'O\\'Malley',    age=68.0 %}` ],
            [ `{% test name,   age=age %}`, {name:"O'Malley",age:68} ],
            [ `{% test person.name,age=person.age %}`, {person:{name:"O'Malley",age:68}} ],
        ],
        output: `["O'Malley",{"__keywords":true,"age":68}]`
    },
    {
        input: [
            [ `{% test name="O'Malley",\nage=68 %}` ],
            [ `{% test name='O\\'Malley' age=68.0 %}` ],
            [ `{% test name=name, age=age %}`, {name:"O'Malley",age:68} ],
            [ `{% test name=person.name age=person.age %}`, {person:{name:"O'Malley",age:68}} ],
        ],
        output: `[{"__keywords":true,"name":"O'Malley","age":68}]`
    },
    {
        input: [
            [ `{% test 'foo',\r'bar',\n"baz"    name="O'Malley", age=68 %}` ],
            [ `{% test 'foo'\r\r\r"bar" baz name='O\\'Malley' age=68.0 %}`, {baz:'baz'} ],
            [ `{% test a1,a2,a3,name=name,age=age %}`, {a1:'foo',a2:'bar',a3:'baz',name:"O'Malley",age:68} ],
            [ `{% test a.foo a.bar a.baz name=person.name age=person.age %}`, {a:{foo:'foo',bar:'bar',baz:'baz'},person:{name:"O'Malley",age:68}} ],
        ],
        output: `["foo","bar","baz",{"__keywords":true,"name":"O'Malley","age":68}]`
    },
    {
        input: [
            [ `{% test 'foo' , 'bar' %}` ],
            [ `{% test 'foo' ,'bar' %}` ],
            [ `{% test 'foo',,,'bar' ,,'baz' %}` ],
            [ `{% test 'foo''bar''baz' %}` ],
        ],
        error: {
            name: 'RenderError',
            originalError: {
                name: 'SyntaxError',
                message: /Expected \[, \\t\\n\\r\] .*/
            }
        }
    },
    {
        input: [
            [ `{% test 'foo', 4..38 %}` ],
            [ `{% test n=3...95 %}` ],
            [ `{% test .23 %}` ],
            [ `{% test 928.. %}` ],
        ],
        error: {
            name: 'RenderError',
            originalError: {
                name: 'SyntaxError',
                message: /Expected .* but "\." found\./
            }
        }
    },
    {
        input: [
            [ `{% test .foo.bar.baz %}`, {foo:{name:'foo',bar:{baz:'baz'}}} ],
            [ `{% test foo.bar foo.name.. %}`, {foo:{name:'foo',bar:{baz:'baz'}}} ],
            [ `{% test name=foo.name baz=foo..bar.baz %}`, {foo:{name:'foo',bar:{baz:'baz'}}} ],
        ],
        error: {
            name: 'RenderError',
            originalError: {
                name: 'SyntaxError',
                message: /Expected .* but "\." found\./
            }
        }
    },
    {
        input: [
            [ `{% test f00/bar %}` ],
            [ `{% test var~name %}` ],
            [ `{% test invalid&chars %}` ],
        ],
        error: {
            name: 'RenderError',
            originalError: {
                name: 'SyntaxError',
                message: /Expected .* but "." found\./
            }
        }
    },
    {
        input: [
            [ `{% test name='O'Malley' %}` ],
            [ `{% test name="O"Malley" %}` ],
        ],
        error: {
            name: 'TokenizationError',
            originalError: {
                name: 'Error',
                message: /tag .* not closed/
            }
        }
    },
];

const runTests = async (name, tagConfig) => {
    const engine = new Liquid();
    engine.registerTag('test', tagConfig);
    for (const { input, output, error } of tests) {
        for (const i of input) {
            try {
                const parse = engine.parseAndRender.bind(engine, ...i);
                if (error) {
                    await assert.rejects(parse, e => {
                        assert.equal(e.name, error.name);
                        assert.equal(e.originalError.name, error.originalError.name);
                        assert.match(e.originalError.message, error.originalError.message);
                        return true;
                    });
                } else {
                    const parsed = await parse();
                    assert.equal(parsed, output);
                }
            } catch (e) {
                console.error(`Error while testing ${name}, ${i}`);
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
    .then(() => console.log('All tests passed.'))
    .catch(e => console.error(e));
