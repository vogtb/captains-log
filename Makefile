NODE_BIN=./node_modules/.bin
ELECTRON=$(NODE_BIN)/electron

all: dep build

run: build
	@$(ELECTRON) .

dep:
	@npm install

build: clean
	@mkdir build
	@mkdir build/renderer
	cp -r renderer build/

clean:
	@rm -rf build

package: build
	@cp -av node_modules/electron-prebuilt/dist/Electron.app build/
	@mv build/Electron.app build/CaptainsLog.app
	@mkdir -p build/CaptainsLog.app/Contents/Resources/app/renderer
	@cp -av main.js build/CaptainsLog.app/Contents/Resources/app/
	@cp -av package.json build/CaptainsLog.app/Contents/Resources/app/
	@cp -av build/renderer build/CaptainsLog.app/Contents/Resources/app
	@cp -av lib/Info.plist build/CaptainsLog.app/Contents/Info.plist
	@echo "done"
