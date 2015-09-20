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
	@jsx -x jsx renderer/jsx/ renderer/js/
	@mkdir -p build
	@electron-packager ./ CaptainsLog \
	  --out=build \
		--platform=darwin \
		--arch=x64 \
		--version=0.24.0 \
		--icon='icons/icon.icns' \
		--app-bundle-id=CaptainsLog \
		--app-version=${VERSION} \
		--ignore="(index.html|README.md|Makefile|page/|dist/|build/|favicon.ico)"
	@echo "done"

dist: package
	@mkdir -p dist
	@rm build/CaptainsLog-darwin-x64/version
	@cd build && zip -r ../dist/CaptainsLog-darwin-x64-${VERSION}.zip CaptainsLog-darwin-x64
