import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
// Bu dosya çalıştırılmadan önce questions.json dosyasının scripts klasöründe olduğundan emin olun.
const JSON_FILE_PATH = path.resolve(process.cwd(), 'scripts/questions.json');
// ------------------------------------------------------------------

const loadEnvFile = async (filepath) => {
  try {
    const raw = await fs.readFile(filepath, 'utf8');
    const entries = raw.split('\n');
    const env = {};
    for (const line of entries) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
    return env;
  } catch {
    return {};
  }
};

const normalizeDomain = (domain) => {
  if (!domain) return '';
  return domain.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '').toLowerCase();
};

const main = async () => {
  // 1. JSON dosyasını oku
  let quizData = [];
  try {
    const rawData = await fs.readFile(JSON_FILE_PATH, 'utf8');
    quizData = JSON.parse(rawData);
    console.log(`JSON dosyası okundu. Toplam ${quizData.length} site bulundu.\n`);
  } catch (error) {
    console.error(`HATA: JSON dosyası okunamadı (${JSON_FILE_PATH}):`, error.message);
    console.log('Lütfen "scripts/questions.json" dosyasını oluşturduğunuzdan emin olun.');
    return;
  }

  const envLocal = await loadEnvFile(path.resolve(process.cwd(), '.env.local'));
  const env = await loadEnvFile(path.resolve(process.cwd(), '.env'));
  const mergedEnv = { ...process.env, ...env, ...envLocal };
  
  const supabaseUrl = mergedEnv.VITE_SUPABASE_URL || mergedEnv.SUPABASE_URL;
  const supabaseKey = mergedEnv.SUPABASE_SERVICE_ROLE_KEY || mergedEnv.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase bağlantı bilgileri eksik.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  for (const item of quizData) {
    // JSON formatı: { "site": "domain.com", "questions": [...] }
    const targetDomain = normalizeDomain(item.site);
    console.log(`> İşleniyor: ${item.site} (${targetDomain})`);

    // 2. Projeyi bul
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('id, name, domain')
      .ilike('domain', `%${targetDomain}%`);

    if (projectError) {
      console.error(`  HATA: Proje aranırken hata oluştu: ${projectError.message}`);
      continue;
    }

    const project = projects.find(p => normalizeDomain(p.domain) === targetDomain) || projects[0];

    if (!project) {
      console.error(`  UYARI: Bu domain için proje bulunamadı.`);
      continue;
    }

    console.log(`  Proje Bulundu: ${project.name} (ID: ${project.id})`);

    // 3. Mevcut onboarding görevlerini sil
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('project_id', project.id)
      .eq('task_section', 'onboarding');

    if (deleteError) {
      console.error(`  HATA: Eski görevler silinemedi: ${deleteError.message}`);
      continue;
    }
    // console.log(`  Eski 'onboarding' görevleri temizlendi.`);

    // 4. Yeni Quizleri ekle
    let addedCount = 0;
    for (const qObj of item.questions) {
      // JSON formatı: { "q": "...", "options": [...], "answer": "..." }
      const questionText = qObj.q;
      const choices = qObj.options;
      const answerText = qObj.answer;
      
      // Doğru cevabın indeksini bul
      let correctChoiceIndex = choices.findIndex(c => c === answerText);
      
      // Eğer tam eşleşme bulunamazsa (trim/case sorunu olabilir), yumuşak eşleşme dene
      if (correctChoiceIndex === -1) {
        correctChoiceIndex = choices.findIndex(c => c.trim().toLowerCase() === answerText.trim().toLowerCase());
      }

      // Hala bulunamazsa varsayılan olarak 0 al ve uyar
      if (correctChoiceIndex === -1) {
        console.warn(`  UYARI: "${questionText}" sorusu için doğru cevap seçeneklerde bulunamadı. İlk seçenek varsayılan yapılıyor.`);
        correctChoiceIndex = 0;
      }

      const taskPayload = {
        project_id: project.id,
        title: `Quiz: ${questionText.length > 30 ? questionText.substring(0, 27) + '...' : questionText}`,
        description: questionText,
        task_kind: 'quiz',
        quiz_type: 'multiple_choice',
        question: questionText,
        choices: choices,
        correct_choice: correctChoiceIndex,
        xp_reward: 100, // Varsayılan XP
        task_section: 'onboarding',
        is_sponsored: false,
        reward_cadence: 'once'
      };

      const { error: insertError } = await supabase
        .from('tasks')
        .insert(taskPayload);

      if (insertError) {
        console.error(`  HATA: Quiz eklenemedi "${questionText}": ${insertError.message}`);
      } else {
        addedCount++;
      }
    }
    console.log(`  => ${addedCount} quiz başarıyla eklendi.\n`);
  }
};

main();
