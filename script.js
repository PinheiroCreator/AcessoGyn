/*
  AcessoGyn — Pessoa 2 (Lógica)
  Motivo: um único JavaScript cuida do menu, do formulário e da lista.
  Os relatos ficam no localStorage (sem back-end neste momento).
*/

const CHAVE_STORAGE = "acessogyn_problemas";

document.addEventListener("DOMContentLoaded", function () {
  configurarMenu();
  configurarFormulario();
  exibirProblemas();
});

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

    const listaProblemas = obterProblemas();

    listaProblemas.unshift({
      id: Date.now(),
      titulo: titulo,
      tipo: tipo,
      bairro: bairro,
      endereco: endereco,
      descricao: descricao,
      dataIso: new Date().toISOString()
    });

    salvarProblemas(listaProblemas);
    formulario.reset();
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

    htmlDosCards +=
      '<article class="card-problema">' +
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
