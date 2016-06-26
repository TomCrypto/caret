# TODO: section pragma for variables

import macros


const
    ROM = ".irom0.text"


macro section(param: string, body: untyped): stmt =
    let sectionName = strVal(if param.kind == nnkSym: param.symbol.getImpl else: param)
    let codegenAttr = "$# __attribute__((section(\"" & sectionName & "\"))) $#$#"

    let pragma = body.findChild(it.kind == nnkPragma)

    pragma.add(newNimNode(nnkExprColonExpr).add(newIdentNode("codegenDecl"),
                                                newStrLitNode(codegenAttr)))

    return body


export section, ROM