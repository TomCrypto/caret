{.push stack_trace: off, profiler:off.}

proc panic(s: string) {. importc: "panic" .}
proc rawoutput(s: string) {. importc: "rawoutput" .}

{.pop.}