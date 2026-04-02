#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import translate from 'translate';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '../locales');

// Configure translate with Google engine
translate.engine = 'google';

const languages = ['hi', 'ur', 'bn', 'ar'];
const languageNames = {
  hi: 'Hindi',
  ur: 'Urdu',
  bn: 'Bengali',
  ar: 'Arabic',
};

async function autoTranslate() {
  try {
    console.log('🌍 Starting auto-translation process...\n');

    // Read English translations as source of truth
    const enPath = path.join(localesDir, 'en.json');
    const enContent = fs.readFileSync(enPath, 'utf-8');
    const enTranslations = JSON.parse(enContent);

    console.log(`📖 Source (English): ${Object.keys(enTranslations).length} keys\n`);

    // Process each target language
    for (const lang of languages) {
      console.log(`🔄 Processing ${languageNames[lang]} (${lang})...`);
      const langPath = path.join(localesDir, `${lang}.json`);
      
      let langTranslations = {};
      if (fs.existsSync(langPath)) {
        const langContent = fs.readFileSync(langPath, 'utf-8');
        langTranslations = JSON.parse(langContent);
      }

      let missingCount = 0;
      const updatedTranslations = { ...langTranslations };

      // Check for missing keys and translate them
      for (const [key, enValue] of Object.entries(enTranslations)) {
        if (!updatedTranslations[key]) {
          try {
            console.log(`   ⏳ Translating: "${key}"`);
            const translatedValue = await translate(enValue, { to: lang });
            updatedTranslations[key] = translatedValue;
            missingCount++;
            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.log(`   ⚠️  Failed to translate "${key}": ${error.message}`);
            // Keep the English value as fallback
            updatedTranslations[key] = enValue;
          }
        }
      }

      // Save updated translations
      fs.writeFileSync(langPath, JSON.stringify(updatedTranslations, null, 2) + '\n', 'utf-8');
      console.log(`   ✅ ${languageNames[lang]}: ${missingCount} new translations added\n`);
    }

    console.log('✨ Auto-translation complete!');
  } catch (error) {
    console.error('❌ Error during auto-translation:', error);
    process.exit(1);
  }
}

autoTranslate();
