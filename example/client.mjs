import * as saposocket from '../saposocket.mjs'
import {client as func} from './func.mjs'

let client = new saposocket.Client( process.argv[2] || '127.0.0.1:8080',()=>
{
    client.console();
});
