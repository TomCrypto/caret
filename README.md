Caret
=====

This is an experiment for running Nim code on the ESP8266 ("NodeMCU") microcontroller.

Seriously WIP and needs a small Nim compiler hack to disable all OS calls and to add support for the XTensa CPU.

Not meant to be used by others at this time.

To run, edit `settings.tmpl` with the appropriate settings and rename it `settings.nim` (the latter is gitignored to ensure sensitive information never ends up in source control).

TODO
----

 - I want my main() back, what is libmain.a doing with it exactly?
 - Finish implementing protocol layer and serial communication interface + python receiver script
 - Finish implementing GPIO and timer (?) modules
 - use correct linker script for full memory utilization? maybe the linker script should be included too
 - determine if/why we need a GC (string manipulation? not really, but maybe for exceptions?)
 - are Maybe types in Nim a superior alternative to exceptions for our purposes here?
 - checkout examples/driver_lib, plenty of interesting code in there to peruse

License
-------

This software is made available under the terms of the MIT license, see the LICENSE file for more information. This software uses Espressif's ESP8266 SDK (version 1.2.0) however this is subject to change.
