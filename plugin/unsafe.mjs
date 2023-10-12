import { exec } from 'child_process';

export const server = 
{
    $sh: function (server, serverclient, data) {
        let cmd = data.cmd ?? (data.length > 0 ? data.reduce((result, currentletter) => result + ' ' + currentletter) : 'echo no input');
        // Executa o comando e captura o stdout
        exec(cmd, (erro, stdout, stderr) => 
        {
            if (erro) 
            {
                console.error(`runtime error: ${erro.message}`);
                serverclient.socket.call('log', `error:\n${erro.message}`);
                return;
            }

            if (stderr) 
            {
                console.error(`command error: ${stderr}`);
                serverclient.socket.call('log', `error:\n${stderr}`);
                return;
            }

            serverclient.socket.call('log', `output:\n${stdout}`);
        });
    },
    $getsukey: (server, serverclient, data) => 
    {
        serverclient.socket.call('log', 'current server key: ' + server.suKey );
    },
}

export const client = 
{

}
