from flask import Flask, request, jsonify
from flask_cors import CORS
import json

from llm import parse_user_request
from recommender import find_recipes

app = Flask(__name__)
CORS(app)


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    if not data or "message" not in data:
        return jsonify({"error": "Не передан параметр 'message'"}), 400

    user_message = data["message"]

    try:
        # Парсим запрос пользователя через модель
        filters = parse_user_request(user_message)

        # Подбираем рецепты по фильтрам
        recipes = find_recipes(filters)

        # Форматируем ответ
        # В app.py, в части форматирования ответа:

        recipes = find_recipes(filters)

        # Форматируем ответ
        response = []
        for r in recipes:
            recipe = r["recipe"]
            price = r["price"]
            response.append({
                "title": recipe["title"],
                "time": recipe.get("time"),
                "servings": recipe.get("servings"),
                "tags": recipe.get("tags", []),
                "total_price": price["total"],
                "ingredients": [
                    {
                        "name": item["name"],
                        "amount": f"{item['amount']} {get_unit(item['name'])}" if item.get('amount') else None,
                        "price": item["price"]
                    }
                    for item in price["items"]
                ]
            })

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


def get_unit(product_name):
    """Возвращает единицу измерения для продукта"""
    units = {
        "макароны": "г",
        "куриное филе": "кг",
        "томаты": "кг",
        "сыр": "г",
        "картофель": "кг",
        "морковь": "кг",
        "капуста": "кг",
        "хлеб": "шт",
        "яйца": "шт",
        "молоко": "мл"
    }
    return units.get(product_name, "г")


if __name__ == "__main__":
    print("="*50)
    print("Сервер чат-бота запущен на http://0.0.0.0:8080")
    print("="*50)
    app.run(host="0.0.0.0", port=8080, debug=True)