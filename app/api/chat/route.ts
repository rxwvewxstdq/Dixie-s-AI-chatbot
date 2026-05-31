import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    console.log("=== НОВЫЙ ЗАПРОС ===");
    console.log("1. Сообщение от пользователя:", message);
    
    // Проверяем существование Python скрипта
    const pythonScript = path.join(process.cwd(), 'analize.py');
    console.log("2. Путь к скрипту:", pythonScript);
    
    if (!fs.existsSync(pythonScript)) {
      console.error("3. ОШИБКА: Файл analize.py не найден в папке:", process.cwd());
      return NextResponse.json({ 
        error: 'Python скрипт не найден. Убедитесь, что файл analize.py находится в корне проекта.' 
      }, { status: 500 });
    }
    console.log("3. Файл analize.py найден");
    
    // Экранируем кавычки в сообщении
    const escapedMessage = message.replace(/"/g, '\\"').replace(/\n/g, ' ');
    console.log("4. Сообщение после экранирования:", escapedMessage.substring(0, 100));
    
    // Запускаем Python скрипт
    const command = `python "${pythonScript}" "${escapedMessage}"`;
    console.log("5. Выполняю команду:", command);
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30 секунд таймаут
        maxBuffer: 1024 * 1024 * 10, // 10MB буфер
      });
      
      if (stderr) {
        console.log("6. STDERR (предупреждения):", stderr);
      }
      
      console.log("7. STDOUT (вывод Python):", stdout);
      
      // Парсим JSON ответ
      let result;
      try {
        result = JSON.parse(stdout);
      } catch (parseError) {
        console.error("8. Ошибка парсинга JSON:", parseError);
        console.error("   Полученный stdout:", stdout);
        return NextResponse.json({ 
          error: 'Python скрипт вернул некорректный JSON' 
        }, { status: 500 });
      }
      
      console.log("9. Успешно получен ответ:", result);
      
      return NextResponse.json({ response: result.response });
      
    } catch (execError: any) {
      console.error("10. Ошибка выполнения Python:", execError.message);
      if (execError.stderr) console.error("    stderr:", execError.stderr);
      if (execError.stdout) console.error("    stdout:", execError.stdout);
      
      return NextResponse.json({ 
        error: `Ошибка выполнения Python: ${execError.message}` 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error("Критическая ошибка API:", error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
