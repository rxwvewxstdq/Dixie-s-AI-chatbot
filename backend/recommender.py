from recipes import RECIPES
from pricing import calculate_recipe_price

# Сопоставление диетических требований с тегами
DIETARY_MAPPING = {
    "glutenfree": ["без глютена", "gluten free", "безглютеновое", "glutenfree"],
    "vegetarian": ["вегетарианское", "vegetarian", "овощное", "без мяса"],
    "vegan": ["веганское", "vegan", "растительное"],
    "lowcalorie": ["низкокалорийное", "диетическое", "low calorie", "для похудения", "lowcalorie"],
    "lactosefree": ["без лактозы", "lactose free", "без молока"],
    "quick": ["быстрое", "quick", "на скорую руку", "за 15 минут", "быстро"]
}


def find_recipes(filters):
    result = []

    for recipe in RECIPES:
        price_data = calculate_recipe_price(recipe)

        # Получаем теги рецепта в нижнем регистре
        recipe_tags = [tag.lower() for tag in recipe.get("tags", [])]
        recipe_title = recipe["title"].lower()

        # Фильтр по бюджету
        if "budget" in filters:
            if price_data["total"] > filters["budget"]:
                continue

        # Фильтр по ингредиентам
        if "ingredients" in filters:
            matches = 0
            recipe_ingredients = [ing.lower() for ing in recipe.get("ingredients", {}).keys()]
            for ingredient in filters["ingredients"]:
                if ingredient.lower() in recipe_ingredients:
                    matches += 1
            if matches == 0:
                continue

        # Фильтр по типу блюда
        if "meal" in filters:
            meal = filters["meal"].lower()
            if meal not in recipe_tags:
                continue

        # Фильтр по диетическим требованиям
        if "dietary" in filters:
            dietary = filters["dietary"].lower()
            found = False

            # Проверяем по всем ключам в mapping
            for diet_key, diet_keywords in DIETARY_MAPPING.items():
                # Если в dietary запросе есть ключевое слово диеты
                if any(keyword in dietary for keyword in diet_keywords):
                    # Проверяем, есть ли соответствующий тег у рецепта
                    if diet_key in recipe_tags or any(keyword in recipe_tags for keyword in diet_keywords):
                        found = True
                        break
                    # Проверяем название рецепта
                    if any(keyword in recipe_title for keyword in diet_keywords):
                        found = True
                        break

            # Если не нашли соответствия - пропускаем рецепт
            if not found:
                continue

        result.append({
            "recipe": recipe,
            "price": price_data
        })

    result.sort(key=lambda x: x["price"]["total"])
    return result[:5]