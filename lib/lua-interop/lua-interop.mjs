import { spawn } from 'child_process';

export function tolua(data) 
{
    return (`JSON.parse('${JSON.stringify(data)}')`);
};

export function fromlua(data) 
{
    return (`JSON.stringify(${data})`);
};

export class LuaSession 
{
    constructor(luaPath = 'luajit', luaEntryPoint = 'init.lua') 
    {
        this.childprocess = spawn(luaPath, [luaEntryPoint], { stdio: ['pipe', 'pipe', 'pipe'] });

        this.childprocess.stdout.on('data', (data) => 
        {
            //console.log(`Lua Output: ${data.toString()}`);
        });

        this.childprocess.stderr.on('data', (data) => 
        {
            console.error(`Lua Error: ${data.toString()}`);
        });

        this.childprocess.on('exit', (code) => 
        {
            console.log(`Lua process exited with code ${code}`);
        });
    }

    async eval(command) 
    {
        return new Promise((resolve, reject) => 
        {
            this.childprocess.stdin.write(command + '\n');

            const onDataHandler = (data) => {
                let str = data.toString();
                if(str[0] == '!')
                {
                    this.childprocess.stdout.off('data', onDataHandler); // Remove o manipulador de eventos
                    try 
                    {
                        str = str.substring(1, str.length - 1);
                        resolve(JSON.parse(str));
                    } 
                    catch (error) 
                    {
                        reject(error);
                    }
                }
                else if(str[0] == '?')
                {
                    this.childprocess.stdout.off('data', onDataHandler); // Remove o manipulador de eventos
                    try
                    {
                        str = str.substring(1, str.length - 1);
                        resolve(str);
                    }
                    catch (error)
                    {
                        reject(error);
                    }
                }
            };

            this.childprocess.stdout.on('data', onDataHandler);
        });
    }

    json = async (data) => 
    {
        return this.eval(`json(${data})`);
    }

    text = async (data) =>
    {
        return this.eval(`text('${data}')`);
    }

    log = async (data) =>
    {
        return this.eval(`log('${data}')`);
    }

    close = () => 
    {
        this.childprocess.stdin.end();
    }
}
