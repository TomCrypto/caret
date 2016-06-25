SRCDIR        := src
OBJDIR        := obj
BINDIR        := bin

ECHO          := echo
RM            := rm -rf
FIND          := find

FIRMWARE      := caret.elf
SEGMENT       := 0x*\.bin

DEPENDENCIES  := $(lastword $(MAKEFILE_LIST)) nim.cfg

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
                 --noMain         \
                 --opt:size       \
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

# TODO: better way to do this?

get_offset     = $(patsubst $(BINDIR)/%.bin,%,$1)
SEGMENTS      := $(BINDIR)/0x00000.bin \
                 $(BINDIR)/0x40000.bin


default: $(BINDIR)/$(FIRMWARE)


$(BINDIR)/$(FIRMWARE): $(SOURCES) $(DEPENDENCIES)
	$(NIM) $(NIM_ARGS) --out:$@ $(MAIN)
	@$(RM) $(SEGMENTS)  # out of date


$(SEGMENTS): $(BINDIR)/$(FIRMWARE)
	$(ESP_PARSE) -o $(BINDIR)/ $<
	@$(ECHO) "Firmware assembled!"


.PHONY: upload
upload: $(SEGMENTS)
	$(ESP_FLASH) $(foreach seg,$^,$(call get_offset,$(seg)) $(seg))
	@$(ECHO) "Firmware flashed!"


.PHONY: clean
clean:
	$(RM) $(BINDIR)/*
	$(RM) $(OBJDIR)/*