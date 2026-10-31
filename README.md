# ViaAtenta
<<<<<<< HEAD
=======

>>>>>>> AcessoGyn/master

Aplicação local para registrar e acompanhar ocorrências de conservação viária em Goiânia.

## Executar

1. Instale Python 3.10 ou superior.
2. Instale o Ollama e baixe uma vez o modelo local usado pelo validador: `ollama pull gemma3:1b`.
3. No terminal, entre na pasta `backend` e instale as dependências:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

No Windows PowerShell, ative com `.venv\Scripts\Activate.ps1`.

4. Inicie o Ollama local e execute:

```bash
python app.py
```

5. Abra `http://127.0.0.1:5000` no navegador.

Após instalar as dependências e o modelo, o uso da aplicação não depende de serviços externos. O polígono municipal está incluído em `backend/data/limite-goiania.geojson`; a verificação geográfica e o banco SQLite são executados no próprio computador.

## Portal do cidadão

A página `reports.html` permite que o cidadão registre um problema viário sem escolher órgão responsável ou cobertura de câmeras. A equipe confirma essas informações durante a triagem. A página também inclui exemplos fictícios para demonstração; eles não aparecem na fila até que alguém valide e envie o formulário.

## Fluxo

- O usuário informa o trecho e as coordenadas do ponto da ocorrência ou permite a leitura pelo GPS.
- O servidor confere se o ponto está dentro do limite municipal de Goiânia. Um ponto fora do município não pode ser registrado.
- O validador local analisa o texto e classifica o tipo e a prioridade sugerida. Se o texto não descrever um problema viário suficiente, o envio é recusado.
- O registro aprovado é salvo em `backend/data/viaatenta.sqlite3` e aparece na fila local, mesmo após fechar e reabrir a aplicação.
- A equipe pode atualizar o status. Um aviso só pode ser preparado como rascunho após confirmar a ocorrência; nenhum aviso externo é enviado.

## Limites desta versão

- A área aceita é Goiânia. O arquivo de limite incluído é uma geometria municipal simplificada do IBGE, código 5208707.
- O banco SQLite fica no computador onde o servidor está instalado. A aplicação não oferece sincronização entre computadores nem controle de contas.
- O serviço de validação de texto usa o modelo instalado localmente no Ollama. Se ele estiver parado ou o modelo não estiver instalado, o registro não será salvo.
- Não há conexão com câmeras, sistemas da GOINFRA, prefeitura, ordens de serviço ou publicação de avisos.
