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

Positional = Number / String / Variable

Variable = ( VarName '.' Variable / VarName ) { return text(); }

VarName = [A-z0-9_\-]+ { return text() }

String = (
    '"' ( "\\"["\\] / [^"\n\\] )* '"' /
    "'" ( "\\"['\\] / [^'\n\\] )* "'"
) { return text(); }

Number = [0-9]+ '.'? [0-9]* { return text(); }

_ = [,]?[ \t\n\r]+
