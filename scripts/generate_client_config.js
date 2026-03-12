const fs = require('fs');
const path = require('path');

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const result = {};
  const raw = fs.readFileSync(filePath, 'utf8');

  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) {
      result[key] = value;
    }
  });

  return result;
}

const rootDir = path.resolve(__dirname, '..');
const fileEnv = readEnvFile(path.join(rootDir, '.env.local'));

function getEnv(name) {
  return process.env[name] || fileEnv[name] || '';
}

const supabaseUrl = getEnv('SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const hasPlaceholders =
  (supabaseUrl || '').includes('YOUR_NEW_SUPABASE_URL') ||
  (supabaseAnonKey || '').includes('YOUR_NEW_SUPABASE_ANON_KEY');

if (!supabaseUrl || hasPlaceholders) {
  console.error('Missing real SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}

if (!supabaseAnonKey || hasPlaceholders) {
  console.error('Missing real SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const targetPath = path.resolve(__dirname, '..', 'src', 'js', 'config.js');

const content = `(function initZiratConfig(global) {
  if (global.ZiratConfig && typeof global.ZiratConfig.getSupabaseConfig === 'function') {
    return;
  }

  var config = Object.freeze({
    SUPABASE_URL: ${JSON.stringify(supabaseUrl)},
    SUPABASE_ANON_KEY: ${JSON.stringify(supabaseAnonKey)},
  });

  Object.defineProperty(global, 'ZiratConfig', {
    value: Object.freeze({
      getSupabaseConfig: function getSupabaseConfig() {
        return config;
      },
    }),
    writable: false,
    configurable: false,
    enumerable: false,
  });
})(window);
`;

fs.writeFileSync(targetPath, content, 'utf8');
console.log(`Generated ${targetPath}`);
