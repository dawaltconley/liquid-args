const { Liquid } = require('liquidjs');
const assert = require('assert').strict;
const path = require('path');
const p = (...args) => path.join(__dirname, ...args);

require(p('build.js'));
const parser = require(p('index.js'));

const tests = [
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
];

const runTests = (name, tagConfig) => {
    const engine = new Liquid();
    engine.registerTag('test', tagConfig);
    for (const { input, output } of tests) {
        for (const i of input) {
            const parse = engine.parseAndRenderSync.bind(engine, ...i);
            try {
                assert.equal(parse(), output);
            } catch (e) {
                console.error(`Error while testing ${name}`);
                throw e;
            }
        }
    }
}

runTests('default', {
    parse: function (tagToken) {
        this.args = tagToken.args;
    },
    render: function (ctx) {
        const evalValue = arg => this.liquid.evalValueSync.call(this.liquid, arg, ctx);
        this.args = parser(this.args, evalValue);
        return JSON.stringify(this.args);
    }
});

runTests('shortcode', parser.shortcode(function () {
    return JSON.stringify(this.args);
}));

console.log('All tests passed.');
