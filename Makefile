NODE_BIN=./node_modules/.bin
ELECTRON=$(NODE_BIN)/electron
VERSION?=0.1.0

all: dep

run:
	@$(ELECTRON) .

dep:
	@npm install

clean:
	@rm -rf build
	@rm -rf node_modules

package: clean dep
	@nicns --in icons/icon.png --out icons/icon.icns
	@mkdir -p build
	@cd build && electron-packager ../ CaptainsLog \
		--platform=darwin \
		--arch=x64 \
		--version=0.24.0 \
		--icon=../icons/icon.icns \
		--app-bundle-id=CaptainsLog \
		--app-version=${VERSION} \
		--ignore='index.html' \
		--ignore='Makefile' \	
		--ignore='README.md' \
		--ignore='build' \
		--ignore='page' \
		--ignore='icons' \
		--ignore='.gitignore'
	@echo "done"

dist: package
	@mkdir -p dist
	@rm build/CaptainsLog-darwin-x64/LICENSE
	@rm build/CaptainsLog-darwin-x64/version
	@cd build && zip -r ../dist/CaptainsLog-darwin-x64-${VERSION}.zip CaptainsLog-darwin-x64
