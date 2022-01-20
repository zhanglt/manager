﻿# Overview
NeuVector Security Center Admin Console for the SUSE NeuVector Container Security Platform.
A viewable version of docs can be seen at https://open-docs.neuvector.com
The container images for the preview version can be pulled from the NeuVector Docker Hub registry at:
+ neuvector/manager.preview:5.0.0-preview.1
+ neuvector/controller.preview:5.0.0-preview.1
+ neuvector/enforcer.preview:5.0.0-preview.1
+ neuvector/scanner.preview:latest
+ neuvector/updater.preview:latest

# Bugs & Issues
Please submit bugs and issues to [neuvector/neuvector](//github.com/neuvector/neuvector/issues) with a title starting with `[UI] `.

Or just [click here](//github.com/neuvector/neuvector/issues/new?title=%5BUI%5D%20) to create a new issue.

# License

Copyright © 2016-2022 [NeuVector Inc](https://neuvector.com). All Rights Reserved

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

# Coding standard
### Naming Convention

We mostly follow Java's and Scala's standard naming conventions.

### Line Length

- Limit lines to 100 characters.
- The only exceptions are import statements and URLs (although even for those, try to keep them under 100 chars).

### Spacing and Indentation

- Use 2-space indentation in general.
  ```scala
  if (true) {
    println("Wow!")
  }
  ```

- For classes whose header doesn't fit in a single line, put the extend on the next line with 2 space indent, and add a blank line after class header.
  ```scala
  class Foo(val param1: String, val param2: String,
            val param3: Array[Byte])
    extends FooInterface  // 2 space here
    with Logging {

    def firstMethod(): Unit = { ... }  // blank line above
  }
  ```

### Infix Methods

__Do NOT use infix notation__ for methods that aren't symbolic methods (i.e. operator overloading).
```scala
// Correct
list.map(func)
string.contains("foo")

// Wrong
list map (func)
string contains "foo"

// But overloaded operators should be invoked in infix style
arrayBuffer += elem
```
