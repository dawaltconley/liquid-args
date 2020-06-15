{
    var evaluate = this.eval || function (arg) { return arg; };
}

Args = a:Kwargs { return [a] }
    / a:Positional _ args:Args { return [a].concat(args) }
    / a:Positional { return [a] }

Kwargs = a:Keyword _ b:Kwargs {
    return { ...a, ...b };
} / Keyword

Keyword = key:VarName [=] value:Positional {
    const obj = { __keywords: true };
    obj[key] = value;
    return obj;
}

Positional = ( Number / String / Variable ) { return evaluate(text()); }

Variable = VarName '.' Variable / VarName

VarName = [A-z0-9_\-]+ { return text() }

String = '"' ( "\\"["\\] / [^"\n\\] )* '"' / "'" ( "\\"['\\] / [^'\n\\] )* "'"

Number = [0-9]+ '.'? [0-9]*

_ = [,]?[ \t\n\r]+
