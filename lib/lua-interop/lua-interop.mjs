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
    task = null;
    busy = false;
    timeout = null;
    queue = [];
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

    async advanceQueue()
    {
        if (this.queue.length > 0) 
        {
            let currenttask = this.queue.shift();
            if (currenttask.timeout) 
            {
                this.task = this.eval(currenttask.command, currenttask.timeout);
                currenttask.resolve(this.task);
            }
            else
            {
                this.task = this.eval(currenttask.command);
                currenttask.resolve(this.task);
            }
        }
    }

    async eval(command, timeout) 
    {
        if (this.busy) 
        {
            if (timeout) 
            {
                return new Promise((resolve, reject) => 
                {
                    this.queue.push({ command, timeout, resolve, reject});
                });
            }
            else 
            {
                return new Promise((resolve, reject) => 
                {
                    this.queue.push({ command, undefined, resolve, reject });
                });
            }
        }

        this.busy = true;
        this.task = new Promise((resolve, reject) => 
        {
            this.childprocess.stdin.write(command + '\n');

            const onDataHandler = (data) => 
            {
                let str = data.toString();
                if(str[0] == '!')
                {
                    this.childprocess.stdout.off('data', onDataHandler); // Remove o manipulador de eventos
                    try 
                    {
                        str = str.substring(1, str.length - 1);
                        this.busy = false;
                        this.task = null;
                        if (this.timeout) 
                        {
                            clearTimeout(this.timeout);
                            this.timeout = null;
                        }
                        resolve(JSON.parse(str));
                        this.advanceQueue();
                    } 
                    catch (error) 
                    {
                        this.busy = null;
                        this.task = null;
                        if (this.timeout) 
                        {
                            clearTimeout(this.timeout);
                            this.timeout = null;
                        }
                        reject(error);
                        this.advanceQueue();
                    }
                }
                else if(str[0] == '?')
                {
                    this.childprocess.stdout.off('data', onDataHandler); // Remove o manipulador de eventos
                    try
                    {
                        str = str.substring(1, str.length - 1);
                        this.busy = false;
                        this.task = null;
                        if (this.timeout) 
                        {
                            clearTimeout(this.timeout);
                            this.timeout = null;
                        }
                        resolve(str);
                        this.advanceQueue();
                    }
                    catch (error)
                    {
                        this.busy = null;
                        this.task = null;
                        if (this.timeout) 
                        {
                            clearTimeout(this.timeout);
                            this.timeout = null;
                        }
                        reject(error);
                        this.advanceQueue();
                    }
                }

                if(timeout)
                {
                    this.timeout = setTimeout(() =>
                    {
                        reject('Timeout');
                    }, timeout);
                }
            };
            this.childprocess.stdout.on('data', onDataHandler);
        });
        return this.task;
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

export class LuaSessionManager
{
    sessions = [];
    libs = [];
    cleanerInterval = null;
    constructor(luaPath = 'luajit', luaEntryPoint = 'init.lua', sessionAmount = 1, libs = []) 
    {
        for (let i = 0; i < sessionAmount; i++) 
        {
            this.sessions.push(new LuaSession(luaPath, luaEntryPoint));
            for (const libname of libs) 
            {
                this.sessions[this.sessions.length - 1].eval(`require('${libname}');`);
            }
        }
        this.cleanerInterval = setInterval(() =>
        {
            for (let i = 0; i < this.sessions.length; i++) 
            {
                const session = this.sessions[i];
                if(session.busy == null)
                {
                    this.sessions[i] = new LuaSession(luaPath, luaEntryPoint);
                    for (const libname of this.libs) 
                    {
                        this.sessions[i].eval(`require('${libname}');`);
                    }
                }
            }
        }, 700);
    }

    require(libname)
    {
        this.libs.push(libname);
        for (const session of this.sessions) 
        {
            session.eval(`require('${libname}');`);
        }
    }
    close()
    {
        clearInterval(this.cleanerInterval);
        for (const session of this.sessions) 
        {
            session.close();
        }
    }
    async eval(command, timeout) 
    {
        let found = false;
        let session = this.sessions[0];
        for (const session_ of this.sessions) 
        {
            if(session_.busy == false)
            {
                found = true;
                session = session_;
                break;
            }
        }
        return (found ? session.eval(command, timeout) : new Promise((resolve, reject) =>
        {
            session.queue.push({ command, timeout, resolve, reject});
        }));
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

}