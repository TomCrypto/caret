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

 - work out a good place to store message type identifiers and error codes, and how to keep them synced between web service and microcontroller (maybe they shouldn't be linked; web service depends much more heavily on them than the MCU)
 - it's probably best to come up with a sensible settings DSL in Nim and just parse it from NodeJS (pass the settings file as a command line option?)
 - finish implementing WiFi interface
 - consider using Elm framework for front-end? (been meaning to check it out)

In the far future:

 - reclaim main() function (what is libmain.a doing with it exactly?)
 - use correct linker script for full memory utilization? maybe the linker script should be included too
 - determine if/why we need a GC (string manipulation? ...)

Notes to myself:

 - check out examples/driver_lib from the SDK, plenty of interesting code in there to peruse

License
-------

This software is made available under the terms of the MIT license, see the `LICENSE` file for more information. This software uses Espressif's ESP8266 SDK (version 1.5.0) however this is subject to change.