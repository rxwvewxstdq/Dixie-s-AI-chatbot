import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log("1. Получен запрос от браузера");
  
  try {
    const { message } = await request.json();
    console.log("2. Сообщение пользователя:", message);
    
    console.log("3. Отправляю запрос в LM Studio...");
    const response = await fetch('http://localhost:5000/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.5-9b',
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });
    
    console.log("4. Статус ответа от LM Studio:", response.status);
    
    const data = await response.json();
    console.log("5. Ответ от LM Studio:", data);
    
    if (data.error) {
      console.error("6. Ошибка от LM Studio:", data.error);
      return NextResponse.json({ error: data.error }, { status: 500 });
    }
    
    const botResponse = data.choices?.[0]?.message?.content || 'Не удалось получить ответ';
    console.log("7. Ответ бота:", botResponse);
    
    return NextResponse.json({ response: botResponse });
  } catch (error) {
    console.error("ОШИБКА:", error);
    return NextResponse.json(
      { error: 'Сервер LM Studio недоступен: ' + String(error) },
      { status: 500 }
    );
  }
}