Caret
=====

This is an experiment for running Nim code on the ESP8266 ("NodeMCU") microcontroller. The end goal is an extendable framework on which to build autonomous ESP8266 applications, along with an associated web service which acts as a base station providing back-end message aggregation and front-end information display/control panel.

Seriously WIP at the moment and needs a small Nim compiler hack to disable all OS calls and to add support for the Xtensa CPU.

Not meant to be used by others at this time, use at your own risk.

Build
-----

To build the microcontroller firmware, edit `settings.tmpl` with the appropriate settings and rename it to `settings.nim` (the latter is gitignored to ensure sensitive information never ends up in source control).

To run the base station web service, edit `config.tmpl` with the appropriate settings and rename it to `config.js`.

This is not a plug-in library; one is meant to work directly inside the source tree. This may be subject to change in the future.

TODO
----

 - I want my main() back, what is libmain.a doing with it exactly?
 - Finish implementing Wifi interface
 - Finish implementing GPIO and timer (?) modules
 - use correct linker script for full memory utilization? maybe the linker script should be included too
 - determine if/why we need a GC (string manipulation? not really, but maybe for exceptions?)
 - are Maybe types in Nim a superior alternative to exceptions for our purposes here?
 - checkout examples/driver_lib, plenty of interesting code in there to peruse

License
-------

This software is made available under the terms of the MIT license, see the `LICENSE` file for more information. This software uses Espressif's ESP8266 SDK (version 1.5.0) however this is subject to change.