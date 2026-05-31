import requests
import json
import re

LM_STUDIO_URL = "http://127.0.0.1:5000/v1/chat/completions"
MODEL_NAME = "qwen3-8b"

SYSTEM_PROMPT = """
Ты помощник сайта Дикси.

Извлекай из запроса:
- budget (число в рублях, если указан)
- meal (тип блюда: завтрак, обед, ужин, перекус)
- ingredients (список ингредиентов, которые хочет видеть пользователь)
- dietary (особые требования: диетическое, нежирное, быстрое, дешевое)

Верни ТОЛЬКО валидный JSON. Никакого другого текста.

Примеры:

Запрос: "ужин до 300 рублей"
Ответ: {"budget": 300, "meal": "ужин"}

Запрос: "что приготовить из курицы и сыра"
Ответ: {"ingredients": ["куриное филе", "сыр"]}

Запрос: "что поесть чтоб не толстеть"
Ответ: {"dietary": "нежирное"}

Запрос: "быстрый завтрак"
Ответ: {"meal": "завтрак", "dietary": "быстро"}

Запрос: "дешевый обед"
Ответ: {"meal": "обед", "dietary": "дешево"}
"""


def parse_user_request(message):
    try:
        response = requests.post(
            LM_STUDIO_URL,
            json={
                "model": MODEL_NAME,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": message}
                ],
                "temperature": 0.1,  # чуть больше творчества, но всё ещё предсказуемо
                "max_tokens": 200,
                "response_format": {"type": "json_object"}
            },
            timeout=30
        )

        if response.status_code != 200:
            print(f"LLM ответил ошибкой: {response.status_code}")
            # Если LM Studio не отвечает - используем fallback парсер
            return fallback_parse(message)

        result = response.json()
        content = result["choices"][0]["message"]["content"]
        print(f"LLM ответ: {content}")

        try:
            filters = json.loads(content)
        except json.JSONDecodeError:
            print("Не удалось распарсить JSON, используем fallback")
            filters = fallback_parse(message)

        # Очищаем и нормализуем фильтры
        normalized = {}

        if "budget" in filters and isinstance(filters["budget"], (int, float)):
            normalized["budget"] = int(filters["budget"])

        if "meal" in filters and filters["meal"]:
            normalized["meal"] = filters["meal"].lower()

        if "ingredients" in filters and isinstance(filters["ingredients"], list):
            normalized["ingredients"] = [ing.lower() for ing in filters["ingredients"] if ing]

        if "dietary" in filters and filters["dietary"]:
            normalized["dietary"] = filters["dietary"].lower()

        print(f"Нормализованные фильтры: {normalized}")
        return normalized

    except Exception as e:
        print(f"Ошибка в parse_user_request: {e}")
        return fallback_parse(message)


def fallback_parse(message):
    """
    Ручной парсер для случаев, когда нейросеть недоступна или выдала кривой ответ.
    """
    message_lower = message.lower()
    filters = {}

    # Поиск бюджета
    budget_patterns = [
        r'до\s*(\d+)',
        r'не\s*более\s*(\d+)',
        r'(\d+)\s*руб',
        r'(\d+)\s*р',
    ]
    for pattern in budget_patterns:
        match = re.search(pattern, message_lower)
        if match:
            filters["budget"] = int(match.group(1))
            break

    # Поиск типа приёма пищи
    meal_map = {
        "завтрак": "завтрак",
        "обед": "обед",
        "ужин": "ужин",
        "перекус": "перекус",
        "полдник": "перекус"
    }
    for key, value in meal_map.items():
        if key in message_lower:
            filters["meal"] = value
            break

    # Поиск ингредиентов (из списка доступных продуктов)
    available_ingredients = [
        "куриное филе", "курица",
        "сыр", "макароны", "томаты", "картофель",
        "морковь", "капуста", "хлеб", "яйца"
    ]
    found_ingredients = []
    for ing in available_ingredients:
        if ing in message_lower or ing.replace(" ", "") in message_lower:
            found_ingredients.append(ing)
    if found_ingredients:
        filters["ingredients"] = found_ingredients

    # Поиск диетических требований
    if any(word in message_lower for word in ["жирн", "жырн", "толст", "пуз"]):
        filters["dietary"] = "нежирное"
    elif "быстр" in message_lower:
        filters["dietary"] = "быстро"
    elif "дешев" in message_lower or "эконом" in message_lower:
        filters["dietary"] = "дешево"
    elif "диет" in message_lower or "полезн" in message_lower or "здоров" in message_lower:
        filters["dietary"] = "диетическое"

    print(f"Fallback парсер вернул: {filters}")
    return filters