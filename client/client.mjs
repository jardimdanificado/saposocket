var _g = {}
const { exec } = await import('child_process');
const readline = await import('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


const connectToServer = async (ipaddr) => 
{
    _g.socket = new WebSocket('ws://' + (ipaddr || _g.config.ip) + ':' + port + '/');
    
    _g.socket.addEventListener('open', (event) => 
    {
        _g.socket.send(JSON.stringify(
        {
            type: 'login',
            username: username,
            password: passwd
        }));
        _g.user = 
        {
            username: username,
            password: passwd
        };
    });

    _g.socket.addEventListener('message', (event) => 
    {
        let data = JSON.parse(event.data);
        if(_g.methods[data.type])
        {
            let result = _g.methods[data.type](data);
            if (result && result.log && typeof(result.log) == 'string')
            {
                console.log('server response: ' + result.log);
            }
        }
    });
}

async function main()
{
    connectToServer(process.argv.slice(2)[0] || 'localhost:8080')
    while (true) 
    {
        
    }
};

await main();