# Flavor variants: bchn (default), knuth
# Build Knuth: make VARIANT=knuth FLAVOR=knuth
ARCHES ?= x86 arm riscv
export FLAVOR ?= bchn
include s9pk.mk
