import * as saposocket from '../../saposocket.mjs'

let server = new saposocket.Server();
server.plugin(await import('../../plugin/file.mjs'));