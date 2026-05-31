from products import PRODUCTS


def calculate_recipe_price(recipe):
    total = 0
    items = []

    for name, amount in recipe["ingredients"].items():
        if name not in PRODUCTS:
            continue

        product_price = PRODUCTS[name]["price"]

        # Нормализуем количество в зависимости от единицы измерения
        unit = PRODUCTS[name]["unit"]
        if "кг" in unit or "г" in unit:
            # Для весовых продуктов
            cost = round(product_price * amount)
        elif "шт" in unit:
            # Для штучных продуктов
            cost = round(product_price * amount)
        else:
            cost = round(product_price * amount)

        items.append({
            "name": name,
            "amount": amount,
            "price": cost
        })

        total += cost

    return {
        "total": total,
        "items": items
    }