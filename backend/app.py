
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json

app = Flask(__name__)
CORS(app)

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "gemma3:1b"


@app.route("/api/analisar", methods=["POST"])
def analisar_relato():

    dados = request.get_json(silent=True) or {}
    descricao = dados.get("descricao", "").strip()

    if len(descricao) < 15:
        return jsonify({
            "erro": "A descrição precisa ter pelo menos 15 caracteres."
        }), 400

    prompt = f"""
    Você é um assistente de acessibilidade urbana do AcessoGyn.

    Analise o relato abaixo e retorne:

    1. categoria: escolha somente uma opção:
       Calçada, Rampa, Transporte, Sinalização ou Outro.

    2. prioridade: escolha Baixa, Média ou Alta.

    3. descricao_organizada: organize o texto sem inventar informações.

    4. justificativa: explique brevemente a prioridade sugerida.

    Regras:
    - Não invente informações.
    - Não faça avaliações técnicas oficiais.
    - A prioridade é apenas uma sugestão.
    - Responda somente em JSON válido.
    - Use exatamente as chaves:
      categoria, prioridade, descricao_organizada, justificativa.

    Relato do usuário:
    {descricao}
    """

    try:
        resposta = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "format": "json"
            },
            timeout=120
        )

        resposta.raise_for_status()

        conteudo = resposta.json()["response"]
        resultado = json.loads(conteudo)

        categorias = [
            "Calçada",
            "Rampa",
            "Transporte",
            "Sinalização",
            "Outro"
        ]

        prioridades = ["Baixa", "Média", "Alta"]

        if resultado.get("categoria") not in categorias:
            resultado["categoria"] = "Outro"

        if resultado.get("prioridade") not in prioridades:
            resultado["prioridade"] = "Média"

        for campo in [
            "descricao_organizada",
            "justificativa"
        ]:
            if not isinstance(resultado.get(campo), str):
                resultado[campo] = descricao

        return jsonify(resultado)

    except requests.exceptions.ConnectionError:
        return jsonify({
            "erro": "Não foi possível conectar ao Ollama."
        }), 503

    except requests.exceptions.Timeout:
        return jsonify({
            "erro": "A IA demorou muito para responder."
        }), 504

    except (requests.RequestException, KeyError, ValueError):
        return jsonify({
            "erro": "Não foi possível processar a resposta da IA."
        }), 502


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
