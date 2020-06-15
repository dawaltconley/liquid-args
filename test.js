const { Liquid } = require('liquidjs');
const assert = require('assert').strict;
const path = require('path');
const p = (...args) => path.join(__dirname, ...args);

require(p('build.js'));
const args = require(p('parser.js'));

const engine = new Liquid();

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
        output: `["O'Malley",{"age":68,"__keywords":true}]`
    },
    {
        input: [
            [ `{% test name="O'Malley", age=68 %}` ],
            [ `{% test name='O\\'Malley' age=68.0 %}` ],
            [ `{% test name=name, age=age %}`, {name:"O'Malley",age:68} ],
            [ `{% test name=person.name age=person.age %}`, {person:{name:"O'Malley",age:68}} ],
        ],
        output: `[{"name":"O'Malley","age":68,"__keywords":true}]`
    },
    {
        input: [
            [ `{% test 'foo', 'bar', "baz" name="O'Malley", age=68 %}` ],
            [ `{% test 'foo' "bar" baz name='O\\'Malley' age=68.0 %}`, {baz:'baz'} ],
            [ `{% test a1, a2, a3, name=name, age=age %}`, {a1:'foo',a2:'bar',a3:'baz',name:"O'Malley",age:68} ],
            [ `{% test a.foo a.bar a.baz name=person.name age=person.age %}`, {a:{foo:'foo',bar:'bar',baz:'baz'},person:{name:"O'Malley",age:68}} ],
        ],
        output: `["foo","bar","baz",{"name":"O'Malley","age":68,"__keywords":true}]`
    },
];

engine.registerTag('test', {
    parse: function (tagToken) {
        this.args = args.parse(tagToken.args);
    },
    render: function (scope) {
        const evalValue = arg => this.liquid.evalValueSync.call(this.liquid, arg, scope);
        const args = this.args.map(function evalArg(arg) {
            if (arg.__keywords === true) {
                delete arg.__keywords;
                for (const key in arg) {
                    arg[key] = evalArg(arg[key]);
                }
                arg.__keywords = true;
                return arg;
            }
            return evalValue(arg);
        });
        return JSON.stringify(args);
    }
});

for (const { input, output } of tests) {
    for (const i of input) {
        const parse = engine.parseAndRenderSync.bind(engine, ...i);
        assert.equal(parse(), output);
    }
}

console.log('All tests passed.');
