## Usage

### Importing the Library

```javascript
import { LuaSession, fromlua, tolua } from 'lua-interop';
```

### Initializing a Lua Session

To start a Lua session, you can create an instance of `LuaSession`:

```javascript
const lua = new LuaSession(luaPath, luaEntryPoint);
```

- `luaPath` (optional): The path to the LuaJIT executable (default is 'luajit').
- `luaEntryPoint` (optional): The path to the Lua client script (default is 'init.lua').

### Sending Commands

You can send Lua commands to the LuaJIT process and receive the results using the `eval` method:

```javascript
const result = await lua.eval("your_lua_code_here");
```

### Sending Data

You can use the `send`, `say`, and `log` methods to send data to the Lua process:

```javascript
await lua.send({ key: 'value' });
await lua.say("This is a message");
await lua.log("This is a log entry");
```

### Receiving Results

The results returned from the LuaJIT process can be in JSON format, and you can use the `fromlua` and `tolua` functions to convert between JavaScript objects and Lua tables.

### Closing the Session

Don't forget to close the Lua session when you're done:

```javascript
lua.close();
```

## Example

Here's a simple example of how to use `lua-interop`:

```javascript
import { LuaSession, fromlua } from 'lua-interop';

const lua = new LuaSession();

(async () => {
  const result = await lua.eval('return { message = "Hello from Lua!" }');
  const jsResult = fromlua(result);
  console.log(jsResult.message);
  lua.close();
})();
```

## License

This project is licensed under the [GNU General Public License version 3 (GPL-3.0)](https://www.gnu.org/licenses/gpl-3.0.html).

- You are free to use, modify, and distribute this software.
- Any derivative work based on this software must also be released under the GPLv3.
- This software is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
- You should have received a copy of the GNU General Public License along with this program. If not, see [https://www.gnu.org/licenses/](https://www.gnu.org/licenses/).

By using this software, you agree to comply with the terms of the GNU General Public License version 3.

## Acknowledgments

- [LuaJIT](https://luajit.org/): The Lua Just-In-Time Compiler used in this project.
- [luatils](https://github.com/jardimdanificado/luatils): The utils lib used in this project.
- [json.lua](https://github.com/rxi/json.lua): The JSON lib used in this project.