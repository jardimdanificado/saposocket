json = require("json")
util = require("luatils")


_print = print -- faz um backup da função print original

util.file.save.text('luaside_log.txt', '') -- limpa o arquivo de log

function send(data) -- função para enviar json para o lado do cliente
    _print('!' .. json.encode(data))
    io.flush()
end

function say(data) -- função para enviar texto para o lado do cliente
    _print('?' .. data)
    io.flush()
end
print = say; -- substitui a função print original pela função say

function log(data,filename) -- função para salvar dados no arquivo de log
    filename = filename or 'luaside_log.txt'
    local file = util.file.load.text(filename);
    util.file.save.text(filename, file .. '\n' .. data)
end

-- Função para executar comandos Lua
function executeLuaCode(code)
    log("executing: " .. code)
    local chunk, err = load(code)
    if chunk then
        local success, result = pcall(chunk)
        if success then
            return result
        else
            return "Error: " .. result
        end
    else
        return "Error: " .. err
    end
end

-- Loop principal
while true do
    local command = io.read()
    local result = executeLuaCode(command or 'os.exit()')
    io.flush()
end
