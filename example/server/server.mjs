import * as saposocket from '../../saposocket.mjs'

let server = new saposocket.Server();

server.plugin(saposocket.std.unsafe);
server.plugin(await import('../../plugin/file.mjs'));
server.register('.regtest', ()=>console.log('regtest ok'));