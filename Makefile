.PHONY: build

all: build

npmupdate:
	npm install

build: npmupdate
	npm run build
