import * as saposocket from '../../saposocket.mjs'

let client = new saposocket.Client( process.argv[2] ?? '127.0.0.1:8080',async ()=>
{

    //client.call('fsend')
    client.plugin(await import('../../plugin/file.mjs'));
    client.console();
});
