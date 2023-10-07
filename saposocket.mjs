import * as WebSocket from 'ws';

export class ContainedFunction
{
    constructor(name,func,args)
    {
        this.name = name;
        this.func = func;
        this.args = args;
    }
}

export class MultiFunction
{
    func = [];
    args = [];
    run = function()
    {
        for(let i in this.func)
        {
            this.func[i](args[i]);
        }
    }
    constructor(funcs,args)
    {
        for(let i in funcs)
        {
            this.func.push(new ContainedFunction('',funcs[i],args[i] || []));
        }
    }
}

export class Client 
{
    func = {};
    plugin = async function(_plugin)
    {
        if(_plugin.client)
        {
            _plugin = _plugin.client;
        }

        for(let i in _plugin)
        {
            if(i == 'init')
            {
                _plugin[i](this);
            }
            else
            {
                this.func[i] = _plugin[i];
            }
        }   
    }

    call = function(id, data)
    {
        this.socket.send(JSON.stringify({
            id: id,
            data: data
        }))
    }

    selfCall = function(id, data)
    {
        this.func[id](this,data)
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

        this.socket.addEventListener('message', (event) => 
        {
            let data = JSON.parse(event.data);
            if(data.id && this.func[data.id])
            {
                this.selfCall(data.id,data.data);
            }
        });

    }
}

export class Server 
{
    func = {}
    plugin = async function(_plugin)
    {
        if(_plugin.server)
        {
            _plugin = _plugin.server;
        }

        for(let i in _plugin)
        {
            if(i == 'init')
            {
                _plugin[i](this);
            }
            else
            {
                this.func[i] = _plugin[i];
            }
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
                        socket.call('log',{message:'unknown command: '+ data.id});
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