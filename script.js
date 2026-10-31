const STATUS = ["Recebida", "Em triagem", "Confirmada", "Em atendimento", "Concluída"];
let localizacaoValidada = false;

document.addEventListener("DOMContentLoaded", function () {
  configurarMenu();
  configurarFormulario();
  configurarGps();
  configurarFiltros();
  carregarFila();
  carregarPainel();
});

window.addEventListener("pageshow", function () {
  carregarFila();
  carregarPainel();
});

function configurarMenu() {
  const botao = document.getElementById("botao-menu");
  const menu = document.getElementById("menu-principal");
  if (!botao || !menu) return;
  botao.addEventListener("click", function () {
    const aberto = menu.classList.toggle("aberto");
    botao.setAttribute("aria-expanded", String(aberto));
  });
}

function mostrarMensagem(elemento, texto, tipo) {
  if (!elemento) return;
  elemento.textContent = texto;
  elemento.className = "mensagem" + (tipo ? " " + tipo : "");
}

function escaparHtml(valor) {
  return String(valor == null ? "" : valor).replace(/[&<>"']/g, function (caractere) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[caractere];
  });
}

async function requisicao(url, opcoes) {
  const resposta = await fetch(url, Object.assign({ headers: { "Content-Type": "application/json" } }, opcoes || {}));
  let dados;
  try { dados = await resposta.json(); } catch (erro) { dados = {}; }
  if (!resposta.ok) throw new Error(dados.erro || "Não foi possível concluir a operação.");
  return dados;
}

function configurarFormulario() {
  const form = document.getElementById("formulario-relato");
  if (!form) return;
  configurarExemplos();
  form.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    const mensagem = document.getElementById("mensagem-formulario");
    const botaoSalvar = form.querySelector('[type="submit"]');
    const valor = function (id) { const campo = document.getElementById(id); return campo ? campo.value.trim() : ""; };
    const obrigatorios = ["campo-titulo", "campo-tipo", "campo-rodovia", "campo-km", "campo-descricao"];
    if (obrigatorios.some(function (id) { return !valor(id); })) {
      mostrarMensagem(mensagem, "Preencha todos os campos obrigatórios.", "erro");
      return;
    }

    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Validando e registrando...";
    try {
      if (!localizacaoValidada && !(await validarLocalizacao())) return;
      let foto = "";
      const arquivo = document.getElementById("campo-foto").files[0];
      if (arquivo) foto = await comprimirImagem(arquivo);
      const dados = {
        titulo: valor("campo-titulo"), tipo: valor("campo-tipo"),
        jurisdicao: "A definir pela equipe", fonte: "Cidadão",
        rodovia: valor("campo-rodovia"), km: valor("campo-km"),
        descricao: valor("campo-descricao"), gps: valor("campo-gps"),
        camera: valor("campo-camera") || "Não informado", foto: foto
      };
      const registro = await requisicao("/api/ocorrencias", {
        method: "POST", body: JSON.stringify(dados)
      });
      form.reset();
      localizacaoValidada = false;
      const statusLocal = document.getElementById("status-localizacao");
      if (statusLocal) statusLocal.textContent = "";
      mostrarMensagem(mensagem, registro.id ? "Relato validado e salvo. Protocolo: " + registro.id : "Relato validado e salvo na fila local.", "sucesso");
      carregarFila();
      carregarPainel();
      if (registro.id) form.dataset.ultimoRegistro = registro.id;
    } catch (erro) {
      mostrarMensagem(mensagem, erro.message, "erro");
    } finally {
      botaoSalvar.disabled = false;
      botaoSalvar.textContent = "Validar e salvar ocorrência";
    }
  });
}

function configurarExemplos() {
  const exemplos = {
    buraco: {
      titulo: "Exemplo fictício: buraco próximo à faixa de pedestres",
      tipo: "Buraco / defeito no pavimento",
      rodovia: "Avenida de demonstração",
      km: "Cruzamento fictício com a Rua de Demonstração",
      descricao: "Relato inteiramente fictício, usado apenas para demonstrar o preenchimento. Não representa uma ocorrência real.",
      gps: "-16.686900, -49.264800"
    },
    sinalizacao: {
      titulo: "Exemplo fictício: placa de sinalização danificada",
      tipo: "Sinalização danificada ou ausente",
      rodovia: "Rua de demonstração",
      km: "Trecho fictício próximo à Praça de Demonstração",
      descricao: "Relato inteiramente fictício, usado apenas para demonstrar o preenchimento. Não representa uma ocorrência real.",
      gps: "-16.679700, -49.255000"
    },
    alagamento: {
      titulo: "Exemplo fictício: ponto de alagamento",
      tipo: "Drenagem / alagamento",
      rodovia: "Avenida de demonstração",
      km: "Trecho fictício próximo ao Parque de Demonstração",
      descricao: "Relato inteiramente fictício, usado apenas para demonstrar o preenchimento. Não representa uma ocorrência real.",
      gps: "-16.700000, -49.270000"
    }
  };
  document.querySelectorAll(".exemplo-relato").forEach(function (botao) {
    botao.addEventListener("click", function () {
      const exemplo = exemplos[botao.dataset.exemplo];
      if (!exemplo) return;
      Object.keys(exemplo).forEach(function (chave) {
        const campo = document.getElementById("campo-" + chave);
        if (campo) campo.value = exemplo[chave];
      });
      localizacaoValidada = false;
      mostrarMensagem(document.getElementById("status-exemplo"), "Exemplo fictício preenchido. Ele só será enviado se você concluir o formulário.", "sucesso");
      mostrarMensagem(document.getElementById("status-localizacao"), "Valide as coordenadas antes de enviar o exemplo.", "");
      document.getElementById("formulario-relato").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function configurarGps() {
  const botao = document.getElementById("botao-gps");
  const campo = document.getElementById("campo-gps");
  if (!botao || !campo) return;
  campo.addEventListener("input", function () {
    localizacaoValidada = false;
    const estado = document.getElementById("status-localizacao");
    if (estado) estado.textContent = "Localização alterada. Valide novamente.";
  });
  botao.addEventListener("click", function () {
    if (!navigator.geolocation) {
      mostrarMensagem(document.getElementById("status-localizacao"), "Este navegador não disponibiliza localização. Informe as coordenadas manualmente.", "erro");
      return;
    }
    botao.disabled = true;
    botao.textContent = "Obtendo coordenadas...";
    navigator.geolocation.getCurrentPosition(async function (posicao) {
      campo.value = posicao.coords.latitude.toFixed(6) + ", " + posicao.coords.longitude.toFixed(6);
      localizacaoValidada = false;
      await validarLocalizacao();
      botao.disabled = false;
      botao.textContent = "Obter localização novamente";
    }, function () {
      mostrarMensagem(document.getElementById("status-localizacao"), "Não foi possível obter GPS. Informe latitude e longitude manualmente.", "erro");
      botao.disabled = false;
      botao.textContent = "Tentar obter localização";
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  });
}

async function validarLocalizacao() {
  const campo = document.getElementById("campo-gps");
  const estado = document.getElementById("status-localizacao");
  const gps = campo ? campo.value.trim() : "";
  if (!gps) {
    mostrarMensagem(estado, "Informe ou obtenha as coordenadas do ponto da ocorrência.", "erro");
    return false;
  }
  mostrarMensagem(estado, "Conferindo se o ponto fica dentro de Goiânia...", "");
  try {
    const resultado = await requisicao("/api/localizacao/validar", { method: "POST", body: JSON.stringify({ gps: gps }) });
    localizacaoValidada = resultado.valida === true;
    mostrarMensagem(estado, "Localização confirmada dentro de Goiânia.", "sucesso");
    return localizacaoValidada;
  } catch (erro) {
    localizacaoValidada = false;
    mostrarMensagem(estado, erro.message, "erro");
    return false;
  }
}

function comprimirImagem(arquivo) {
  if (!arquivo.type.startsWith("image/")) return Promise.reject(new Error("Selecione um arquivo de imagem."));
  return new Promise(function (resolve, reject) {
    const imagem = new Image();
    const url = URL.createObjectURL(arquivo);
    imagem.onload = function () {
      const escala = Math.min(1, 1100 / Math.max(imagem.width, imagem.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(imagem.width * escala));
      canvas.height = Math.max(1, Math.round(imagem.height * escala));
      canvas.getContext("2d").drawImage(imagem, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const data = canvas.toDataURL("image/jpeg", 0.65);
      if (data.length > 1_400_000) reject(new Error("A foto ainda está grande. Escolha outra imagem menor."));
      else resolve(data);
    };
    imagem.onerror = function () { URL.revokeObjectURL(url); reject(new Error("Não foi possível abrir a foto.")); };
    imagem.src = url;
  });
}

function configurarFiltros() {
  ["filtro-busca", "filtro-status", "filtro-municipio"].forEach(function (id) {
    const campo = document.getElementById(id);
    if (campo) campo.addEventListener("input", carregarFila);
    if (campo) campo.addEventListener("change", carregarFila);
  });
}

async function carregarFila() {
  const container = document.getElementById("lista-problemas");
  if (!container) return;
  try {
    const busca = (document.getElementById("filtro-busca") || {}).value || "";
    const status = (document.getElementById("filtro-status") || {}).value || "todos";
    const municipio = (document.getElementById("filtro-municipio") || {}).value || "";
    const todos = await requisicao("/api/ocorrencias");
    const termo = busca.toLocaleLowerCase("pt-BR");
    const local = municipio.toLocaleLowerCase("pt-BR");
    const itens = todos.filter(function (item) {
      const texto = [item.titulo, item.tipo, item.rodovia, item.km, item.municipio, item.descricao].join(" ").toLocaleLowerCase("pt-BR");
      return (!termo || texto.includes(termo)) && (status === "todos" || item.status === status) && (!local || String(item.municipio).toLocaleLowerCase("pt-BR").includes(local));
    });
    container.innerHTML = itens.length ? itens.map(renderizarCard).join("") : '<p class="estado-vazio">Nenhuma ocorrência encontrada na fila.</p>';
    container.querySelectorAll(".seletor-status").forEach(function (select) {
      select.addEventListener("change", function () { atualizarOcorrencia(Number(select.dataset.id), { status: select.value }); });
    });
    container.querySelectorAll(".botao-aviso-publico").forEach(function (botao) {
      botao.addEventListener("click", function () { atualizarOcorrencia(Number(botao.dataset.id), { avisoPublico: botao.dataset.ativo !== "true" }); });
    });
  } catch (erro) {
    container.innerHTML = '<p class="estado-vazio">Não foi possível carregar a fila. Inicie o servidor local pelo arquivo backend/app.py.</p>';
  }
}

function renderizarCard(item) {
  const statusAtual = STATUS.includes(item.status) ? item.status : "Recebida";
  const podeAvisar = ["Confirmada", "Em atendimento", "Concluída"].includes(statusAtual);
  const foto = item.foto ? '<img class="foto-ocorrencia" src="' + escaparHtml(item.foto) + '" alt="Foto do trecho registrada" />' : "";
  const opcoes = STATUS.map(function (opcao) { return '<option' + (opcao === statusAtual ? " selected" : "") + '>' + escaparHtml(opcao) + "</option>"; }).join("");
  const aviso = item.avisoPublico ? "Rascunho preparado para revisão; nada foi enviado." : "Avisos externos não são enviados por esta versão.";
  return '<article class="card-problema"><div class="card-topo"><h2>' + escaparHtml(item.titulo) + '</h2><span class="etiqueta-tipo">' + escaparHtml(item.tipo) + '</span></div>' +
    '<p class="card-local">' + escaparHtml(item.rodovia) + ' · ' + escaparHtml(item.km) + ' · ' + escaparHtml(item.municipio) + '</p>' +
    '<div class="selos"><span class="selo">' + escaparHtml(item.jurisdicao) + '</span><span class="selo">Prioridade: ' + escaparHtml(item.prioridade || "Média") + '</span><span class="selo">Origem: ' + escaparHtml(item.fonte) + '</span><span class="selo">Câmera: ' + escaparHtml(item.camera) + '</span></div>' +
    '<p class="descricao-card">' + escaparHtml(item.descricao) + '</p>' + (item.justificativa ? '<p class="texto-suave">' + escaparHtml(item.justificativa) + '</p>' : "") + '<p><strong>Coordenadas:</strong> ' + escaparHtml(item.gps) + '</p>' + foto +
    '<div class="card-operacao"><label>Status <select class="seletor-status" data-id="' + Number(item.id) + '">' + opcoes + '</select></label><button class="botao botao-terciario botao-aviso-publico" type="button" data-id="' + Number(item.id) + '" data-ativo="' + Boolean(item.avisoPublico) + '" ' + (podeAvisar ? "" : "disabled") + '>' + (item.avisoPublico ? "Retirar rascunho" : (podeAvisar ? "Preparar aviso" : "Disponível após confirmação")) + '</button></div>' +
    '<p class="nota-aviso">' + aviso + '</p><p class="card-data">Recebida em ' + formatarData(item.dataIso) + '</p></article>';
}

async function atualizarOcorrencia(id, alteracoes) {
  try {
    await requisicao("/api/ocorrencias/" + id, { method: "PATCH", body: JSON.stringify(alteracoes) });
    carregarFila();
    carregarPainel();
  } catch (erro) {
    const container = document.getElementById("lista-problemas");
    if (container) mostrarMensagem(container, erro.message, "erro");
  }
}

function formatarData(valor) {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "data não informada";
  return data.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function montarBarras(itens, vazio) {
  if (!itens.length) return '<p class="dash-vazio">' + vazio + '</p>';
  const maior = Math.max.apply(null, itens.map(function (item) { return item.valor; }));
  return itens.map(function (item) {
    const largura = maior ? item.valor / maior * 100 : 0;
    return '<div class="dash-linha"><span class="dash-linha-nome">' + escaparHtml(item.nome) + '</span><div class="dash-trilho"><div class="dash-preenchimento" style="width:' + largura + '%"></div></div><span class="dash-linha-valor">' + item.valor + '</span></div>';
  }).join("");
}

async function carregarPainel() {
  const total = document.getElementById("dash-total");
  if (!total) return;
  try {
    const lista = await requisicao("/api/ocorrencias");
    const abertas = lista.filter(function (item) { return ["Recebida", "Em triagem"].includes(item.status); }).length;
    const confirmadas = lista.filter(function (item) { return ["Confirmada", "Em atendimento"].includes(item.status); }).length;
    total.textContent = lista.length;
    document.getElementById("dash-abertas").textContent = abertas;
    document.getElementById("dash-sem-camera").textContent = lista.filter(function (item) { return String(item.camera).toLocaleLowerCase("pt-BR").includes("sem câmera"); }).length;
    document.getElementById("dash-confirmadas").textContent = confirmadas;
    const agrupar = function (campo) {
      const contagem = {};
      lista.forEach(function (item) { const nome = item[campo] || "Não informado"; contagem[nome] = (contagem[nome] || 0) + 1; });
      return Object.keys(contagem).map(function (nome) { return { nome: nome, valor: contagem[nome] }; }).sort(function (a, b) { return b.valor - a.valor; }).slice(0, 8);
    };
    const porStatus = STATUS.map(function (nome) { return { nome: nome, valor: lista.filter(function (item) { return item.status === nome; }).length }; }).filter(function (item) { return item.valor > 0; });
    document.getElementById("grafico-status").innerHTML = montarBarras(porStatus, "Nenhuma ocorrência registrada.");
    document.getElementById("grafico-tipos").innerHTML = montarBarras(agrupar("tipo"), "Nenhuma ocorrência registrada.");
    document.getElementById("grafico-fontes").innerHTML = montarBarras(agrupar("fonte"), "Nenhuma ocorrência registrada.");
  } catch (erro) {
    total.textContent = "—";
  }
}
