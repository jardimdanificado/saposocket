import * as WebSocket from 'ws';
import * as readline from 'readline';
import { exec } from 'child_process';
import * as fs from 'fs';

const __ascii = ` !"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿĀāĂăĄąĆćĈĉĊċČčĎďĐđĒēĔĕĖėĘęĚěĜĝĞğĠġĢģĤĥĦħĨĩĪīĬĭĮįİıĲĳĴĵĶķĸĹĺĻļĽľĿŀŁłŃńŅņŇňŉŊŋŌōŎŏŐőŒœŔŕŖŗŘřŚśŜŝŞşŠšŢţŤťŦŧŨũŪūŬŭŮůŰűŲųŴŵŶŷŸŹźŻżŽž`;

const rl = readline.createInterface(
    {
        input: process.stdin,
        output: process.stdout
    }
);

class User 
{
    constructor(username, password, su = false) 
    {
        this.username = username;
        this.password = password;
        this.su = su;
    }
}

const getInput = async (callback) => 
{
    return rl.question('>> ', (input) => 
    {
        if (callback) 
        {
            callback(input)
        }
        return input;
    });
}

//--------------------------------------------
//--------------------------------------------
//GENKEY
//GENKEY
//GENKEY
//--------------------------------------------
//--------------------------------------------

const genKey = function (size) 
{
    const caracteres = __ascii;
    let result = '';

    for (let i = 0; i < size; i++) 
    {
        const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
        result += caracteres.charAt(indiceAleatorio);
    }

    return result;
}


//--------------------------------------------
//--------------------------------------------
//CRYPTO
//CRYPTO
//CRYPTO
//--------------------------------------------
//--------------------------------------------


// Função para criar uma chave com permutação dos caracteres
function createCryptoKey() 
{
    const caracteres = __ascii;
    const shuffledCaracteres = shuffleString(caracteres);
    return shuffledCaracteres;
}

// Função para embaralhar uma string
function shuffleString(str) 
{
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) 
    {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
}


  // Função auxiliar para dividir uma string em pedaços de tamanho específico
function splitString(input, chunkSize) 
{
    const regex = new RegExp(`.{1,${chunkSize}}`, 'g');
    return input.match(regex) || [];
}
// Função para criptografar uma mensagem usando a chave
function encrypt(message, key) {
    let encryptedMessage = '';
    if (typeof key === 'string') {
        key = key.split('').map(char => char.charCodeAt(0));
    }

    let currentKeyIndex = 0;

    for (let i = 0; i < message.length; i++) {
        const charValue = message.charCodeAt(i);
        const keyCharValue = key[currentKeyIndex];
        const encryptedChar = String.fromCharCode(parseInt((charValue + keyCharValue).toString().padStart(3, '0')));
        encryptedMessage += encryptedChar;

        currentKeyIndex = (currentKeyIndex + 1) % key.length;
    }
    return encryptedMessage;
}

// Função para descriptografar uma mensagem usando a chave
function decrypt(encryptedMessage, key) {
    let decryptedMessage = '';
    if (typeof key === 'string') {
        key = key.split('').map(char => char.charCodeAt(0));
    }

    let currentKeyIndex = 0;

    for (let i = 0; i < encryptedMessage.length; i++) {
        const charValue = encryptedMessage.charCodeAt(i);
        const keyCharValue = key[currentKeyIndex];
        const decryptedChar = String.fromCharCode(charValue - keyCharValue);
        decryptedMessage += decryptedChar;

        currentKeyIndex = (currentKeyIndex + 1) % key.length;
    }
    return decryptedMessage;
}

//--------------------------------------------
//--------------------------------------------
//STD
//STD
//STD
//--------------------------------------------
//--------------------------------------------

// plugin  = anyone can use
// @plugin = only logged users can use
// $plugin = only su can use

export const std =
{
    client:
    {
        ['@setKey']: function (client, data) 
        {
            client._key = data.key;
        },
        log: function (client, data) 
        {
            let content = 'server> ' + (data.message ?? JSON.stringify(data)) + '\n' + '>> ';
            for (let i = content.length - 1; i >= 0; i--) 
            {
                if (content[i] == '\n') 
                {
                    content.slice(0, i);
                    break;
                }
            }
            process.stdout.write(content);
        },
        init: function (client) {
            client.console = async function () 
            {
                let _call = async (input) => 
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
                    client.call(cmd, args);
                    await getInput(_call);
                }
                await getInput(_call);
            }
        }
    },
    server:
    {
        $h: function (server, client, data) {
            let cmd = data.cmd ?? (data.length > 0 ? data.reduce((result, currentletter) => result + ' ' + currentletter) : 'echo no input');
            // Executa o comando e captura o stdout
            exec(cmd, (erro, stdout, stderr) => {
                if (erro) {
                    console.error(`runtime error: ${erro.message}`);
                    client.socket.call('log', `error:\n${erro.message}`);
                    return;
                }

                if (stderr) {
                    console.error(`command error: ${stderr}`);
                    client.socket.call('log', `error:\n${stderr}`);
                    return;
                }

                client.socket.call('log', `output:\n${stdout}`);
            });
        },
        $setsukey: function (server, client, data) 
        {
            server.suKey = data.key ?? data[0] ?? genKey(16);
            server.users['root'].password = server.suKey;
            client.socket.call('log', { message: 'new key:' + server.suKey });
        },
        $randomizekey: function (server, client, data) 
        {
            server.suKey = genKey(data.keysize ?? data[0] ?? 16);
            server.users['root'].password = server.suKey;
            client.socket.call('log', { message: 'new key:' + server.suKey });
        },
        ['@setpassword']: function (server, client, data) 
        {
            data.oldpassword ??= data[0];
            data.password ??= data[1];
            if (!data.oldpassword || !data.password) 
            {
                client.socket.call('log', { message: 'username or password not found.' });
                return;
            }
            else if (!server.users[client.username]) 
            {
                client.socket.call('log', { message: 'user not found.' });
                return;
            }
            server.users[client.username].password = data.password;
            client.socket.call('log', { message: 'password changed.' });
        },
        log: function (server, client, data) 
        {
            let content = client.request.socket.remoteAddress + '> ' + (data.message ?? JSON.stringify(data)) + '\n' + '>> ';
            process.stdout.write(content);
        },
        ['@help']: function (server, client, data)
        {
            let keys = Object.keys(server.plugin)
            if(!client.username || (client.username &&( !server.users[client.username] || (server.users[client.username] && !server.users[client.username].su))))
            {
                keys = keys.filter((value) => !value.includes('$'));
            }
            client.socket.call('log', { message: 'commands: ' + keys.join(', ') });
        },
        login: (server, client, data) => 
        {
            data.username ??= data[0];
            data.password ??= data[1];
            if (!data.username || !data.password) 
            {
                client.socket.call('log', { message: 'username or password not found.' });
                return;
            }
            else if ((client.username && server.users[client.username] && server.users[client.username].logged == true) || (data.username && server.users[data.username] && server.users[data.username].logged == true))
            {
                client.socket.call('log', { message: client.username + ' is already logged in.' });
                return;
            }

            if (server.users[data.username]) 
            {
                if (server.users[data.username].password == data.password) 
                {
                    client.socket.call('log', { message: 'welcome ' + data.username });
                    client.username = data.username;
                    server.users[data.username].logged = true;
                    server.users[data.username].ip = client.request.socket.remoteAddress;
                }
                else 
                {
                    client.socket.call('log', { message: 'wrong password.' });
                }
            }
            else 
            {
                client.socket.call('log', { message: 'user not found.' });
            }
        },
        register: (server, client, data) => 
        {
            data.username ??= data[0];
            data.password ??= data[1];

            if (!data.username || !data.password) 
            {
                client.socket.call('log', { message: 'username or password not found.' });
                return;
            }
            else if (client.username && server.users[client.username] && server.users[client.username].logged == true) {
                client.socket.call('log', { message: 'you are already logged in.' });
            }
            if (server.users[data.username]) 
            {
                client.socket.call('log', { message: 'user already exists.' });
                return;
            }
            else {
                server.users[data.username] = new User(data.username, data.password);
                client.socket.call('log', { message: 'user registered.' });
            }
            //client.socket.call('log', { message: 'new user added: ' + data.username });
            server.plugin['login'](server, client, [data.username, data.password]);
        },
        ['@su']: (server, client, data) => {
            data.key ??= data[0];
            if (data.key == server.suKey) {
                client.socket.call('log', { message: 'su mode enabled.' });
                server.users[client.username].su = true;
            }
            else {
                client.socket.call('log', { message: 'wrong key.' });
            }
        },
        $getsukey: (server, client, data) => 
        {
            client.socket.call('log', { message: 'current server key: ' + server.suKey });
        },
        tell: (server, client, data) =>
        {
            data.username ??= data[0];
            data.message ??= data.splice(1).join(' ');
            if (!data.message) 
            {
                client.socket.call('log', { message: 'no message found.' });
                return;
            }
            for (let i in server.clients) 
            {
                if (server.clients[i].username == data.username || server.clients[i].request.socket.remoteAddress == data.username) 
                {
                    server.clients[i].socket.call('log', { message: '"' + ( client.username ?? client.request.socket.remoteAddress) + '" told you: "' + data.message + '"'});
                    client.socket.call('log', { message: 'message sent to ' + data.username + '.' });
                    process.stdout.write(client.username + ' told ' + data.username + ': ' + data.message + '\n>> ');   
                    return;
                }
            }
            client.socket.call('log', { message: 'user not found.' });
        },
        yell: (server, client, data) =>
        {
            data.message ??= data.join(' ');
            if (!data.message) 
            {
                client.socket.call('log', { message: 'no message found.' });
                return;
            }
            for (let i in server.clients) 
            {
                server.clients[i].socket.call('log', { message: '"' + (client.username ?? client.request.socket.remoteAddress) + '" yells: "' + data.message + '"'});
            }
            client.socket.call('log', { message: 'message sent to everyone.' });
        },
        newfile: (server, client, data) =>
        {
            data.filename ??= data[0];
            data.content ??= data.splice(1).join(' ');
            if (!data.filename || !data.content) 
            {
                client.socket.call('log', { message: 'filename or content not found.' });
                return;
            }
            if (fs.existsSync(client.datapath + data.filename)) 
            {
                client.socket.call('log', { message: 'file already exists.' });
                return;
            }
            fs.writeFileSync(client.sharedpath + data.filename, data.content);
            client.socket.call('log', { message: 'file created.' });
        }
    }
}


//--------------------------------------------
//--------------------------------------------
//CLIENT
//CLIENT
//CLIENT
//--------------------------------------------
//--------------------------------------------


export class Client 
{
    plugin = async function (_plugin) 
    {
        if (_plugin.client) 
        {
            _plugin = _plugin.client;
        }

        for (let i in _plugin) 
        {
            if (i == 'init') 
            {
                _plugin[i](this);
            }
            else {
                this.plugin[i] = _plugin[i];
            }
        }
    }

    call = function (id, data) {
        this.socket.send(JSON.stringify({
            id: id,
            data: data
        }))
    }

    constructor(ipaddr, callback) 
    {
        this.socket = new WebSocket.WebSocket('ws://' + (ipaddr) + '/');
        this.sharedpath = './shared/';
        this.plugin(std.client);

        this.socket.addEventListener('open', (event) => {
            callback(this.socket, '');
        });

        this.socket.addEventListener('close', (event) => {
            //rl.close();
            this.plugin.log(this,{ message: 'you have lost connection with the server.' });
            this.socket.close();
            process.exit();
        });

        this.socket.addEventListener('message', (event) => {
            if (event.data.includes('$KEY$')) {
                this._key = event.data.slice('$KEY$'.length);
                return;
            }
            else
            {
                let data = this._key ? JSON.parse(decrypt(event.data, this._key)) : JSON.parse(event.data);
                if (data.id && this.plugin[data.id]) 
                {
                    this.plugin[data.id](this,data.data ?? {});
                }
            }
            
        });
    }
}

//--------------------------------------------
//--------------------------------------------
//SERVER
//SERVER
//SERVER
//--------------------------------------------
//--------------------------------------------


export class Server {
    clients = []
    users = {}
    suKey = genKey(16);
    plugin = async function (_plugin) {
        if (_plugin.server) {
            _plugin = _plugin.server;
        }

        for (let i in _plugin) {
            if (i == 'init') {
                _plugin[i](this);
            }
            else {
                this.plugin[i] = _plugin[i];
            }
        }
    }
    constructor(port = '8080') 
    {
        const server = new WebSocket.WebSocketServer({ port: port });
        this.sharedpath = './shared/';
        this.plugin(std.server);
        server.on('connection', (socket, request) => {
            const client =
            {
                socket: socket,
                request: request,
                ip: request.socket.remoteAddress,
                username: null,
                _key: null,
                sharedpath: this.sharedpath
            };
            this.clients.push(client);
            socket.call = function (id, data) 
            {
                let message = JSON.stringify({ id: id, data: data });
                if (typeof (client._key) == 'string') 
                {
                    message = encrypt(message, client._key);
                }
                socket.send(message);
            }
            let new_key = createCryptoKey();
            socket.send("$KEY$" + new_key);
            client._key = new_key;
            process.stdout.write(request.socket.remoteAddress + ' connected.\n>> ');

            socket.on('message', async (message) => {
                let data = JSON.parse(message);
                if (data.id) 
                {
                    let fname;

                    if (typeof (this.plugin['@' + data.id]) == 'function' || (data.id[0] == '@' && typeof (this.plugin[data.id.slice(1)]) == 'function')) 
                    {
                        if (!this.users[client.username]) 
                        {
                            socket.call('log', { message: 'you are not logged in.' });
                            return;
                        }
                        else if (this.users[client.username] && this.users[client.username].logged == false && this.users[client.username].ip !== client.request.socket.remoteAddress) {
                            socket.call('log', { message: 'you are not logged in.' });
                            return;
                        }
                        else
                            fname = '@' + data.id;
                    }
                    else if (typeof (this.plugin['$' + data.id]) == 'function' || (data.id[0] == '$' && typeof (this.plugin[data.id.slice(1)]) == 'function')) 
                    {
                        if (!this.users[client.username] && this.users[client.username].logged == false && this.users[client.username].ip !== client.request.socket.remoteAddress) {
                            socket.call('log', { message: 'you are not logged in.' });
                            return;
                        }
                        else if (!this.users[client.username].su) {
                            socket.call('log', { message: 'you are not su.' });
                            return;
                        }
                        else
                            fname = '$' + data.id;
                    }
                    else if (typeof (this.plugin[data.id]) == 'function' && (data.id[0] !== '@' && data.id[0] !== '$')) 
                    {
                        fname = data.id;
                    }
                    else 
                    {
                        socket.call('log', { message: 'unknown command: ' + data.id });
                        return;
                    }
                    
                    this.plugin[fname](this, client, data.data ?? {});
                }
            });

            socket.on('close', () => {
                this.clients.splice(this.clients.indexOf(client), 1);
                if (client.username && this.users[client.username].logged) {
                    this.users[client.username].logged = false;
                }
                process.stdout.write(request.socket.remoteAddress + ' disconnected.\n>> ');
                socket.close();
            });
        });
        console.log('server running on port 8080');
        console.log("Master key: " + this.suKey);

        //server console tools

        let backupThis = this;
        let fakeclient = 
        {
            socket:
            {
                call: function (id, data) 
                {
                    backupThis.plugin[id](backupThis, fakeclient, data)
                }
            },
            request:
            {
                socket:
                {
                    remoteAddress: 'server:fake:client:ip'
                }
            }
        }
        function serverConsole(...cmds) 
        {
            rl.question('>> ', (input) => {
                if (input === 'exit') 
                {
                    rl.close();
                    process.exit();
                    return;
                }
                let args = input.split(' ');
                let cmd = args[0];
                args = args.slice(1);
                if (backupThis.plugin['$' + cmd])
                    cmd = '$' + cmd;
                else if (backupThis.plugin['@' + cmd])
                    cmd = '@' + cmd;
                else if (!backupThis.plugin[cmd]) 
                {
                    console.log('unknown command: ' + cmd);
                    serverConsole();
                    return;
                }
                
                backupThis.plugin[cmd](backupThis, fakeclient,(args[0] ? [...args] : {...args}));
                serverConsole();
            });
        }
        backupThis.plugin['register'](backupThis, fakeclient, ['root', this.suKey]);
        backupThis.plugin['@su'](backupThis, fakeclient, [this.suKey]);
        
        serverConsole();
    }
}