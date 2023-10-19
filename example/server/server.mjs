import * as saposocket from '../../saposocket.mjs'

let server = new saposocket.Server();
server.plugin(await import('../../plugin/file.mjs'));
server.plugin(await import('../../plugin/lua.mjs')); //exemplo: luaevalfile ../../plugin/lua_example/factorial.lua