CONFIG        ?= dev

ifeq ($(filter dev test prod,$(CONFIG)),)
    $(error Invalid configuration '$(CONFIG)')
endif

NODE          := node
CURL          := curl -Ls
ELM           := elm

WEBROOT       := public
JS            := javascript

GEN_JS_FILES  := Messages.js
GENERATED_JS  := $(addprefix $(WEBROOT)/$(JS)/,$(GEN_JS_FILES))
RES_JS_FILES  := https://cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/excanvas.min.js                \
                 https://cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.colorhelpers.min.js     \
                 https://cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot.canvas.min.js      \
                 https://cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot.categories.min.js  \
                 https://cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot.crosshair.min.js   \
                 https://cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot.errorbars.min.js   \
                 https://cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot.fillbetween.min.js \
                 https://cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot.image.min.js       \
                 https://cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot.min.js             \
                 https://cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot.navigate.min.js    \
                 https://cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot.pie.min.js         \
                 https://cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot.resize.min.js      \
                 https://cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot.selection.min.js   \
                 https://cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot.stack.min.js       \
                 https://cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot.symbol.min.js      \
                 https://cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot.threshold.min.js   \
                 https://cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot.time.min.js        \
                 https://raw.githubusercontent.com/markrcote/flot-axislabels/master/jquery.flot.axislabels.js \
                 https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0/jquery.min.js
RESOURCES_JS  := $(addprefix $(WEBROOT)/$(JS)/,$(notdir $(RES_JS_FILES)))


define download-js
$$(WEBROOT)/$$(JS)/$(notdir $1):
	$$(CURL) -o $$@ $1
endef


$(foreach url,$(RES_JS_FILES),$(eval $(call download-js,$(url))))


$(WEBROOT)/$(JS)/%.js: %.elm
	$(ELM) make --output $@ $<


.PHONY: build
build: $(RESOURCES_JS) $(GENERATED_JS)


.PHONY: run-station
run-station: build
	$(NODE) . $(CONFIG)