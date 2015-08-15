NODE_BIN=./node_modules/.bin
ELECTRON=$(NODE_BIN)/electron

all: dep

run:
	@$(ELECTRON) .

dep:
	@npm install

clean:
	@rm -rf build

package: clean
	mkdir -p build/osx
	electron-packager ./ build/CaptainsLog --platform=darwin --arch=x64 --version=0.24.0
	@echo "done"
