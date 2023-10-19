--não pode ter primeira linha em branco
function fatorial(n) if n == 0 then return 1 else return n * fatorial(n - 1) end end;

numero = 5;
resultado = fatorial(numero);
json("O fatorial de " .. numero .. " é " .. resultado);
--funções tem que estar em uma linha apenas
--nao pode variaveis locais