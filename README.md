# 🖥️ tarefa-express

Painel web que mostra o estado da máquina em tempo real — uma espécie de
Gerenciador de Tarefas acessível pelo navegador, servido por um único arquivo
Node.js.

Feito com o módulo nativo `os` do Node, sem dependência externa de coleta: o
servidor lê os dados do sistema operacional e monta a página HTML na resposta.

## O que ele mostra

| Seção | Informações |
|---|---|
| **Sistema** | hostname, tipo e release do SO, arquitetura, uptime formatado |
| **CPU** | modelo e velocidade de cada núcleo, com o percentual de uso por núcleo |
| **Memória** | total, livre e em uso, em GB e MB, com percentual |
| **Rede** | interfaces de rede e os endereços IP de cada uma |
| **Usuário** | usuário corrente e diretório home |
| **Processo** | porta em uso e dados do processo Node |

## Como rodar

**Requisito:** Node.js 18+.

```bash
git clone https://github.com/guxta18-rgb/tarefa-express.git
cd tarefa-express
npm install
node server.js
```

Acesse **http://localhost:3000**.

Para usar outra porta:

```bash
PORT=8080 node server.js
```

## Stack

`Node.js` · `Express 5` · `cors` · módulo nativo `os`
