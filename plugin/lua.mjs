import * as os from 'os';
import {LuaSession, tolua, fromlua} from '../lib/lua-interop/lua-interop.mjs';

export const server = 
{
    lua:async (client,data)=>
    {
        return await client._lua.eval(data);
    },
    print:async (server,serverclient,data)=>
    {
        console.log(await server._lua.send(`(${tolua(data)})`))
    },
    init:(server)=>
    {
        let luapath = os.platform() == 'win32' ? './luajit/bin/mingw64/luajit.exe' : 'luajit';
        server._lua = new LuaSession(luapath,'./init.lua');
    }
}

export const client =
{
    ['luasend']:async (client,data)=>
    {
        return await client._lua.send(`(${tolua(data)})`);
    },
    ['luaeval']:async (client,data)=>
    {
        return await client._lua.eval(data);
    },
    init:async (client)=>
    {
        let luapath = os.platform() == 'win32' ? './luajit/bin/mingw64/luajit.exe' : 'luajit';
        client._lua = new LuaSession(luapath,'./init.lua');
    },
}