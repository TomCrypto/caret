SRCDIR        := src
OBJDIR        := obj
BINDIR        := bin

RM            := rm -rf
FIND          := find

FIRMWARE      := caret.elf
SEGMENT       := 0x*\.bin

SOURCES       := $(shell $(FIND) $(SRCDIR)/ -name '*.nim')
MAIN          := $(SRCDIR)/main.nim

ifeq ($(filter $(MAIN),$(SOURCES)),)
    $(error Source file '$(MAIN)' not found)
endif

# TODO: debug and testing flag

NIM           := nim compile
NIM_ARGS      := --path:$(SRCDIR) \
                 --gc:none        \
                 -d:release       \
                 --cpu:xtensa     \
                 --os:standalone  \
                 --threads:off    \
                 --skipUserCfg    \
                 --nimcache:$(OBJDIR)

# Hardware settings below

DEVICE        ?= /dev/ttyUSB0
BAUDRATE      ?= 1500000

DEVICE_ARGS   := --port $(DEVICE) --baud $(BAUDRATE)
FLASH_ARGS    := --flash_freq 40m \
                 --flash_mode dio \
                 --flash_size 32m

ESPTOOL       := esptool.py
ESP_PARSE     := $(ESPTOOL) $(DEVICE_ARGS) elf2image $(FLASH_ARGS)
ESP_FLASH     := $(ESPTOOL) $(DEVICE_ARGS) write_flash $(FLASH_ARGS) --verify

find_offsets   = $(patsubst $1/%.bin,%,$(shell $(FIND) $1/ -name $(SEGMENT)))
get_segments   = $(foreach off,$(call find_offsets,$1),$(off) $1/$(off).bin)


default: $(BINDIR)/$(FIRMWARE)


$(BINDIR)/$(FIRMWARE): $(SOURCES)
	$(NIM) $(NIM_ARGS) --out:$@ $(MAIN)


.PHONY: upload
upload: $(BINDIR)/$(FIRMWARE)
	$(RM) $(BINDIR)/$(SEGMENT); $(ESP_PARSE) -o $(BINDIR)/ $<
	$(ESP_FLASH) $(call get_segments,$(BINDIR)) # uploading..


.PHONY: clean
clean:
	$(RM) $(OBJDIR)/*
	$(RM) $(BINDIR)/*