// Simple console-based logger for now
const log = {
    info: (msg: string) => console.log(`ℹ️ [INFO]: ${msg}`),
    warn: (msg: string) => console.warn(`⚠️ [WARN]: ${msg}`),
    error: (msg: string, err?: any) => console.error(`❌ [ERROR]: ${msg}`, err || ''),
  };
  
  export default log;
  