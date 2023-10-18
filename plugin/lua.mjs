import {LuaSession, tolua, fromlua} from '../lib/lua-interop/lua-interop.mjs';

export const server = 
{
    lua:async (client,data)=>
    {
        return await client._lua.send(`(${tolua(data)})`);
    },
    print:async (server,serverclient,data)=>
    {
        console.log(await server._lua.send(`(${tolua(data)})`))
    },
    init:(server)=>
    {
        server._lua = new LuaSession('./luajit/bin/mingw64/luajit.exe','./init.lua');
    }
}

export const client =
{
    lua:async (client,data)=>
    {
        return await client._lua.send(`(${tolua(data)})`);
    },
    init:async (client)=>
    {
        client._lua = new LuaSession('./luajit/bin/mingw64/luajit.exe','./init.lua');
    },
}