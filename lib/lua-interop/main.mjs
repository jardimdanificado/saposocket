import { LuaSession, LuaSessionManager, tolua, fromlua } from './lua-interop.mjs';

const luam = new LuaSessionManager('luajit/bin/mingw64/luajit.exe', 'init.lua',4);
const lua = new LuaSession('luajit/bin/mingw64/luajit.exe');

const complexTestObject = {
    a: 1,
    b: 2,
    c: { a: 2, b: [1, 2, 3, 4, 5] }
};

const luaOperations = [
    luam.json(tolua({ data: "Operation 1" })),
    luam.eval('text("Operation 2 - luam.eval")'),
    luam.text('Operation 3 - luam.text'),
    luam.eval('text("Operation 4 - luam.eval")'),
    luam.text('Operation 5 - luam.text'),
    luam.json(tolua({ data: "Operation 6" })),
    luam.json(tolua({ data: "Operation 7" })),
    luam.json(tolua({ data: "Operation 8" })),
    luam.json(tolua({ data: "Operation 9" })),
    luam.json(tolua({ data: "Operation 10" })),
    luam.json(tolua({ data: "Operation 11" })),
    luam.json(tolua({ data: "Operation 12" })),
    luam.json(tolua({ data: "Operation 13" })),
    luam.json(tolua({ data: "Operation 14" })),
    luam.json(tolua({ data: "Operation 15" })),
    luam.eval('text("Operation 16 - luam.eval")'),
    luam.eval('text("Operation 17 - luam.eval")'),
    luam.text('Operation 18 - luam.text'),
    luam.eval('text("Operation 19 - luam.eval")'),
    luam.text('Operation 20 - luam.text'),
    luam.json(tolua({ data: "Operation 21" })),
    luam.json(tolua({ data: "Operation 22" })),
    luam.json(tolua({ data: "Operation 23" })),
    luam.json(tolua({ data: "Operation 24" })),
    luam.json(tolua({ data: "Operation 25" })),
];
let luaResults = [];
// Execute as operações em um loop
for (const operation of luaOperations) 
{
    luaResults.push(operation);
}

// Use Promise.all para aguardar a conclusão de todas as Promises
const allResults = await Promise.all(luaResults);

console.log(allResults);

lua.close();
luam.close();