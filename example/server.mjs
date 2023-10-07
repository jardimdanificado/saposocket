import * as saposocket from '../saposocket.mjs'

let server = new saposocket.Server();
await server.plugin('std');