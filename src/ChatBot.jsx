import React, { useState } from "react";

// Пресеты диет и ограничений
const DIET_PRESETS = {
  glutenfree: {
    name: "🚫 Без глютена",
    description: "Исключаем продукты с глютеном (пшеница, рожь, ячмень)",
    keywords: ["без глютена", "gluten free", "целиакия", "безглютеновое"],
    exampleRecipe: "Гречка с овощами"
  },
  vegetarian: {
    name: "🌱 Вегетарианское",
    description: "Без мяса и рыбы, но с яйцами и молочными продуктами",
    keywords: ["вегетарианское", "без мяса", "vegetarian", "овощное"],
    exampleRecipe: "Овощной суп"
  },
  vegan: {
    name: "🌿 Веганское",
    description: "Только растительная пища, без продуктов животного происхождения",
    keywords: ["веганское", "vegan", "растительное"],
    exampleRecipe: "Гречка с овощами"
  },
  lowcalorie: {
    name: "🔥 Низкокалорийное",
    description: "Блюда с низким содержанием калорий (до 300 ккал на порцию)",
    keywords: ["низкокалорийное", "диетическое", "low calorie", "для похудения"],
    exampleRecipe: "Овощной суп"
  },
  lactosefree: {
    name: "🥛 Без лактозы",
    description: "Без молочных продуктов или с безлактозной заменой",
    keywords: ["без лактозы", "lactose free", "без молока"],
    exampleRecipe: "Гречка с овощами"
  },
  quick: {
    name: "⚡ Быстрое",
    description: "Блюда, которые готовятся до 20 минут",
    keywords: ["быстрое", "quick", "на скорую руку", "за 15 минут"],
    exampleRecipe: "Сырные гренки"
  }
};

export default function ChatBot({ onAddToCart, cartItemCount }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [showPresets, setShowPresets] = useState(false);
  const [activeDiet, setActiveDiet] = useState(null);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Привет! Я помогу подобрать быстрое и дешевое блюдо 🍳\n\nНапиши, что хочешь приготовить, или выбери ограничения по кнопкам ниже 👇",
      showDietButtons: true
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage(userMessage, dietFilter = null) {
    const finalMessage = userMessage || message;
    if (!finalMessage.trim()) return;

    let queryText = finalMessage;

    if (dietFilter) {
      const diet = DIET_PRESETS[dietFilter];
      queryText = `${finalMessage} ${diet.keywords[0]}`;
      setActiveDiet(dietFilter);
    } else {
      setActiveDiet(null);
    }

    setMessages(prev => [
      ...prev,
      { sender: "user", text: finalMessage }
    ]);

    setMessage("");
    setIsLoading(true);
    setShowPresets(false);

    try {
      const response = await fetch("http://localhost:8080/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: queryText
        })
      });

      const data = await response.json();

      const limitedRecipes = Array.isArray(data) ? data.slice(0, 3) : [];

      let filteredRecipes = limitedRecipes;
      if (dietFilter) {
        filteredRecipes = limitedRecipes.filter(recipe => {
          const recipeTags = (recipe.tags || []).map(t => t.toLowerCase());
          return recipeTags.includes(dietFilter);
        });
      }

      let answer = "";

      if (filteredRecipes.length > 0) {
  answer = filteredRecipes.map((recipe, index) => {
    let recipeText = `🍽 **${recipe.title}**\n`;
    recipeText += `⏱ Время: ${recipe.time} мин\n`;
    recipeText += `👥 Порций: ${recipe.servings}\n`;
    recipeText += `💰 Стоимость: ${recipe.total_price} ₽\n\n`;

    if (recipe.tags && recipe.tags.length > 0) {
      recipeText += `🏷 Теги: ${recipe.tags.join(", ")}\n\n`;
    }

    recipeText += `📝 **Ингредиенты:**\n`;
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      recipe.ingredients.forEach(ing => {
        let amountText = ing.amount ? ` (${ing.amount})` : "";
        recipeText += `  • ${ing.name}${amountText} — ${ing.price} ₽\n`;
      });
    }

    recipeText += `\n💡 **Как приготовить:**\n`;
    recipeText += `  ${getCookingHint(recipe.title)}\n`;

    if (index < filteredRecipes.length - 1) {
        recipeText += `\n${'-'.repeat(24)}\n\n`;
          }

          return recipeText;
        }).join("");
      } else {
        answer = "😔 К сожалению, не удалось найти подходящие рецепты с выбранными ограничениями.\n\nПопробуйте изменить запрос или выбрать другой фильтр.";
      }

      setMessages(prev => [
        ...prev,
        {
          sender: "bot",
          text: answer,
          recipes: filteredRecipes,
          showDietButtons: false
        }
      ]);
    } catch (err) {
      console.error("Ошибка:", err);
      setMessages(prev => [
        ...prev,
        {
          sender: "bot",
          text: "❌ Ошибка подключения к серверу.\n\nУбедитесь, что сервер запущен на http://localhost:8080",
          showDietButtons: false
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function getCookingHint(title) {
    const hints = {
      "Паста с курицей и томатами": "Отварите пасту. Обжарьте курицу, добавьте томаты и сыр. Смешайте с пастой.",
      "Овощной суп": "Нарежьте овощи, варите 20-30 минут. Добавьте зелень по вкусу.",
      "Сырные гренки": "Обжарьте хлеб на сковороде, добавьте яйца и сыр. Жарьте до золотистой корочки.",
      "Гречка с овощами": "Отварите гречку. Обжарьте овощи на сковороде. Смешайте с гречкой.",
      "Салат Цезарь с курицей": "Обжарьте курицу. Нарежьте салат, добавьте сыр, сухари. Заправьте соусом.",
      "Курица с сыром в духовке": "Выложите курицу в форму, посыпьте сыром. Запекайте 30 минут при 180°C.",
      "Омлет с сыром": "Взбейте яйца с молоком, вылейте на сковороду. Посыпьте сыром. Жарьте 5-7 минут."
    };
    return hints[title] || "Смешайте все ингредиенты и приготовьте по вкусу. Приятного аппетита!";
  }

  const handleAddToCart = (recipe) => {
    onAddToCart(recipe);
    setMessages(prev => [
      ...prev,
      {
        sender: "bot",
        text: `✅ **${recipe.title}**\nДобавлено ${recipe.ingredients?.length || 0} ингредиент(ов) в корзину:\n${recipe.ingredients?.map(ing => `  • ${ing.name}`).join('\n')}\n\nПродолжайте выбирать рецепты!`,
        showDietButtons: false
      }
    ]);
  };

  const handlePresetClick = (presetKey) => {
    const preset = DIET_PRESETS[presetKey];
    sendMessage(`найди ${preset.name.toLowerCase()} блюда`, presetKey);
  };

  const togglePresets = () => {
    setShowPresets(!showPresets);
  };

  return (
    <>
      {/* Кнопка чата - скрывается когда чат открыт */}
      {!open && (
        <button className="chat-button" onClick={() => setOpen(true)}>
          <div className="chat-button-content">
            🤖
            {cartItemCount > 0 && (
              <span className="chat-cart-badge">{cartItemCount}</span>
            )}
          </div>
        </button>
      )}

      {open && (
        <div className="chat-overlay">
          <div className="chat-window">
            <div className="chat-header">
              <span>🤖 Шеф-помощник Дикси</span>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>

            <div className="chat-body">
              {messages.map((msg, index) => (
                <div key={index}>
                  <div className={msg.sender === "user" ? "message user" : "message bot"}>
                    <div className="message-content">
                      {msg.text.split('\n').map((line, i) => {
                        if (line.includes('**')) {
                          const parts = line.split(/(\*\*[^*]+\*\*)/);
                          return (
                            <div key={i}>
                              {parts.map((part, j) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                  return <strong key={j}>{part.slice(2, -2)}</strong>;
                                }
                                return part;
                              })}
                            </div>
                          );
                        }
                        return <div key={i}>{line}</div>;
                      })}
                    </div>
                  </div>

                  {msg.showDietButtons && !isLoading && (
                    <div className="presets-container">
                      <button className="presets-toggle" onClick={togglePresets}>
                        🥗 Диеты и ограничения {showPresets ? '▲' : '▼'}
                      </button>
                      {showPresets && (
                        <div className="presets-grid">
                          {Object.entries(DIET_PRESETS).map(([key, preset]) => (
                            <button
                              key={key}
                              className={`preset-btn ${activeDiet === key ? 'active' : ''}`}
                              onClick={() => handlePresetClick(key)}
                              title={preset.description}
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {msg.sender === "bot" && msg.recipes && msg.recipes.length > 0 && (
                    <div className="recipe-actions">
                      {msg.recipes.map((recipe, idx) => (
                        <button
                          key={idx}
                          className="add-to-cart-btn"
                          onClick={() => handleAddToCart(recipe)}
                        >
                          🛒 Добавить ингредиенты: {recipe.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="message bot loading">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </div>

            <div className="chat-footer">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Например: ужин до 250 рублей"
                onKeyDown={(e) => e.key === "Enter" && sendMessage(message)}
                disabled={isLoading}
              />
              <button onClick={() => sendMessage(message)} disabled={isLoading}>
                {isLoading ? "..." : "→"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}