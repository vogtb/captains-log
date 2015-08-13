NODE_BIN=./node_modules/.bin
ELECTRON=$(NODE_BIN)/electron
ASAR=$(NODE_BIN)/asar

all: dep build

run: build
	@$(ELECTRON) .

dep:
	@npm install

build: clean
	@mkdir build
	@mkdir build/renderer
	# move renderer scripts
	cp -r renderer build/

clean: clean-asar
	@rm -rf ./build

asar: clean-asar build
	@mkdir asar
	@cp ./main.js asar/
	@cp ./package.json asar/
	@cp -r ./build asar/
	@cd asar; npm install --production; cd ..
	asar pack renderer build/app.asar

clean-asar:
	@rm -rf ./asar

package: clean asar
	@cp -av node_modules/electron-prebuilt/dist/Electron.app build/
	@mv build/Electron.app build/CaptainsLog.app
	@mv build/app.asar build/CaptainsLog.app/Contents/Resources/
	@echo "done"
