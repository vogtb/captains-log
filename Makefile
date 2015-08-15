NODE_BIN=./node_modules/.bin
ELECTRON=$(NODE_BIN)/electron

all: dep

run:
	@$(ELECTRON) .

dep:
	@npm install

clean:
	@rm -rf build
	@rm -rf node_modules

package: clean dep
	@mkdir -p build
	@electron-packager ./ build/CaptainsLog --platform=darwin --arch=x64 --version=0.24.0
	@echo "done"
	@cd

dist: package
	@mkdir -p dist
	@cd build && zip -r ../dist/CaptainsLog-darwin-x64.zip CaptainsLog-darwin-x64
	# @cp build/CaptainsLog-darwin-x64.zip dist/
	# @rm build/CaptainsLog-darwin-x64.zip