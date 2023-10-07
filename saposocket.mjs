import * as WebSocket from 'ws';

export class Client 
{
    func = {};
    plugin = async function(mod)
    {
        if(typeof(mod) == 'string')
        {
            if (mod.includes('.'))
                mod = await import(mod)
            else
                mod = await import('./plugin/client/' + mod + '.mjs');
        }

        if (mod.main) 
        {
            return await mod.main(this);
        }
        else
        {
            for(let i in mod)
            {
                this.func[i] = mod[i];
            }
            return this;
        }
    }
    constructor(ipaddr,callback)
    {
        this.socket = new WebSocket.WebSocket('ws://' + (ipaddr) + '/');
        
        this.socket.addEventListener('open', (event) => 
        {
            callback(this.socket,'');
        });

        this.socket.addEventListener('close', (event) => 
        {
            //rl.close();
            this.socket.close();
            process.exit();
        });
    
        this.call = function(id, data)
        {
            this.socket.send(JSON.stringify({
                id: id,
                data: data
            }))
        }

        this.selfCall = function(id, data)
        {
            this.func[id](JSON.stringify({
                id: id,
                data: data
            }))
        }

        this.socket.addEventListener('message', (event) => 
        {
            let data = JSON.parse(event.data);
            if(data.id && this.func[data.id])
            {
                this.selfCall(data.id,data);
            }
        });

    }
}

export class Server 
{
    func = {}
    plugin = async function(mod)
    {
        if(typeof(mod) == 'string')
        {
            if (mod.includes('.'))
                mod = await import(mod)
            else
                mod = await import('./plugin/server/' + mod + '.mjs');
        }

        if (mod.main) 
        {
            return await mod.main(this);
        }
        else
        {
            for(let i in mod)
            {
                this.func[i] = mod[i];
            }
            return this;
        }
    }
    constructor(port='8080')
    {
        const server = new WebSocket.WebSocketServer({ port: port });
        server.on('connection', (socket,request) => 
        {
            const client = {socket,request};
            socket.call = function(id, data)
            {
                socket.send(JSON.stringify({
                    id: id,
                    data: data
                }))
            }
            console.log('client '+ request.connection.remoteAddress + ' connected.');
            socket.on('message', async (message) => 
            {
                let data = JSON.parse(message);
                if(data.id)
                {
                    if(typeof(this.func[data.id]) == 'function')
                    {
                        this.func[data.id](this,client,data.data || {});
                    }
                    else
                    {
                        socket.call('log',{message:'unknown command: '+data.id});
                    }
                }
            });

            socket.on('close', () => 
            {
                console.log('client '+ request.connection.remoteAddress + ' disconnected.');
                socket.close();
            });
        });
        console.log('server running on port 8080');
    }
}