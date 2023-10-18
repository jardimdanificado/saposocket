import {LuaSession, tolua, fromlua} from '../lib/lua-interop/lua-interop.mjs';

export const server = 
{
    init:(server)=>
    {
        server._lua = new LuaSession(os.platform() == 'win32' ? '../lib/lua-interop/luajit/bin/mingw64/luajit.exe' : 'luajit');
    }
}

export const client =
{
    
}