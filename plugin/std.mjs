import * as readline from 'readline';

const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
});

const getInput = async (callback) =>
{
    return rl.question('@> ', (input) => 
    {
        if (callback) 
        {
            callback(input)
        }
        return input;
    });
}



export const client = 
{
    log:function(client,data)
    {
        let content = 'server says: ' + (data.message ?? JSON.stringify(data)) + '\n' + '@> ';
        for(let i = content.length - 1; i >= 0; i--)
        {
            if(content[i] == '\n')
            {
                content.slice(0,i);
                break;
            }
        }
        process.stdout.write(content);
    },
    init: function(client)
    {
        client.console = async function()
        {
            let _call = async (input)=>
            {
                if (input === 'exit') 
                {
                    client.socket.close();
                    rl.close();
                    process.exit();
                    return;
                }
                let args = input.split(' ');
                let cmd = args[0];
                args = args.slice(1);
                client.call(cmd,args);
                await getInput(_call);
            }
            await getInput(_call);
        }
    }
}

export const server = 
{
    log: function(server,client,data)
    {
        console.log(client.request.connection.remoteAddress + ' says: ' + (data.message ?? JSON.stringify(data)));
    }
}