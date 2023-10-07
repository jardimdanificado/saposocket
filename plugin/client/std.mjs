import * as readline from 'readline';

const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
});

const getInput = async (callback) =>
{
    return rl.question('@> ', (input) => 
    {
        if (input === 'exit') 
        {
            rl.close();
        }
        else if (callback) 
        {
            callback(input)
        }
        return input;
    });
}

export const _console = async function(client,data)
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
        client.call(cmd,args);
        await getInput(_call);
    }
    await getInput(_call);
}

export const _log = function(client,data)
{
    let __data = typeof(data) == 'string' ? data : JSON.stringify(data);
    let content = 'server says: ' + __data + '\n' + '@> ';
    for(let i = content.length - 1; i >= 0; i--)
    {
        if(content[i] == '\n')
        {
            content.slice(0,i);
            break;
        }
    }
    process.stdout.write(content);
}

export function main(client) 
{
    client.console = (data) => {_console(client,data)}
    client.func.log = (data) => {_log(client,data)}
}