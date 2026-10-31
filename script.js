/*
  AcessoGyn - Pessoa 2 (Lógica)
  Motivo: um único JavaScript cuida do menu, do formulário e da lista.
  Os relatos ficam no localStorage (sem back-end neste momento).
*/

const CHAVE_STORAGE = "acessogyn_problemas";

// Marcação escolhida no mapa da página Relatar (posição em % da imagem)
let analiseIAAtual = null;


document.addEventListener("DOMContentLoaded", function () {
  configurarMenu();
  configurarFormulario();
  configurarMapaRelato();
  configurarAnaliseIA();
  exibirProblemas();
  exibirMapaProblemas();
  exibirDashboard();
});


// Atualiza o dashboard quando um relato novo é salvo em outra aba ou ao voltar para a página
window.addEventListener("storage", exibirDashboard);
window.addEventListener("pageshow", exibirDashboard);
window.addEventListener("focus", exibirDashboard);

function configurarMenu() {
  const botaoMenu = document.getElementById("botao-menu");
  const menuPrincipal = document.getElementById("menu-principal");

  if (!botaoMenu || !menuPrincipal) {
    return;
  }

  botaoMenu.addEventListener("click", function () {
    const menuAberto = menuPrincipal.classList.toggle("aberto");
    botaoMenu.setAttribute("aria-expanded", menuAberto);
  });
}

function obterProblemas() {
  const textoSalvo = localStorage.getItem(CHAVE_STORAGE);

  if (!textoSalvo) {
    return [];
  }

  return JSON.parse(textoSalvo);
}

function salvarProblemas(listaProblemas) {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(listaProblemas));
}

function configurarFormulario() {
  const formulario = document.getElementById("formulario-relato");

  if (!formulario) {
    return;
  }

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const titulo = document.getElementById("campo-titulo").value.trim();
    const tipo = document.getElementById("campo-tipo").value;
    const bairro = document.getElementById("campo-bairro").value.trim();
    const endereco = document.getElementById("campo-endereco").value.trim();
    const descricao = document.getElementById("campo-descricao").value.trim();
    const mensagem = document.getElementById("mensagem-formulario");

    if (!titulo || !tipo || !bairro || !endereco || !descricao) {
      mostrarMensagem(mensagem, "Preencha todos os campos antes de salvar.", "erro");
      return;
    }

    if (!marcacaoAtual) {
      mostrarMensagem(mensagem, "Marque o local do problema no mapa antes de salvar.", "erro");
      return;
    }

    const listaProblemas = obterProblemas();

    listaProblemas.unshift({
      id: Date.now(),
      titulo: titulo,
      tipo: tipo,
      bairro: bairro,
      endereco: endereco,
      descricao: descricao,
      marcacao: marcacaoAtual,
    
      analiseIA: analiseIAAtual,
    
      dataIso: new Date().toISOString()
    });


    salvarProblemas(listaProblemas);
    analiseIAAtual = null;
    exibirDashboard();
    formulario.reset();
    removerMarcacao();
    mostrarMensagem(mensagem, "Relato salvo. Você já pode vê-lo em Ver problemas.", "sucesso");
  });
}

function mostrarMensagem(elemento, texto, tipo) {
  if (!elemento) {
    return;
  }

  elemento.textContent = texto;
  elemento.className = "mensagem " + tipo;
}


function exibirProblemas() {
  const listaNaTela = document.getElementById("lista-problemas");

  if (!listaNaTela) {
    return;
  }

  const listaProblemas = obterProblemas();

  if (listaProblemas.length === 0) {
    listaNaTela.innerHTML =
      '<p class="estado-vazio">Nenhum problema registrado ainda. Use Relatar problema para incluir o primeiro.</p>';
    return;
  }

  let htmlDosCards = "";

  for (let indice = 0; indice < listaProblemas.length; indice += 1) {
    const problema = listaProblemas[indice];
    const dataFormatada = formatarData(problema.dataIso);

    let blocoIA = "";

    if (problema.analiseIA) {
      blocoIA =
        '<div class="analise-ia">' +
          '<h3>✨ Análise da inteligência artificial</h3>' +
          '<p><strong>Categoria sugerida:</strong> ' +
          escaparHtml(problema.analiseIA.categoria || "Não informada") +
          '</p>' +
          '<p><strong>Prioridade sugerida:</strong> ' +
          escaparHtml(problema.analiseIA.prioridade || "Não informada") +
          '</p>' +
          '<p><strong>Descrição organizada:</strong> ' +
          escaparHtml(problema.analiseIA.descricao_organizada || "Não informada") +
          '</p>' +
          '<p><strong>Justificativa:</strong> ' +
          escaparHtml(problema.analiseIA.justificativa || "Não informada") +
          '</p>' +
          '<small>Esta análise é uma sugestão gerada por IA, não uma avaliação técnica oficial.</small>' +
        '</div>';
    }

    htmlDosCards +=
      '<article class="card-problema" id="problema-' +
      problema.id +
      '">' +
      '<div class="card-topo">' +
      "<h2>" +
      escaparHtml(problema.titulo) +
      "</h2>" +
      '<span class="etiqueta-tipo">' +
      escaparHtml(problema.tipo) +
      "</span>" +
      "</div>" +
      '<p class="card-local">' +
      escaparHtml(problema.bairro) +
      " — " +
      escaparHtml(problema.endereco) +
      "</p>" +
      "<p>" +
      escaparHtml(problema.descricao) +
      "</p>" +
      blocoIA +
      '<p class="card-data">Registrado em ' +
      dataFormatada +
      "</p>" +
      "</article>";
  }

  listaNaTela.innerHTML = htmlDosCards;
}


function formatarData(dataIso) {
  const data = new Date(dataIso);

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function escaparHtml(texto) {
  const mapa = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
  };

  return String(texto).replace(/[&<>"]/g, function (caractere) {
    return mapa[caractere];
  });
}

function criarPino(marcacao, titulo) {
  const pino = document.createElement("span");
  pino.className = "pino";
  pino.style.left = marcacao.x + "%";
  pino.style.top = marcacao.y + "%";

  if (titulo) {
    pino.title = titulo;
  }

  return pino;
}

function configurarMapaRelato() {
  const mapa = document.getElementById("mapa-relato");
  const botaoLimpar = document.getElementById("botao-limpar-marcacao");

  if (!mapa) {
    return;
  }

  mapa.addEventListener("click", function (evento) {
    const area = mapa.getBoundingClientRect();
    const x = ((evento.clientX - area.left) / area.width) * 100;
    const y = ((evento.clientY - area.top) / area.height) * 100;

    marcacaoAtual = {
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y))
    };

    const pinoAntigo = mapa.querySelector(".pino");
    if (pinoAntigo) {
      pinoAntigo.remove();
    }

    mapa.appendChild(criarPino(marcacaoAtual, "Local do problema"));
    document.getElementById("mapa-status").textContent = "Local marcado no mapa.";
  });

  if (botaoLimpar) {
    botaoLimpar.addEventListener("click", removerMarcacao);
  }
}

function removerMarcacao() {
  const mapa = document.getElementById("mapa-relato");

  if (!mapa) {
    return;
  }

  const pino = mapa.querySelector(".pino");
  if (pino) {
    pino.remove();
  }

  marcacaoAtual = null;
  document.getElementById("mapa-status").textContent = "Nenhum local marcado.";
}

function exibirMapaProblemas() {
  const mapa = document.getElementById("mapa-problemas");

  if (!mapa) {
    return;
  }

  const listaProblemas = obterProblemas();

  listaProblemas.forEach(function (problema) {
    if (!problema.marcacao) {
      return;
    }

    const pino = criarPino(problema.marcacao, problema.titulo);

    pino.addEventListener("click", function () {
      const card = document.getElementById("problema-" + problema.id);

      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.classList.add("destaque");
        setTimeout(function () {
          card.classList.remove("destaque");
        }, 1800);
      }
    });

    mapa.appendChild(pino);
  });
}

function chaveDoDia(data) {
  return (
    data.getFullYear() +
    "-" +
    String(data.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(data.getDate()).padStart(2, "0")
  );
}

function montarBarras(itens, mensagemVazia) {
  if (itens.length === 0) {
    return '<p class="dash-vazio">' + mensagemVazia + "</p>";
  }

  let maior = 0;
  itens.forEach(function (item) {
    if (item.valor > maior) {
      maior = item.valor;
    }
  });

  let html = "";

  itens.forEach(function (item) {
    const largura = maior === 0 ? 0 : (item.valor / maior) * 100;

    html +=
      '<div class="dash-linha">' +
      '<span class="dash-linha-nome">' +
      escaparHtml(item.nome) +
      "</span>" +
      '<div class="dash-trilho"><div class="dash-preenchimento" style="width:' +
      largura +
      '%"></div></div>' +
      '<span class="dash-linha-valor">' +
      item.valor +
      "</span>" +
      "</div>";
  });

  return html;
}

function exibirDashboard() {
  const painel = document.getElementById("painel-dashboard");

  if (!painel) {
    return;
  }

  const listaProblemas = obterProblemas();
  const agora = new Date();
  const hoje = chaveDoDia(agora);

  // Últimos 7 dias (do mais antigo para hoje)
  const dias = [];
  for (let i = 6; i >= 0; i -= 1) {
    const dia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - i);
    dias.push({
      chave: chaveDoDia(dia),
      nome: dia.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      valor: 0
    });
  }

  const contagemTipos = {};
  const contagemBairros = {};
  let totalHoje = 0;
  let totalSemana = 0;

  listaProblemas.forEach(function (problema) {
    contagemTipos[problema.tipo] = (contagemTipos[problema.tipo] || 0) + 1;

    const chaveBairro = String(problema.bairro).trim().toLowerCase();
    if (!contagemBairros[chaveBairro]) {
      contagemBairros[chaveBairro] = { nome: String(problema.bairro).trim(), valor: 0 };
    }
    contagemBairros[chaveBairro].valor += 1;

    const chaveDia = chaveDoDia(new Date(problema.dataIso));

    if (chaveDia === hoje) {
      totalHoje += 1;
    }

    dias.forEach(function (dia) {
      if (dia.chave === chaveDia) {
        dia.valor += 1;
        totalSemana += 1;
      }
    });
  });

  const tipos = Object.keys(contagemTipos)
    .map(function (nome) {
      return { nome: nome, valor: contagemTipos[nome] };
    })
    .sort(function (a, b) {
      return b.valor - a.valor;
    });

  const bairros = Object.keys(contagemBairros)
    .map(function (chave) {
      return contagemBairros[chave];
    })
    .sort(function (a, b) {
      return b.valor - a.valor;
    });

  document.getElementById("dash-total").textContent = listaProblemas.length;
  document.getElementById("dash-hoje").textContent = totalHoje;
  document.getElementById("dash-semana").textContent = totalSemana;
  document.getElementById("dash-bairros").textContent = bairros.length;

  document.getElementById("grafico-tipos").innerHTML = montarBarras(
    tipos,
    "Nenhum relato registrado ainda."
  );
  document.getElementById("ranking-bairros").innerHTML = montarBarras(
    bairros.slice(0, 5),
    "Nenhum relato registrado ainda."
  );
  document.getElementById("grafico-dias").innerHTML = montarBarras(
    dias,
    "Nenhum relato registrado ainda."
  );
}


function configurarAnaliseIA() {
  const botao = document.getElementById("botao-analisar-ia");

  if (!botao) {
    return;
  }

  botao.addEventListener("click", async function () {
    const campoDescricao = document.getElementById("campo-descricao");
    const status = document.getElementById("status-ia");
    const resultado = document.getElementById("resultado-ia");
    const descricao = campoDescricao.value.trim();

    if (descricao.length < 15) {
      mostrarMensagem(
        status,
        "Escreva pelo menos 15 caracteres para analisar.",
        "erro"
      );
      return;
    }

    botao.disabled = true;
    botao.textContent = "Analisando...";
    resultado.hidden = true;

    mostrarMensagem(
      status,
      "A inteligência artificial está analisando seu relato...",
      "sucesso"
    );

    try {
      const resposta = await fetch(
        "http://127.0.0.1:5000/api/analisar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            descricao: descricao
          })
        }
      );

      const dados = await resposta.json();
      analiseIAAtual = dados;

      if (!resposta.ok) {
        throw new Error(
          dados.erro || "Não foi possível analisar o relato."
        );
      }

      document.getElementById("ia-categoria").textContent =
        "Categoria sugerida: " + dados.categoria;

      document.getElementById("ia-prioridade").textContent =
        "Prioridade sugerida: " + dados.prioridade;

      document.getElementById("ia-descricao").textContent =
        "Descrição organizada: " + dados.descricao_organizada;

      document.getElementById("ia-justificativa").textContent =
        "Justificativa: " + dados.justificativa;

      resultado.hidden = false;

      mostrarMensagem(
        status,
        "Análise concluída! Confira as sugestões.",
        "sucesso"
      );

      document.getElementById("botao-aplicar-ia").onclick = function () {
        document.getElementById("campo-tipo").value =
          dados.categoria;

        campoDescricao.value = dados.descricao_organizada;

        mostrarMensagem(
          status,
          "Sugestões aplicadas! Confira os campos antes de salvar.",
          "sucesso"
        );
      };

    } catch (erro) {
      mostrarMensagem(
        status,
        erro.message || "Erro ao conectar com a inteligência artificial.",
        "erro"
      );

    } finally {
      botao.disabled = false;
      botao.textContent = " Analisar com IA";
    }
  });
}
