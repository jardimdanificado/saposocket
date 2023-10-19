import { LuaSession, tolua, fromlua } from './lua-interop.mjs';

const lua = new LuaSession('luajit/bin/mingw64/luajit.exe');

const complexTestObject = {
    a: 1,
    b: 2,
    c: { a: 2, b: [1, 2, 3, 4, 5] }
};

console.log(await lua.eval('text("Hello from Node.js!")'))
const luaResult = await lua.json(tolua(complexTestObject));
console.log('Received from Lua:', luaResult);
lua.close();