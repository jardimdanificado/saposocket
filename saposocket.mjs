import * as WebSocket from 'ws';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const getInput = async (callback) =>
{
    return rl.question('$> ', (input) => 
    {
        if (input === 'exit') 
        {
            rl.close();
        }
        if (callback) 
        {
            callback(input)
        }
        return input;
    });
}

const _console = async function(self)
{
    let _call = async (input)=>
    {
        if (input === 'exit') 
        {
            rl.close();
            return;
        }
        let args = input.split(' ');
        let cmd = args[0];
        args = args.slice(1);
        self.call(cmd,args);
        console.log(self.call)
        await getInput(_call);
    }
    await getInput(_call);
}

export class Client 
{
    func = {
        log: function(socket,data)
        {
            console.log('server says: ' + JSON.stringify(data));
        }
    }
    console = ()=>{_console(this)};
    constructor(ipaddr,callback)
    {
        this.socket = new WebSocket.WebSocket('ws://' + (ipaddr) + '/');
        
        this.socket.addEventListener('open', (event) => 
        {
            callback(this.socket,'')
        });
    
        this.socket.addEventListener('message', (event) => 
        {
            let data = JSON.parse(event.data);
            if(data.id && this.func[data.id])
            {
                this.func[data.id](this.socket,data.data || {});
            }
        });

        this.call = function(id, data)
        {
            this.socket.send(JSON.stringify({
                id: id,
                data: data
            }))
        }
    }
}

export class Server 
{
    func = 
    {
        log: function(socket,request,data)
        {
            console.log(request.connection.remoteAddress + ' says: ' + JSON.stringify(data));
        }
    }
    constructor(port='8080')
    {
        const server = new WebSocket.WebSocketServer({ port: port });
        server.on('connection', (socket,request) => 
        {
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
                        this.func[data.id](socket,request,data.data || {});
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