# Captain's Log
Timestamped notes written to a yaml file in the directory of your choice.

![alt tag](/page/img/demo.gif)

When you're writing code it's easy to lose track of what you did and when you did it. By timestamping your notes and writing them to a yaml file containing the raw text, you can keep your notes and grep them too.

## Development
To run the electron app and see your changes on the fly you need to run:
```bash
make run
```
and you need to watch the jsx files to compile them.
```bash
jsx --watch -x jsx renderer/jsx/ renderer/js/
```


## Building/Packaging

```bash
make package
```

## Distributing
```bash
make dist VERSION=<version number>
```
Then tag and upload through github's releases section of this repo.

## License
The MIT License (MIT)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.