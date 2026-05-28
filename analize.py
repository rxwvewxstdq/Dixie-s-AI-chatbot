import json
import requests
from typing import Dict, Any, Optional
from flask import Flask, request, jsonify
from flask_cors import CORS
import re

# =========================
# 1. ПОДКЛЮЧЕНИЕ К LM STUDIO
# =========================

LM_STUDIO_URL = "http://127.0.0.1:5000/v1/chat/completions"
MODEL_NAME = "qwen_qwen3.5-9b"

SYSTEM_PROMPT = """
Ты — ассистент диетологического магазина. Твоя задача — извлекать из сообщения пользователя требования к продукту.

Правила:
1. Извлекай параметры: калории (ккал), белки (г), жиры (г), углеводы (г), максимальная цена (руб).
2. Если пользователь сказал "примерно", "около", "не больше" — это всё равно извлекай как целевое значение.
3. Если параметр не указан - не включай его в JSON.
4. Если пользователь указал диапазон (например, "от 200 до 300 ккал") — сохраняй как min и max.
5. Отвечай ТОЛЬКО JSON-объектом, без пояснений.

Примеры:
Пользователь: "Хочу что-то с калориями около 500, жиров не больше 20г, и чтобы стоило до 300 рублей"
Ответ: {"калории": 500, "жиры": {"max": 20}, "цена": {"max": 300}}

Пользователь: "Белков 30-40 грамм, углеводов примерно 50, цена до 500"
Ответ: {"белки": {"min": 30, "max": 40}, "углеводы": 50, "цена": {"max": 500}}
"""

def extract_requirements(user_message: str) -> Dict[str, Any]:
    response = requests.post(
        LM_STUDIO_URL,
        json={
            "model": MODEL_NAME,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            "temperature": 0,
            "max_tokens": 200,
            "response_format": {"type": "json_object"},
            "extra_body": {
                "chat_template_kwargs": {
                    "enable_thinking": False
                }
            }
        }
    )

    if response.status_code != 200:
        raise Exception(f"Ошибка от LM Studio: {response.text}")

    result = response.json()
    content = result["choices"][0]["message"]["content"]

    if not content:
        # Если модель всё равно вернула пустой content
        return manual_extract_requirements(user_message)

    # Парсим JSON из content
    try:
        requirements = json.loads(content)
        return requirements
    except json.JSONDecodeError:
        return manual_extract_requirements(user_message)


def manual_extract_requirements(text: str) -> Dict[str, Any]:
    req = {}

    # Калории
    if match := re.search(r'(\d+)\s*(?:калорий|ккал)', text, re.I):
        req["калории"] = int(match.group(1))

    # Белки
    if match := re.search(r'максимум\s*(\d+)\s*(?:белков|белка)', text, re.I):
        req["белки"] = {"max": int(match.group(1))}

    # Жиры
    if match := re.search(r'максимум\s*(\d+)\s*(?:жиров)', text, re.I):
        req["жиры"] = {"max": int(match.group(1))}

    # Углеводы
    if match := re.search(r'максимум\s*(\d+)\s*(?:углеводов)', text, re.I):
        req["углеводы"] = {"max": int(match.group(1))}

    # Цена
    if match := re.search(r'(\d+)\s*(?:руб|рублей)', text, re.I):
        req["цена"] = {"max": int(match.group(1))}

    return req

# =========================
# 2. БАЗА ТОВАРОВ
# =========================

PRODUCTS = [
    {"id": 1, "name": "Протеиновый батончик", "description": "Шоколадный вкус, 50г",
     "calories": 450, "protein": 25, "fat": 15, "carbs": 40, "price": 150},
    {"id": 2, "name": "Творожная запеканка", "description": "С изюмом, 200г",
     "calories": 320, "protein": 18, "fat": 8, "carbs": 35, "price": 120},
    {"id": 3, "name": "Куриное филе", "description": "Отварное, 150г",
     "calories": 165, "protein": 31, "fat": 3.5, "carbs": 0, "price": 200},
    {"id": 4, "name": "Овсяная каша", "description": "С ягодами, 250г",
     "calories": 280, "protein": 10, "fat": 5, "carbs": 45, "price": 90},
    {"id": 5, "name": "Смузи энергетический", "description": "Банановый, 300мл",
     "calories": 520, "protein": 12, "fat": 8, "carbs": 95, "price": 250}
]

# =========================
# 3. ФУНКЦИИ ПОДБОРА
# =========================

def calculate_score(product: Dict, requirements: Dict) -> float:
    score = 0.0

    # Калории
    if "калории" in requirements:
        target = requirements["калории"]
        if isinstance(target, dict):
            if "min" in target and product["calories"] < target["min"]:
                score += (target["min"] - product["calories"]) * 0.5
            if "max" in target and product["calories"] > target["max"]:
                score += (product["calories"] - target["max"]) * 0.5
        else:
            diff = abs(product["calories"] - target) / target
            score += diff * 10

    # Белки
    if "белки" in requirements:
        target = requirements["белки"]
        if isinstance(target, dict):
            if "min" in target and product["protein"] < target["min"]:
                score += (target["min"] - product["protein"]) * 2
            if "max" in target and product["protein"] > target["max"]:
                score += (product["protein"] - target["max"]) * 2
        else:
            diff = abs(product["protein"] - target) / max(target, 1)
            score += diff * 10

    # Жиры
    if "жиры" in requirements:
        target = requirements["жиры"]
        if isinstance(target, dict):
            if "max" in target and product["fat"] > target["max"]:
                score += (product["fat"] - target["max"]) * 3
        else:
            if product["fat"] > target:
                score += (product["fat"] - target) * 3

    # Углеводы
    if "углеводы" in requirements:
        target = requirements["углеводы"]
        if isinstance(target, dict):
            if "max" in target and product["carbs"] > target["max"]:
                score += (product["carbs"] - target["max"]) * 2
        else:
            diff = abs(product["carbs"] - target) / max(target, 1)
            score += diff * 8

    # Цена
    if "цена" in requirements:
        max_price = requirements["цена"].get("max") if isinstance(requirements["цена"], dict) else requirements["цена"]
        if max_price == 0:
            score -= product["price"] * 0.1
        elif product["price"] > max_price:
            score += (product["price"] - max_price) * 10

    return score


def find_best_product(requirements: Dict[str, Any]) -> Optional[Dict]:
    if not requirements:
        return None

    best_product = None
    best_score = float("inf")

    for product in PRODUCTS:
        score = calculate_score(product, requirements)
        if score < best_score:
            best_score = score
            best_product = product

    if best_score > 300:
        return None

    return best_product

# =========================
# 4. ФОРМИРОВАНИЕ ОТВЕТА
# =========================

def format_response(product: Optional[Dict], requirements: Dict) -> str:
    if not product:
        return "Извините, не удалось найти товар, подходящий под ваши требования. Попробуйте изменить параметры."

    response = f"""
Найден подходящий товар:

📦 {product['name']} ({product['description']})
💰 Цена: {product['price']} руб.

📊 КБЖУ на порцию:
- Калории: {product['calories']} ккал
- Белки: {product['protein']} г
- Жиры: {product['fat']} г
- Углеводы: {product['carbs']} г
"""

    if "калории" in requirements:
        target = requirements["калории"]
        if isinstance(target, dict):
            response += f"Вы хотели: калории {target.get('min', '?')}-{target.get('max', '?')} -> {product['calories']}\n"
        else:
            response += f"Вы хотели: ~{target} ккал -> {product['calories']}\n"

    if "цена" in requirements:
        max_price = requirements["цена"].get("max") if isinstance(requirements["цена"], dict) else requirements["цена"]
        if max_price > 0:
            response += f"Ваш бюджет: до {max_price} руб. -> {product['price']} руб.\n"

    return response

# =========================
# 5. FLASK API
# =========================

app = Flask(__name__)
CORS(app)


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    if not data or "message" not in data:
        return jsonify({"error": "Не передан параметр 'message'"}), 400

    user_message = data["message"]

    try:
        requirements = extract_requirements(user_message)
        best_product = find_best_product(requirements)
        answer = format_response(best_product, requirements)
        return jsonify({"response": answer})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "lm_studio": "connected"})


if __name__ == "__main__":
    print("=" * 50)
    print("Сервер чат-бота запущен!")
    print(f"Подключение к LM Studio: {LM_STUDIO_URL}")
    print(f"API доступен на: http://0.0.0.0:8080")
    print(f"Отправляйте POST запросы на: http://0.0.0.0:8080/chat")
    print("=" * 50)

    app.run(host="0.0.0.0", port=8080, debug=False)